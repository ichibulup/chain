import type { Session, User as SupaUser } from "@supabase/supabase-js";
import type { Address as AddressType } from "lib/interfaces";
import { UserShortly } from "lib/interfaces";
import { UserStatus, AuthProvider, UserRole, RestaurantStaffRole, OrganizationRole } from "lib/interfaces";
import type {
  CreateUser,
  CreateAddress,
  UpdateAddress,
  AddressQuery,
  SyncFromSupabaseInput,
  UpdateProfileInput,
  SetGlobalRoleInput,
  AddRestaurantRoleInput,
  RemoveRestaurantRoleInput,
} from "@/schemas/user";
import { Prisma } from "@prisma/client/index";
import { httpError } from "@/middlewares/error";
import { Address } from '@/models/customer';
import { User } from '@/models/organization';
import { Database } from '@/models/database';
import { createAdministrator } from "@/lib/supabase/admin";
import {
  buildAppMetadataFromDB,
  buildUserMetadataFromDBFull,
  getUserOrgRestaurant,
  mapProvider,
  normalizeEmail,
} from "@/lib/utils/formatters";
import {
  checkUserExists
} from '@/services/helper'
import { Logging } from "@/lib/logging";
// const prisma = new PrismaClient();

type NormalizedSupabaseUser = SyncFromSupabaseInput & {
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  providers?: string[];
};

function normalizeSupabaseUser(raw: SupaUser | SyncFromSupabaseInput): NormalizedSupabaseUser {
  const u = raw as SyncFromSupabaseInput;
  const userMetadata =
    (u.user_metadata ?? u.raw_user_meta_data ?? {}) as Record<string, any>;
  const appMetadata =
    (u.app_metadata ?? u.raw_app_meta_data ?? {}) as Record<string, any>;
  const providers =
    Array.isArray(u.providers)
      ? u.providers
      : Array.isArray(u.raw_app_meta_data?.providers)
        ? u.raw_app_meta_data?.providers
        : undefined;

  return {
    ...u,
    user_metadata: userMetadata,
    app_metadata: appMetadata,
    providers,
  };
}

export async function checkLoginAttempts(email: string) {
  const user = await User.findUnique({
    where: { email },
  });

  if (!user) return true; // Allow attempt if user doesn't exist (don't reveal)

  // Check if account is locked
  if (user.locked && user.lockoutExpiresInSeconds) {
    const lockoutExpiry = new Date(
      user.updatedAt.getTime() + user.lockoutExpiresInSeconds * 1000
    );
    if (lockoutExpiry > new Date()) {
      throw httpError(423, "Account is locked. Please try again later.");
    } else {
      // Unlock account
      await User.update({
        where: { id: user.id },
        data: { locked: false, lockoutExpiresInSeconds: null },
      });
    }
  }

  return true;
}

export async function recordFailedLogin(email: string) {
  const user = await User.findUnique({
    where: { email },
  });

  if (!user) return;

  // Get failed attempts from metadata
  const metadata = (user.privateMetadata as any) || {};
  const failedAttempts = (metadata.failedLoginAttempts || 0) + 1;
  const maxAttempts = 5;

  if (failedAttempts >= maxAttempts) {
    // Lock account for 30 minutes
    await User.update({
      where: { id: user.id },
      data: {
        locked: true,
        lockoutExpiresInSeconds: 30 * 60, // 30 minutes
        privateMetadata: {
          ...metadata,
          failedLoginAttempts: 0,
          lastLockoutAt: new Date().toISOString(),
        },
      },
    });
  } else {
    await User.update({
      where: { id: user.id },
      data: {
        privateMetadata: {
          ...metadata,
          failedAttempts,
          lastFailedAt: new Date().toISOString(),
        },
      },
    });
  }
}

export async function resetFailedLogins(userId: string) {
  const user = await User.findUnique({ where: { id: userId } });
  if (!user) return;

  const metadata = (user.privateMetadata as any) || {};
  if (metadata.failedLoginAttempts) {
    await User.update({
      where: { id: userId },
      data: {
        privateMetadata: {
          ...metadata,
          failedLoginAttempts: 0,
        },
      },
    });
  }
}

export async function syncFromSupabase(raw: SupaUser | SyncFromSupabaseInput) {
  try {
    const u = normalizeSupabaseUser(raw);

    const emailRaw: string | undefined =
      u.email ?? (u.user_metadata?.email as string | undefined);
    const safeEmail = (emailRaw ?? `${u.id}@auth.local`).trim();
    const emailNormalized = safeEmail.toLowerCase();

    const fullName =
      (u.user_metadata?.full_name as string | undefined) ||
      (u.user_metadata?.name as string | undefined) ||
      [u.user_metadata?.first_name, u.user_metadata?.last_name]
        .filter(Boolean)
        .join(" ") ||
      undefined;

    const avatarUrl =
      (u.user_metadata?.avatar_url as string | undefined) ?? undefined;

    const emailConfirmedAt = u.email_confirmed_at ?? u.confirmed_at ?? undefined;
    const emailVerifiedAt = emailConfirmedAt ? new Date(emailConfirmedAt) : undefined;

    const lastSignInAt =
      u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date();

    const lastProvider = mapProvider(
      (u.app_metadata?.provider as string | undefined) ??
      (u.user_metadata?.provider as string | undefined)
    ) as AuthProvider | null;

    // Build providers list from identities + last provider
    const providersSet = new Set<AuthProvider>();
    if (Array.isArray(u.identities)) {
      for (const ident of u.identities) {
        const p = mapProvider(ident.provider as string | undefined) as AuthProvider | null;
        if (p) providersSet.add(p);
      }
    }
    if (lastProvider) providersSet.add(lastProvider);
    const providers = Array.from(providersSet);

    // Optional username/phone
    const username =
      (u.user_metadata?.preferred_username as string | undefined) ??
      (u.user_metadata?.username as string | undefined) ??
      undefined;

    const phoneNumber = (u.phone as string | undefined) ?? undefined;

    const createData = {
      id: u.id,
      supabaseUserId: u.id,
      email: safeEmail,
      emailNormalized,
      username,
      fullName,
      avatarUrl,
      phoneNumber,
      emailVerifiedAt,
      role: UserRole.customer,
      status: UserStatus.active,
      activityStatus: undefined, // để default available
      isOnline: false,
      lastSignInAt,
      publicMetadata: (u.user_metadata as object) ?? {},
      externalAccounts: Array.isArray(u.identities)
        ? { identities: u.identities }
        : undefined,
      providers, // gán trực tiếp khi create
      lastProvider: lastProvider ?? undefined,
    };

    const updateData = {
      supabaseUserId: u.id,
      email: safeEmail,
      emailNormalized,
      username,
      fullName,
      avatarUrl,
      phoneNumber,
      emailVerifiedAt,
      lastSignInAt,
      publicMetadata: (u.user_metadata as object) ?? {},
      // chỉ cập nhật nếu có identities, để không xoá mất dữ liệu cũ
      externalAccounts: Array.isArray(u.identities)
        ? { identities: u.identities }
        : undefined,
      // với mảng enum phải dùng set khi update
      providers: { set: providers },
      lastProvider: lastProvider ?? undefined,
    };

    const existingUser = await User.findFirst({
      where: {
        OR: [
          { supabaseUserId: u.id },
          { id: u.id },
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return await User.update({
        where: { id: existingUser.id },
        data: updateData,
      });
    }

    return await User.create({ data: createData });
  } catch (err) {
    // Để service/controller phía trên bắt
    throw err;
  }
}

/**
 * Get users with filtering, searching and pagination
 */
export async function getUser(query: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  activityStatus?: string;
  isOnline?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      role,
      activityStatus,
      isOnline,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.role = role;
    }

    if (activityStatus) {
      where.activityStatus = activityStatus;
    }

    if (isOnline !== undefined) {
      where.isOnline = isOnline;
    }

    // Get total count
    const total = await User.count({ where });

    // Get users with pagination
    const users = await User.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        username: true,
        email: true,
        emailNormalized: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phoneCode: true,
        phoneNumber: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        status: true,
        role: true,
        activityStatus: true,
        isOnline: true,
        lastActivityAt: true,
        lastSeenAt: true,
        dateOfBirth: true,
        gender: true,
        loyaltyPoints: true,
        totalOrders: true,
        totalSpent: true,
        lastSignInAt: true,
        supabaseUserId: true,
        providers: true,
        lastProvider: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields
      },
    });

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getUser service:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
const userSelect = {
  id: true,
  username: true,
  email: true,
  emailNormalized: true,
  firstName: true,
  lastName: true,
  fullName: true,
  phoneCode: true,
  phoneNumber: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  status: true,
  role: true,
  activityStatus: true,
  isOnline: true,
  lastActivityAt: true,
  lastSeenAt: true,
  dateOfBirth: true,
  gender: true,
  loyaltyPoints: true,
  totalOrders: true,
  totalSpent: true,
  lastSignInAt: true,
  supabaseUserId: true,
  providers: true,
  lastProvider: true,
  publicMetadata: true,
  createdAt: true,
  updatedAt: true,
  // Relations if needed
  addresses: {
    select: {
      id: true,
      recipientName: true,
      recipientPhone: true,
      streetAddress: true,
      ward: true,
      district: true,
      city: true,
      country: true,
      isDefault: true,
    },
  },
  userStatistics: true,
} as const;

async function getUserByWhere(where: Prisma.UserWhereUniqueInput) {
  const user = await User.findUnique({
    where,
    select: userSelect,
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function getUserByIdentifier(params: { id?: string; supabaseUserId?: string }) {
  try {
    if (params.id) {
      return await getUserByWhere({ id: params.id });
    }
    if (params.supabaseUserId) {
      return await getUserByWhere({ supabaseUserId: params.supabaseUserId });
    }
    throw new Error('User not found');
  } catch (error) {
    console.error('Error in getUserByIdentifier service:', error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    return await getUserByIdentifier({ id });
  } catch (error) {
    console.error('Error in getUserById service:', error);
    throw error;
  }
}

/**
 * Create new user
 */
export async function createUser(
  data: CreateUser,
  options?: { creatorId?: string | null }
) {
  try {
    // Normalize email
    const emailNormalized = data.email.toLowerCase().trim();
    const allowedRoles = new Set<UserRole>([
      UserRole.manager,
      UserRole.staff,
      UserRole.delivery,
      UserRole.warehouse,
      UserRole.customer,
    ]);
    const role = (data.role as UserRole | undefined) ?? UserRole.customer;
    const requestedRestaurantId =
      typeof data.restaurantId === 'string' && data.restaurantId.trim().length > 0
        ? data.restaurantId
        : null;

    if (!allowedRoles.has(role)) {
      throw new Error('Role not allowed for admin creation');
    }

    const resolveCreatorScope = async (tx: Prisma.TransactionClient) => {
      if (!options?.creatorId) {
        throw new Error('Creator is required');
      }

      const creatorMembership =
        (await tx.organizationMembership.findFirst({
          where: {
            userId: options.creatorId,
            role: OrganizationRole.admin,
          },
          orderBy: { createdAt: 'asc' },
        })) ??
        (await tx.organizationMembership.findFirst({
          where: { userId: options.creatorId },
          orderBy: { createdAt: 'asc' },
        }));

      const ownedOrganization = await tx.organization.findFirst({
        where: { ownerId: options.creatorId },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      const organizationId = creatorMembership?.organizationId ?? ownedOrganization?.id ?? null;

      if (!organizationId) {
        throw new Error('Organization not found for creator');
      }

      let restaurantId: string | null = null;

      if (requestedRestaurantId) {
        const selectedRestaurant = await tx.restaurant.findFirst({
          where: { id: requestedRestaurantId, organizationId },
          select: { id: true },
        });

        if (!selectedRestaurant) {
          throw new Error('Restaurant not found for organization');
        }

        restaurantId = selectedRestaurant.id;
      } else {
        const managedRestaurant = await tx.restaurant.findFirst({
          where: { managerId: options.creatorId },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });

        const staffRestaurant = await tx.restaurantUserRole.findFirst({
          where: { userId: options.creatorId },
          select: { restaurantId: true },
          orderBy: { joinedAt: 'asc' },
        });

        const fallbackRestaurant = await tx.restaurant.findFirst({
          where: { organizationId },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });

        restaurantId =
          managedRestaurant?.id ?? staffRestaurant?.restaurantId ?? fallbackRestaurant?.id ?? null;
      }

      return { organizationId, restaurantId };
    };

    // Check if user already exists
    const existingUser = await User.findFirst({
      where: {
        OR: [
          { email: data.email },
          { emailNormalized },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.role !== UserRole.customer) {
        throw new Error('User already exists with this email');
      }

      const admin = createAdministrator();

      const updatedUser = await Database.$transaction(async (tx) => {
        const { organizationId, restaurantId } = await resolveCreatorScope(tx);

        const membershipRole =
          role === UserRole.customer ? OrganizationRole.guest : OrganizationRole.member;

        const existingMembership = await tx.organizationMembership.findUnique({
          where: {
            organizationId_userId: {
              organizationId,
              userId: existingUser.id,
            },
          },
          select: { role: true },
        });

        const rolePriority: Record<OrganizationRole, number> = {
          [OrganizationRole.admin]: 3,
          [OrganizationRole.member]: 2,
          [OrganizationRole.guest]: 1,
        };

        const nextRole =
          existingMembership && rolePriority[existingMembership.role] > rolePriority[membershipRole]
            ? existingMembership.role
            : membershipRole;

        await tx.organizationMembership.upsert({
          where: {
            organizationId_userId: {
              organizationId,
              userId: existingUser.id,
            },
          },
          create: {
            organizationId,
            userId: existingUser.id,
            role: nextRole,
            joinedAt: new Date(),
          },
          update: {
            role: nextRole,
          },
        });

        if (role !== UserRole.customer) {
          if (!restaurantId) {
            throw new Error('Restaurant not found for creator');
          }

          const staffRole =
            role === UserRole.manager ? RestaurantStaffRole.manager : RestaurantStaffRole.staff;

          await tx.restaurantUserRole.upsert({
            where: {
              restaurantId_userId: {
                restaurantId,
                userId: existingUser.id,
              },
            },
            create: {
              restaurantId,
              userId: existingUser.id,
              role: staffRole,
              status: 'active',
              joinedAt: new Date(),
            },
            update: {
              role: staffRole,
              status: 'active',
              leftAt: null,
            },
          });

          if (existingUser.role !== role) {
            return tx.user.update({
              where: { id: existingUser.id },
              data: { role },
            });
          }
        }

        return existingUser;
      });

      try {
        const { organization, restaurant } = await getUserOrgRestaurant(updatedUser.id);
        const userMetadata = buildUserMetadataFromDBFull(updatedUser as any);
        const appMetadata = buildAppMetadataFromDB({
          user: updatedUser,
          organization,
          restaurant,
        });

        await admin.auth.admin.updateUserById(
          updatedUser.supabaseUserId ?? updatedUser.id,
          {
            user_metadata: userMetadata,
            app_metadata: appMetadata,
          }
        );
      } catch (syncError) {
        console.error('Failed to sync user metadata to Supabase:', syncError);
      }

      return updatedUser;
    }

    // Check username uniqueness if provided
    if (data.username) {
      const existingUsername = await User.findUnique({
        where: { username: data.username },
      });

      if (existingUsername) {
        throw new Error('Username already taken');
      }
    }

    const admin = createAdministrator();
    const fullName =
      data.fullName?.trim() ||
      [data.firstName, data.lastName].filter(Boolean).join(' ').trim() ||
      undefined;

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: {
        ...(data.firstName ? { first_name: data.firstName } : {}),
        ...(data.lastName ? { last_name: data.lastName } : {}),
        ...(fullName ? { full_name: fullName, name: fullName } : {}),
        ...(data.username ? { username: data.username } : {}),
        ...(data.avatarUrl ? { avatar_url: data.avatarUrl } : {}),
      },
      app_metadata: {
        role,
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes('already')) {
        throw new Error('User already exists with this email');
      }
      throw authError;
    }

    if (!authData?.user?.id) {
      throw new Error('Failed to create Supabase user');
    }

    const supabaseUserId = authData.user.id;
    let createdUser: Awaited<ReturnType<typeof User.create>>;

    try {
      const result = await Database.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            emailNormalized,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName,
            phoneCode: data.phoneCode,
            phoneNumber: data.phoneNumber,
            avatarUrl: data.avatarUrl,
            status: data.status as any || UserStatus.active,
            role,
            activityStatus: data.activityStatus as any || 'available',
            emailVerifiedAt: data.emailVerifiedAt,
            phoneVerifiedAt: data.phoneVerifiedAt,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            publicMetadata: data.publicMetadata,
            privateMetadata: data.privateMetadata,
            unsafeMetadata: data.unsafeMetadata,
            supabaseUserId,
          },
        });

        const { organizationId, restaurantId } = await resolveCreatorScope(tx);

        const membershipRole =
          role === UserRole.customer ? OrganizationRole.guest : OrganizationRole.member;

        await tx.organizationMembership.create({
          data: {
            organizationId,
            userId: user.id,
            role: membershipRole,
            joinedAt: new Date(),
          },
        });

        if (role !== UserRole.customer) {
          if (!restaurantId) {
            throw new Error('Restaurant not found for creator');
          }

          const staffRole =
            role === UserRole.manager ? RestaurantStaffRole.manager : RestaurantStaffRole.staff;

          await tx.restaurantUserRole.upsert({
            where: {
              restaurantId_userId: {
                restaurantId,
                userId: user.id,
              },
            },
            create: {
              restaurantId,
              userId: user.id,
              role: staffRole,
              status: 'active',
              joinedAt: new Date(),
            },
            update: {
              role: staffRole,
              status: 'active',
              leftAt: null,
            },
          });
        }

        return { user };
      });

      createdUser = result.user;
    } catch (dbError) {
      try {
        await admin.auth.admin.deleteUser(supabaseUserId);
      } catch (cleanupError) {
        console.error('Failed to rollback Supabase user:', cleanupError);
      }
      throw dbError;
    }

    try {
      const { organization, restaurant } = await getUserOrgRestaurant(createdUser.id);
      const userMetadata = buildUserMetadataFromDBFull(createdUser as any);
      const appMetadata = buildAppMetadataFromDB({
        user: createdUser,
        organization,
        restaurant,
      });

      await admin.auth.admin.updateUserById(supabaseUserId, {
        user_metadata: userMetadata,
        app_metadata: appMetadata,
      });
    } catch (syncError) {
      console.error('Failed to sync user metadata to Supabase:', syncError);
    }

    return createdUser;
  } catch (error) {
    console.error('Error in createUser service:', error);
    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(id: string, data: {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phoneCode?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status?: string;
  role?: string;
  activityStatus?: string;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  publicMetadata?: any;
  privateMetadata?: any;
  unsafeMetadata?: any;
}) {
  try {
    // Check if user exists (after potential Supabase sync)
    const existingUser = await User.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check username uniqueness if provided and changed
    if (data.username && data.username !== existingUser.username) {
      const existingUsername = await User.findUnique({
        where: { username: data.username },
      });

      if (existingUsername) {
        throw new Error('Username already taken');
      }
    }

    // Update user
    const updateData: any = {};

    // Only include fields that are provided
    if (data.username !== undefined) updateData.username = data.username;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phoneCode !== undefined) updateData.phoneCode = data.phoneCode;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.activityStatus !== undefined) updateData.activityStatus = data.activityStatus;
    if (data.emailVerifiedAt !== undefined) updateData.emailVerifiedAt = data.emailVerifiedAt;
    if (data.phoneVerifiedAt !== undefined) updateData.phoneVerifiedAt = data.phoneVerifiedAt;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.publicMetadata !== undefined) updateData.publicMetadata = data.publicMetadata;
    if (data.privateMetadata !== undefined) updateData.privateMetadata = data.privateMetadata;
    if (data.unsafeMetadata !== undefined) updateData.unsafeMetadata = data.unsafeMetadata;

    const user = await User.update({
      where: { id },
      data: updateData,
    });

    try {
      await syncUserDbToAuthByLookupId(user.id);
    } catch (error) {
      console.warn(`⚠️ Failed to sync DB → Supabase for user ${id}:`, error);
    }

    return user;
  } catch (error) {
    console.error('Error in updateUser service:', error);
    throw error;
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(id: string, data: {
  status: string;
  reason?: string;
}) {
  try {
    // Check if user exists
    const existingUser = await User.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Update user status
    const updateData: any = {
      status: data.status,
    };

    // Store reason in privateMetadata if provided
    if (data.reason) {
      const privateMetadata = (existingUser.privateMetadata as any) || {};
      updateData.privateMetadata = {
        ...privateMetadata,
        statusChangeHistory: [
          ...((privateMetadata.statusChangeHistory as any[]) || []),
          {
            from: existingUser.status,
            to: data.status,
            reason: data.reason,
            changedAt: new Date().toISOString(),
          },
        ],
      };
    }

    // Handle status-specific logic
    if (data.status === 'banned' || data.status === 'suspended') {
      updateData.locked = true;
    } else if (data.status === 'active') {
      updateData.locked = false;
      updateData.lockoutExpiresInSeconds = null;
    }

    const user = await User.update({
      where: { id },
      data: updateData,
    });

    return user;
  } catch (error) {
    console.error('Error in updateUserStatus service:', error);
    throw error;
  }
}

/**
 * Update user activity
 */
export async function updateUserActivity(id: string, data: {
  activityStatus?: string;
  isOnline?: boolean;
  lastActivityAt?: Date;
  lastSeenAt?: Date;
}) {
  try {
    // Check if user exists
    const existingUser = await User.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Build update data
    const updateData: any = {};

    if (data.activityStatus !== undefined) {
      updateData.activityStatus = data.activityStatus;
    }

    if (data.isOnline !== undefined) {
      updateData.isOnline = data.isOnline;
      // Auto update lastActivityAt when going online
      if (data.isOnline) {
        updateData.lastActivityAt = new Date();
      } else {
        updateData.lastSeenAt = new Date();
      }
    }

    if (data.lastActivityAt !== undefined) {
      updateData.lastActivityAt = data.lastActivityAt;
    }

    if (data.lastSeenAt !== undefined) {
      updateData.lastSeenAt = data.lastSeenAt;
    }

    const user = await User.update({
      where: { id },
      data: updateData,
    });

    return user;
  } catch (error) {
    console.error('Error in updateUserActivity service:', error);
    throw error;
  }
}

/**
 * Delete user (soft delete by setting status to inactive)
 */
export async function deleteUser(id: string) {
  try {
    // Check if user exists
    const existingUser = await User.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Soft delete: set status to inactive
    await User.update({
      where: { id },
      data: {
        status: 'inactive',
        deleteSelfEnabled: false,
      },
    });

    // If you want hard delete, uncomment:
    // await User.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error in deleteUser service:', error);
    throw error;
  }
}

/**
 * Reset Supabase user/app metadata to null
 */
export async function resetUser(id: string) {
  try {
    const admin = createAdministrator();

    const dbUser = await User.findUnique({
      where: { id },
      select: { id: true, supabaseUserId: true },
    });

    let supabaseId = id;

    if (dbUser?.supabaseUserId) {
      supabaseId = dbUser.supabaseUserId;
    } else if (dbUser?.id) {
      supabaseId = dbUser.id;
    } else {
      const lookupUser = await User.findFirst({
        where: { supabaseUserId: id },
        select: { id: true, supabaseUserId: true },
      });

      if (lookupUser?.supabaseUserId) {
        supabaseId = lookupUser.supabaseUserId;
      } else if (lookupUser?.id) {
        supabaseId = lookupUser.id;
      }
    }

    const { data, error } = await admin.auth.admin.updateUserById(supabaseId, {
      app_metadata: null as any,
      user_metadata: null as any,
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      userId: supabaseId,
      data,
    };
  } catch (error) {
    console.error('Error in resetUser service:', error);
    throw error;
  }
}

/**
 * Sync User from Database to Supabase Auth
 */
async function syncUserDbToAuthByLookupId(lookupId: string) {
  const admin = createAdministrator();
  const existingDbUser =
    (await User.findUnique({ where: { id: lookupId } })) ??
    (await User.findFirst({ where: { supabaseUserId: lookupId } }));

  if (!existingDbUser) {
    throw httpError(404, "User not found");
  }

  const { organization, restaurant } = await getUserOrgRestaurant(existingDbUser.id);
  const userMetadata = buildUserMetadataFromDBFull(existingDbUser as any);
  const appMetadata = buildAppMetadataFromDB({
    user: existingDbUser,
    organization,
    restaurant,
  });

  await admin.auth.admin.updateUserById(existingDbUser.supabaseUserId ?? lookupId, {
    user_metadata: userMetadata,
    app_metadata: appMetadata,
  });

  console.log(Logging(`Synced DB → Auth metadata for user ${existingDbUser.id}`, "success", "green"));

  return existingDbUser;
}

export async function syncUserDbToAuth(input: unknown) {
  try {
    const { session } = input as { session: Session };
    const lookupId = session.user.id;
    const existingDbUser = await syncUserDbToAuthByLookupId(lookupId);

    return {
      success: true,
      message: 'User synced DB → Auth successfully',
      userId: existingDbUser.id,
    };
  } catch (error) {
    console.error(Logging(`Error in sync BD → Auth service: ${error}`, "error", "red"));
    throw error;
  }
}

/**
 * Sync User from Supabase Auth to Database
 */
async function syncAuthCoreToDb(raw: SupaUser | SyncFromSupabaseInput) {
  const u = normalizeSupabaseUser(raw);

  const existingById = await User.findUnique({
    where: { id: u.id },
    select: {
      id: true,
      email: true,
      emailNormalized: true,
      emailVerifiedAt: true,
      phoneNumber: true,
      phoneVerifiedAt: true,
      lastSignInAt: true,
      providers: true,
      lastProvider: true,
      supabaseUserId: true,
    },
  });

  const existingBySupabaseId = existingById
    ? null
    : await User.findFirst({
        where: { supabaseUserId: u.id },
        select: {
          id: true,
          email: true,
          emailNormalized: true,
          emailVerifiedAt: true,
          phoneNumber: true,
          phoneVerifiedAt: true,
          lastSignInAt: true,
          providers: true,
          lastProvider: true,
          supabaseUserId: true,
        },
      });

  const existingDbUser = existingById ?? existingBySupabaseId;
  const dbUserId = existingDbUser?.id ?? u.id;

  const email =
    u.email ??
    existingDbUser?.email ??
    `unknown+${u.id}@example.local`;
  const emailNormalized = normalizeEmail(email);

  const emailConfirmedAt = u.email_confirmed_at ?? u.confirmed_at;
  const emailVerifiedAt =
    emailConfirmedAt === undefined
      ? existingDbUser?.emailVerifiedAt ?? null
      : emailConfirmedAt
        ? new Date(emailConfirmedAt)
        : null;

  const phoneNumber =
    u.phone === undefined ? existingDbUser?.phoneNumber ?? null : u.phone ?? null;

  const lastSignInAt =
    u.last_sign_in_at ? new Date(u.last_sign_in_at) : existingDbUser?.lastSignInAt ?? new Date();

  const providersSet = new Set<AuthProvider>();
  if (Array.isArray(u.providers)) {
    for (const provider of u.providers) {
      const mapped = mapProvider(provider) as AuthProvider | null;
      if (mapped) providersSet.add(mapped);
    }
  }
  if (Array.isArray(u.identities)) {
    for (const ident of u.identities) {
      const mapped = mapProvider(ident.provider as string | undefined) as AuthProvider | null;
      if (mapped) providersSet.add(mapped);
    }
  }

  const providers = Array.from(providersSet);
  const lastProvider =
    providers.length > 0 ? providers[providers.length - 1] : existingDbUser?.lastProvider ?? null;

  const externalAccounts = Array.isArray(u.identities) ? { identities: u.identities } : undefined;

  const createData: Prisma.UserCreateInput = {
    id: dbUserId,
    supabaseUserId: u.id,
    email,
    emailNormalized,
    emailVerifiedAt,
    phoneNumber,
    phoneVerifiedAt: existingDbUser?.phoneVerifiedAt ?? null,
    providers,
    lastProvider: lastProvider ?? undefined,
    lastSignInAt,
    externalAccounts,
    role: UserRole.customer,
    status: "active" as any,
    activityStatus: "available" as any,
    isOnline: false,
    loyaltyPoints: 0,
    totalOrders: 0,
    totalSpent: 0,
  };

  const updateData: Prisma.UserUpdateInput = {
    supabaseUserId: u.id,
    email,
    emailNormalized,
    emailVerifiedAt,
    phoneNumber,
    lastSignInAt,
  };

  if (existingDbUser?.phoneVerifiedAt) {
    updateData.phoneVerifiedAt = existingDbUser.phoneVerifiedAt;
  }

  if (providers.length > 0) {
    updateData.providers = { set: providers };
  }

  if (lastProvider) {
    updateData.lastProvider = lastProvider;
  }

  if (externalAccounts) {
    updateData.externalAccounts = externalAccounts;
  }

  const dbUser = await User.upsert({
    where: { id: dbUserId },
    create: createData,
    update: updateData,
  });

  return dbUser;
}

export async function syncUserAuthToDb(input: unknown) {
  try {
    const { session } = input as { session: Session };
    const dbUser = await syncAuthCoreToDb(session.user);

    console.log(Logging(`Synced Auth → DB for user ${dbUser.id}`, "success", "green"));

    return {
      success: true,
      message: 'User synced Auth → DB successfully',
      userId: dbUser.id,
    };
  } catch (error) {
    console.error(Logging(`Error in sync Auth → DB service: ${error}`, "error", "red"));
    // console.error('Error in syncUserAuthToDb service:', error);
    throw error;
  }
}

/**
 * Sync User: Auth core fields → DB, then DB metadata → Auth
 */
export async function syncUser(input: unknown) {
  try {
    const { session } = input as { session: Session };

    const authToDb = await syncUserAuthToDb({ session });
    const dbToAuth = await syncUserDbToAuth({ session });

    return {
      success: true,
      message: 'User synced successfully',
      authToDb,
      dbToAuth,
    };
  } catch (error: any) {
    console.error('❌ Error syncing user:', error);
    throw error;
  }
}

// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================

// =========================
// ADDRESS SERVICES
// =========================

/**
 * Create a new address
 */
export const createAddress = async (data: CreateAddress): Promise<AddressType> => {
  try {
    // Validate user exists
    const userExists = await checkUserExists(data.userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // If this address is set as default, unset other default addresses for this user
    if (data.isDefault) {
      await Address.updateMany({
        where: { userId: data.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await Address.create({
      data: {
        userId: data.userId,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        streetAddress: data.streetAddress,
        ward: data.ward || null,
        district: data.district,
        city: data.city,
        country: data.country || 'Vietnam',
        latitude: data.latitude !== undefined ? new Prisma.Decimal(data.latitude) : null,
        longitude: data.longitude !== undefined ? new Prisma.Decimal(data.longitude) : null,
        tag: data.tag || null,
        note: data.note || null,
        isDefault: data.isDefault ?? false,
      },
    });

    return address as AddressType;
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
};

/**
 * Get address by ID
 */
export const getAddressById = async (id: string): Promise<AddressType | null> => {
  try {
    const address = await Address.findUnique({
      where: { id },
      include: {
        user: {
          select: UserShortly,
        },
      },
    });

    return address as AddressType | null;
  } catch (error) {
    console.error('Error getting address by ID:', error);
    throw error;
  }
};

/**
 * Get all addresses with filtering and pagination
 */
export const getAddresses = async (
  query: AddressQuery
): Promise<{ data: AddressType[]; pagination: any }> => {
  try {
    const { userId, city, district, tag, isDefault, search, page, limit, sortBy, sortOrder } =
      query;

    // Build where clause
    const where: Prisma.AddressWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (city) {
      where.city = city;
    }

    if (district) {
      where.district = district;
    }

    if (tag) {
      where.tag = tag;
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    // Search across multiple fields
    if (search) {
      where.OR = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { streetAddress: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [addresses, total] = await Promise.all([
      Address.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: UserShortly,
          },
        },
      }),
      Address.count({ where }),
    ]);

    return {
      data: addresses as AddressType[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting addresses:', error);
    throw error;
  }
};

/**
 * Update address by ID
 */
export const updateAddress = async (id: string, data: UpdateAddress): Promise<AddressType> => {
  try {
    // Check if address exists
    const existingAddress = await Address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      throw new Error('Address not found');
    }

    // If setting this address as default, unset other default addresses for this user
    if (data.isDefault === true) {
      await Address.updateMany({
        where: { userId: existingAddress.userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    // Prepare update data
    const updateData: Prisma.AddressUpdateInput = {};

    if (data.recipientName !== undefined) updateData.recipientName = data.recipientName;
    if (data.recipientPhone !== undefined) updateData.recipientPhone = data.recipientPhone;
    if (data.streetAddress !== undefined) updateData.streetAddress = data.streetAddress;
    if (data.ward !== undefined) updateData.ward = data.ward;
    if (data.district !== undefined) updateData.district = data.district;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.latitude !== undefined)
      updateData.latitude = data.latitude !== null ? new Prisma.Decimal(data.latitude) : null;
    if (data.longitude !== undefined)
      updateData.longitude = data.longitude !== null ? new Prisma.Decimal(data.longitude) : null;
    if (data.tag !== undefined) updateData.tag = data.tag;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const address = await Address.update({
      where: { id },
      data: updateData,
    });

    return address as AddressType;
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

/**
 * Delete address by ID
 */
export const deleteAddress = async (id: string): Promise<void> => {
  try {
    await Address.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

/**
 * Set address as default
 */
export const setDefaultAddress = async (id: string): Promise<AddressType> => {
  try {
    // Get the address to update
    const address = await Address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // Unset other default addresses for this user
    await Address.updateMany({
      where: { userId: address.userId, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });

    // Set this address as default
    const updatedAddress = await Address.update({
      where: { id },
      data: { isDefault: true },
    });

    return updatedAddress as AddressType;
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};

/**
 * Get user's default address
 */
export const getDefaultAddress = async (userId: string): Promise<AddressType | null> => {
  try {
    const address = await Address.findFirst({
      where: { userId, isDefault: true },
    });

    return address as AddressType | null;
  } catch (error) {
    console.error('Error getting default address:', error);
    throw error;
  }
};

// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
