import { Prisma } from '@prisma/client/index';
import {
  CreateOrganization,
  UpdateOrganization,
  OrganizationQuery,
  CreateRestaurant,
  UpdateRestaurant,
  RestaurantQuery,
  CreateOrganizationMembership,
  UpdateOrganizationMembership,
  OrganizationMembershipQuery,
  CreateRestaurantChain,
  UpdateRestaurantChain,
  RestaurantChainQuery,
  CreateRestaurantUserRole,
  UpdateRestaurantUserRole,
  RestaurantUserRoleQuery,
  BulkAddMembers,
  BulkUpdateMemberRoles,
  BulkAddStaff,
  TransferOwnership, TransferManagership, TransferRestaurantStaff,
} from '@/schemas/organization';
import { z } from "zod";
import {
  Organization,
  OrganizationMembership,
  Restaurant,
  RestaurantChain,
  RestaurantUserRole,
  User,
} from '@/models/organization';
import {
  OrganizationRole, RestaurantShortly, RestaurantStaffRole, UserShortly
} from "@/lib/interfaces"
import { Database } from '@/models/database';

// =========================
// ORGANIZATION SERVICES
// =========================

/**
 * Create a new organization
 */
export const createOrganization = async (data: CreateOrganization, userId?: string | null) => {
  try {
    const organization = await Organization.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        ownerId: data.ownerId,
        logoUrl: data.logoUrl || null,
        createdById: userId || null,
      },
    });

    await OrganizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: data.ownerId,
        },
      },
      create: {
        organizationId: organization.id,
        userId: data.ownerId,
        role: OrganizationRole.admin,
        joinedAt: new Date(),
      },
      update: {
        role: OrganizationRole.admin,
      },
    });

    const organizationWithDetails = await Organization.findUnique({
      where: { id: organization.id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            chains: true,
            restaurants: true,
            memberships: true,
          },
        },
      },
    });

    if (!organizationWithDetails) {
      throw new Error('Organization not found');
    }

    return organizationWithDetails;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        throw new Error('Organization code already exists');
      }
      if (prismaError.code === 'P2003') {
        throw new Error('Owner not found');
      }
    }
    throw error;
  }
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (id: string) => {
  try {
    const organization = await Organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        chains: {
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            createdAt: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            chains: true,
            restaurants: true,
            memberships: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Get all organizations with filtering and pagination
 */
export const getOrganizations = async (query: OrganizationQuery) => {
  try {
    const { page, limit, sortBy, sortOrder, ownerId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {};

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [organizations, total] = await Promise.all([
      Organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              chains: true,
              restaurants: true,
              memberships: true,
            },
          },
        },
      }),
      Organization.count({ where }),
    ]);

    return {
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Update organization
 */
export const updateOrganization = async (id: string, data: UpdateOrganization, userId?: string | null) => {
  try {
    const organization = await Organization.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description !== undefined ? data.description || null : undefined,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl || null : undefined,
        updatedById: userId || undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            chains: true,
            restaurants: true,
            memberships: true,
          },
        },
      },
    });

    return organization;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        throw new Error('Organization code already exists');
      }
      if (prismaError.code === 'P2025') {
        throw new Error('Organization not found');
      }
    }
    throw error;
  }
};

/**
 * Delete organization
 */
export const deleteOrganization = async (id: string, userId?: string | null) => {
  try {
    const organization = await Organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Organization deleted successfully', data: organization };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Organization not found');
      }
    }
    throw error;
  }
};

/**
 * Transfer organization ownership
 */
export const transferOwnership = async (data: TransferOwnership) => {
  try {
    const { organizationId, newOwnerId } = data;

    // Check if new owner exists
    const newOwner = await User.findUnique({
      where: { id: newOwnerId },
    });

    if (!newOwner) {
      throw new Error('New owner not found');
    }

    await OrganizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId: newOwnerId,
        },
      },
      create: {
        organizationId,
        userId: newOwnerId,
        role: OrganizationRole.admin,
        joinedAt: new Date(),
      },
      update: {
        role: OrganizationRole.admin,
      },
    });

    // Update organization owner
    const organization = await Organization.update({
      where: { id: organizationId },
      data: {
        ownerId: newOwnerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return organization;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Organization not found');
      }
    }
    throw error;
  }
};

// =========================
// ORGANIZATION MEMBERSHIP SERVICES
// =========================

/**
 * Create organization membership
 */
export const createOrganizationMembership = async (data: CreateOrganizationMembership) => {
  try {
    const membership = await OrganizationMembership.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
        joinedAt: data.joinedAt || null,
        invitedAt: data.invitedAt || null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return membership;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        throw new Error('User is already a member of this organization');
      }
      if (prismaError.code === 'P2003') {
        throw new Error('Organization or user not found');
      }
    }
    throw error;
  }
};

/**
 * Get membership by ID
 */
export const getOrganizationMembershipById = async (id: string) => {
  try {
    const membership = await OrganizationMembership.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    return membership;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Get organization memberships with filtering
 */
export const getOrganizationMemberships = async (query: OrganizationMembershipQuery) => {
  try {
    const { page, limit, sortBy, sortOrder, organizationId, userId, role } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationMembershipWhereInput = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (role) {
      where.role = role;
    }

    const [memberships, total] = await Promise.all([
      OrganizationMembership.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              logoUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      OrganizationMembership.count({ where }),
    ]);

    return {
      data: memberships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Update organization membership
 */
export const updateOrganizationMembership = async (id: string, data: UpdateOrganizationMembership) => {
  try {
    const membership = await OrganizationMembership.update({
      where: { id },
      data: {
        role: data.role,
        joinedAt: data.joinedAt !== undefined ? data.joinedAt || null : undefined,
        invitedAt: data.invitedAt !== undefined ? data.invitedAt || null : undefined,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return membership;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Membership not found');
      }
    }
    throw error;
  }
};

/**
 * Delete organization membership
 */
export const deleteOrganizationMembership = async (id: string) => {
  try {
    await OrganizationMembership.delete({
      where: { id },
    });

    return { message: 'Membership deleted successfully' };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Membership not found');
      }
    }
    throw error;
  }
};

/**
 * Bulk add members to organization
 */
export const bulkAddMembers = async (data: BulkAddMembers) => {
  try {
    const { organizationId, members } = data;

    // Verify organization exists
    const organization = await Organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Create memberships
    const memberships = await Database.$transaction(
      members.map((member) =>
        OrganizationMembership.create({
          data: {
            organizationId,
            userId: member.userId,
            role: member.role,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        })
      )
    );

    return {
      added: memberships.length,
      memberships,
    };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        throw new Error('One or more users are already members');
      }
      if (prismaError.code === 'P2003') {
        throw new Error('One or more users not found');
      }
    }
    throw error;
  }
};

/**
 * Bulk update member roles
 */
export const bulkUpdateMemberRoles = async (data: BulkUpdateMemberRoles) => {
  try {
    const { organizationId, updates } = data;

    const updatedMemberships = await Database.$transaction(
      updates.map((update) =>
        OrganizationMembership.update({
          where: {
            organizationId_userId: {
              organizationId,
              userId: update.userId,
            },
          },
          data: {
            role: update.role,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        })
      )
    );

    return {
      updated: updatedMemberships.length,
      memberships: updatedMemberships,
    };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('One or more memberships not found');
      }
    }
    throw error;
  }
};

// =========================
// ORGANIZATION SERVICES
// =========================

/**
 * Create a new restaurant
 */
export const createRestaurant = async (data: CreateRestaurant, userId?: string | null) => {
  try {
    const restaurant = await Restaurant.create({
      data: {
        organizationId: data.organizationId,
        chainId: data.chainId,
        name: data.name,
        code: data.code,
        address: data.address,
        phoneNumber: data.phoneNumber,
        email: data.email,
        description: data.description,
        managerId: data.managerId,
        coverUrl: data.coverUrl,
        logoUrl: data.logoUrl,
        status: data.status,
        timezone: data.timezone,
        createdById: userId || null,
      },
    });

    await OrganizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: data.organizationId,
          userId: data.managerId,
        },
      },
      create: {
        organizationId: data.organizationId,
        userId: data.managerId,
        role: OrganizationRole.member,
        joinedAt: new Date(),
      },
      update: {},
    });

    await RestaurantUserRole.upsert({
      where: {
        restaurantId_userId: {
          restaurantId: restaurant.id,
          userId: data.managerId,
        },
      },
      create: {
        restaurantId: restaurant.id,
        userId: data.managerId,
        role: RestaurantStaffRole.manager,
        status: 'active',
        joinedAt: new Date(),
      },
      update: {
        role: RestaurantStaffRole.manager,
        status: 'active',
        leftAt: null,
      },
    });

    const restaurantWithDetails = await Restaurant.findUnique({
      where: { id: restaurant.id },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!restaurantWithDetails) {
      throw new Error('Restaurant not found');
    }

    return restaurantWithDetails;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        throw new Error('Restaurant code already exists');
      }
      if (prismaError.code === 'P2003') {
        throw new Error('Owner not found');
      }
    }
    throw error;
  }
};

/**
 * Get restaurant by ID
 */
export const getRestaurantById = async (id: string) => {
  try {
    const restaurant = await Restaurant.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        chain: {
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            createdAt: true,
          },
        },
        staffRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            // memberships: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    return restaurant;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Get all restaurants with filtering and pagination
 */
export const getRestaurants = async (query: RestaurantQuery) => {
  try {
    const { page, limit, sortBy, sortOrder, managerId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RestaurantWhereInput = {};

    if (managerId) {
      where.managerId = managerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          manager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              staffRoles: true,
            },
          },
        },
      }),
      Restaurant.count({ where }),
    ]);

    return {
      data: restaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Update organization
 */
export const updateRestaurant = async (id: string, data: UpdateRestaurant, userId?: string | null) => {
  try {
    const restaurant = await Restaurant.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        chainId: data.chainId,
        address: data.address,
        phoneNumber: data.phoneNumber,
        email: data.email,
        description: data.description !== undefined ? data.description || null : undefined,
        coverUrl: data.coverUrl,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl || null : undefined,
        status: data.status,
        timezone: data.timezone,
        updatedById: userId || undefined,
      },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            staffRoles: true,
          },
        },
      },
    });

    return restaurant;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        throw new Error('Restaurant code already exists');
      }
      if (prismaError.code === 'P2025') {
        throw new Error('Restaurant not found');
      }
    }
    throw error;
  }
};

/**
 * Delete restaurant
 */
export const deleteRestaurant = async (id: string, userId?: string | null) => {
  try {
    const restaurant = await Restaurant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Restaurant deleted successfully', data: restaurant };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Restaurant not found');
      }
    }
    throw error;
  }
};

/**
 * Transfer restaurant ownership
 */
export const transferManagership = async (data: TransferManagership) => {
  try {
    const { restaurantId, newManagerId } = data;

    // Check if new owner exists
    const newManager = await User.findUnique({
      where: { id: newManagerId },
    });

    if (!newManager) {
      throw new Error('New owner not found');
    }

    // Check if new owner is a member
    const membership = await Restaurant.findUnique({
      where: {
        id: restaurantId,
        // restaurantId_userId: {
        //   restaurantId,
        //   userId: newManagerId,
        // },
      },
    });

    if (!membership) {
      throw new Error('New owner must be a member of the organization');
    }

    // Update organization owner
    const restaurant = await Restaurant.update({
      where: { id: restaurantId },
      data: {
        managerId: newManagerId,
      },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return restaurant;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Restaurant not found');
      }
    }
    throw error;
  }
};

// =========================
// RESTAURANT CHAIN SERVICES
// =========================

/**
 * Create restaurant chain
 */
export const createRestaurantChain = async (data: CreateRestaurantChain, userId?: string | null) => {
  try {
    const chain = await RestaurantChain.create({
      data: {
        name: data.name,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        organizationId: data.organizationId,
        createdById: userId || null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });

    return chain;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2003') {
        throw new Error('Organization not found');
      }
    }
    throw error;
  }
};

/**
 * Get restaurant chain by ID
 */
export const getRestaurantChainById = async (id: string) => {
  try {
    const chain = await RestaurantChain.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        restaurants: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });

    if (!chain) {
      throw new Error('Restaurant chain not found');
    }

    return chain;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Get restaurant chains with filtering
 */
export const getRestaurantChains = async (query: RestaurantChainQuery) => {
  try {
    const { page, limit, sortBy, sortOrder, organizationId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RestaurantChainWhereInput = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [chains, total] = await Promise.all([
      RestaurantChain.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              restaurants: true,
            },
          },
        },
      }),
      RestaurantChain.count({ where }),
    ]);

    return {
      data: chains,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Update restaurant chain
 */
export const updateRestaurantChain = async (id: string, data: UpdateRestaurantChain, userId?: string | null) => {
  try {
    const chain = await RestaurantChain.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description !== undefined ? data.description || null : undefined,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl || null : undefined,
        updatedById: userId || undefined,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });

    return chain;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Restaurant chain not found');
      }
    }
    throw error;
  }
};

/**
 * Delete restaurant chain
 */
export const deleteRestaurantChain = async (id: string, userId?: string | null) => {
  try {
    const chain = await RestaurantChain.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Restaurant chain deleted successfully', data: chain };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Restaurant chain not found');
      }
    }
    throw error;
  }
};

// =========================
// RESTAURANT USER ROLE SERVICES
// =========================

/**
 * Create restaurant user role
 */
export const createRestaurantUserRole = async (data: CreateRestaurantUserRole) => {
  try {
    const role = await Database.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.findUnique({
        where: { id: data.restaurantId },
        select: { organizationId: true },
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      const created = await tx.restaurantUserRole.create({
        data: {
          restaurantId: data.restaurantId,
          userId: data.userId,
          role: data.role,
          status: data.status,
          hourlyRate: data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : null,
          joinedAt: data.joinedAt,
          leftAt: data.leftAt || null,
        },
        include: {
          restaurant: {
            select: {
              id: true,
              code: true,
              name: true,
              address: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: restaurant.organizationId,
            userId: data.userId,
          },
        },
        create: {
          organizationId: restaurant.organizationId,
          userId: data.userId,
          role: OrganizationRole.member,
          joinedAt: new Date(),
        },
        update: {},
      });

      return created;
    });

    return {
      ...role,
      hourlyRate: role.hourlyRate ? Number(role.hourlyRate) : null,
    };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        throw new Error('User already has a role in this restaurant');
      }
      if (prismaError.code === 'P2003') {
        throw new Error('Restaurant or user not found');
      }
    }
    throw error;
  }
};

/**
 * Get restaurant user role by ID
 */
export const getRestaurantUserRoleById = async (id: string) => {
  try {
    const role = await RestaurantUserRole.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error('Restaurant user role not found');
    }

    return {
      ...role,
      hourlyRate: role.hourlyRate ? Number(role.hourlyRate) : null,
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Get restaurant user roles with filtering
 */
export const getRestaurantUserRoles = async (query: RestaurantUserRoleQuery) => {
  try {
    const { page, limit, sortBy, sortOrder, restaurantId, userId, role, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RestaurantUserRoleWhereInput = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [roles, total] = await Promise.all([
      RestaurantUserRole.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          restaurant: {
            select: RestaurantShortly,
          },
          user: {
            select: UserShortly,
          },
        },
      }),
      RestaurantUserRole.count({ where }),
    ]);

    return {
      data: roles.map(role => ({
        ...role,
        hourlyRate: role.hourlyRate ? Number(role.hourlyRate) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Update restaurant user role
 */
export const updateRestaurantUserRole = async (id: string, data: UpdateRestaurantUserRole) => {
  try {
    const role = await RestaurantUserRole.update({
      where: { id },
      data: {
        role: data.role,
        status: data.status,
        hourlyRate: data.hourlyRate !== undefined ? (data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : null) : undefined,
        leftAt: data.leftAt !== undefined ? data.leftAt || null : undefined,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      ...role,
      hourlyRate: role.hourlyRate ? Number(role.hourlyRate) : null,
    };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Restaurant user role not found');
      }
    }
    throw error;
  }
};

/**
 * Delete restaurant user role
 */
export const deleteRestaurantUserRole = async (id: string) => {
  try {
    await RestaurantUserRole.delete({
      where: { id },
    });

    return { message: 'Restaurant user role deleted successfully' };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2025') {
        throw new Error('Restaurant user role not found');
      }
    }
    throw error;
  }
};

/**
 * Transfer staff to another restaurant
 */
export const transferRestaurantStaff = async (data: TransferRestaurantStaff) => {
  try {
    const { fromRestaurantId, toRestaurantId, userId, role, transferDate } = data;
    const effectiveTransferDate = transferDate || new Date();

    const [fromRestaurant, toRestaurant] = await Promise.all([
      Restaurant.findUnique({
        where: { id: fromRestaurantId },
        select: { id: true, organizationId: true },
      }),
      Restaurant.findUnique({
        where: { id: toRestaurantId },
        select: { id: true, organizationId: true },
      }),
    ]);

    if (!fromRestaurant || !toRestaurant) {
      throw new Error('Restaurant not found');
    }

    if (fromRestaurant.organizationId !== toRestaurant.organizationId) {
      throw new Error('Restaurants must belong to the same organization');
    }

    const existingRole = await RestaurantUserRole.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId: fromRestaurantId,
          userId,
        },
      },
    });

    if (!existingRole) {
      throw new Error('Staff role not found');
    }

    const targetRole = role || existingRole.role;

    const transferResult = await Database.$transaction(async (tx) => {
      await tx.restaurantUserRole.update({
        where: { id: existingRole.id },
        data: {
          status: 'inactive',
          leftAt: effectiveTransferDate,
        },
      });

      const newRole = await tx.restaurantUserRole.create({
        data: {
          restaurantId: toRestaurantId,
          userId,
          role: targetRole,
          status: 'active',
          joinedAt: effectiveTransferDate,
        },
        include: {
          restaurant: {
            select: {
              id: true,
              code: true,
              name: true,
              address: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: fromRestaurant.organizationId,
            userId,
          },
        },
        create: {
          organizationId: fromRestaurant.organizationId,
          userId,
          role: OrganizationRole.member,
          joinedAt: new Date(),
        },
        update: {},
      });

      return newRole;
    });

    return {
      ...transferResult,
      hourlyRate: transferResult.hourlyRate ? Number(transferResult.hourlyRate) : null,
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Bulk add staff to restaurant
 */
export const bulkAddStaff = async (data: BulkAddStaff) => {
  try {
    const { restaurantId, staff } = data;

    // Verify restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const roles = await Database.$transaction(async (tx) => {
      const createdRoles = await Promise.all(
        staff.map((member) =>
          tx.restaurantUserRole.create({
            data: {
              restaurantId,
              userId: member.userId,
              role: member.role,
              hourlyRate: member.hourlyRate ? new Prisma.Decimal(member.hourlyRate) : null,
              joinedAt: new Date(),
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          })
        )
      );

      const uniqueUserIds = Array.from(new Set(staff.map((member) => member.userId)));
      await Promise.all(
        uniqueUserIds.map((userId) =>
          tx.organizationMembership.upsert({
            where: {
              organizationId_userId: {
                organizationId: restaurant.organizationId,
                userId,
              },
            },
            create: {
              organizationId: restaurant.organizationId,
              userId,
              role: OrganizationRole.member,
              joinedAt: new Date(),
            },
            update: {},
          })
        )
      );

      return createdRoles;
    });

    return {
      added: roles.length,
      staff: roles.map(role => ({
        ...role,
        hourlyRate: role.hourlyRate ? Number(role.hourlyRate) : null,
      })),
    };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        throw new Error('One or more users already have roles in this restaurant');
      }
      if (prismaError.code === 'P2003') {
        throw new Error('One or more users not found');
      }
    }
    throw error;
  }
};

/**
 * Get organization statistics
 */
export const getOrganizationStatistics = async (organizationId: string) => {
  try {
    const [
      totalChains,
      totalRestaurants,
      totalMembers,
      activeMembers,
      recentMembers,
    ] = await Promise.all([
      RestaurantChain.count({
        where: { organizationId },
      }),
      Restaurant.count({
        where: { organizationId },
      }),
      OrganizationMembership.count({
        where: { organizationId },
      }),
      OrganizationMembership.count({
        where: {
          organizationId,
          joinedAt: { not: null },
        },
      }),
      OrganizationMembership.findMany({
        where: { organizationId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      totalChains,
      totalRestaurants,
      totalMembers,
      activeMembers,
      pendingMembers: totalMembers - activeMembers,
      recentMembers,
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Get restaurant staff statistics
 */
export const getRestaurantStaffStatistics = async (restaurantId: string) => {
  try {
    const [
      totalStaff,
      activeStaff,
      staffByRole,
      recentStaff,
    ] = await Promise.all([
      RestaurantUserRole.count({
        where: { restaurantId },
      }),
      RestaurantUserRole.count({
        where: {
          restaurantId,
          status: 'active',
        },
      }),
      RestaurantUserRole.groupBy({
        by: ['role'],
        where: { restaurantId },
        _count: true,
      }),
      RestaurantUserRole.findMany({
        where: { restaurantId },
        take: 5,
        orderBy: { joinedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      totalStaff,
      activeStaff,
      inactiveStaff: totalStaff - activeStaff,
      staffByRole: staffByRole.map(item => ({
        role: item.role,
        count: item._count,
      })),
      recentStaff: recentStaff.map(role => ({
        ...role,
        hourlyRate: role.hourlyRate ? Number(role.hourlyRate) : null,
      })),
    };
  } catch (error: unknown) {
    throw error;
  }
};
