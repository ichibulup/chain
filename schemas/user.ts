import { z } from "zod";

/** Helpers */
const DecimalLike = z.union([z.number(), z.string()]).refine((v) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n);
}, { message: "Expected a finite number or numeric string" });

/** Enums (local) */
export const AuthProvider = z.enum([
  "google",
  "facebook",
  "apple",
  "microsoft",
  "github",
  "discord",
  "email",
  "phone",
  "magicLink",
]);

export const UserStatus = z.enum([
  "active",
  "inactive",
  "banned",
  "suspended",
  "pendingVerification",
  "locked",
  "onLeave",
]);

export const UserActivityStatus = z.enum([
  "available",
  "busy",
  "doNotDisturb",
  "away",
  "offline",
  "invisible",
]);

export const UserRole = z.enum([
  "customer",
  "staff",
  "manager",
  "admin",
  "master",
  "delivery",
  "supplier",
  "warehouse",
]);

export const RestaurantStaffRole = z.enum([
  "staff",
  "manager",
  "chef",
  "cashier",
  "security",
  "cleaner",
  "supervisor",
  "sousChef",
  "waiter",
  "host",
]);

export const ConversationType = z.enum(["support", "feedback", "complaint", "inquiry"]);
export const ConversationStatus = z.enum(["active", "resolved", "closed"]);
export const MessageType = z.enum(["text", "image", "file", "system"]);
export const DevicePlatform = z.enum(["ios", "android", "web", "desktop"]);

// Dùng cho cập nhật hồ sơ người dùng
export const updateProfileSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  fullName: z.string().trim().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  phoneCode: z.string().max(8).optional(),
  phoneNumber: z.string().max(20).optional(),
  gender: z.string().max(10).optional(),
  dateOfBirth: z.string().datetime().optional(),
  publicMetadata: z.record(z.string(), z.any()).optional(),
});

export const setGlobalRoleSchema = z.object({
  userId: z.string().uuid(),
  role: UserRole,
});

export const addRestaurantRoleSchema = z.object({
  restaurantId: z.string().uuid(),
  userId: z.string().uuid(),
  role: RestaurantStaffRole,
  hourlyRate: z.number().optional(),
});

export const removeRestaurantRoleSchema = z.object({
  restaurantId: z.string().uuid(),
  userId: z.string().uuid(),
});

// Dùng khi đồng bộ từ Supabase user
export const supabaseIdentitySchema = z.object({
  provider: z.string().min(1),
  id: z.string().optional(),
  user_id: z.string().optional(),
  identity_data: z
    .object({
      sub: z.string().optional(),
      email: z.string().email().optional(),
      email_verified: z.boolean().optional(),
      name: z.string().optional(),
      full_name: z.string().optional(),
      picture: z.string().url().optional(),
    })
    .partial()
    .optional(),
});

export const syncFromSupabaseSchema = z.object({
  id: z.string().uuid(),

  // Email / phone
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),

  // Meta (hai cách gọi cũ/mới đều hỗ trợ)
  user_metadata: z.record(z.string(), z.any()).optional(),
  raw_user_meta_data: z.record(z.string(), z.any()).optional(),
  app_metadata: z.record(z.string(), z.any()).optional(),
  raw_app_meta_data: z
    .object({
      provider: z.string().optional(),
      providers: z.array(z.string()).optional(),
    })
    .partial()
    .optional(),

  providers: z.array(z.string()).optional(),

  // Thời gian xác thực (Supabase có thể trả key khác nhau)
  email_confirmed_at: z.string().datetime().nullable().optional(),
  confirmed_at: z.string().datetime().nullable().optional(),
  confirmation_sent_at: z.string().datetime().nullable().optional(),

  // Các timestamp khác
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
  last_sign_in_at: z.string().datetime().nullable().optional(),
  invited_at: z.string().datetime().nullable().optional(),
  banned_until: z.string().datetime().nullable().optional(),

  // Flags
  is_anonymous: z.boolean().optional(),
  is_sso_user: z.boolean().optional(),

  // Identities
  identities: z.array(supabaseIdentitySchema).optional(),
});

// export const syncFromSupabaseSchema = z.object({
//   id: z.string().uuid(),
//   email: z.string().email().nullable().optional(),
//   user_metadata: z
//     .object({
//       email: z.string().email().optional(),
//       full_name: z.string().optional(),
//       name: z.string().optional(),
//       first_name: z.string().optional(),
//       last_name: z.string().optional(),
//       avatar_url: z.string().url().optional(),
//     })
//     .partial()
//     .optional(),
//   email_confirmed_at: z.string().datetime().nullable().optional(),
//   identities: z.array(supabaseIdentitySchema).optional(),
//   app_metadata: z.record(z.string(), z.any()).optional(),
// });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SetGlobalRoleInput = z.infer<typeof setGlobalRoleSchema>;
export type AddRestaurantRoleInput = z.infer<typeof addRestaurantRoleSchema>;
export type RemoveRestaurantRoleInput = z.infer<typeof removeRestaurantRoleSchema>;
export type SyncFromSupabaseInput = z.infer<typeof syncFromSupabaseSchema>;

/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */

/** ===== User =====
 model User {
 id, username?, email, firstName?, lastName?, fullName?, phoneCode?, phoneNumber?, avatarUrl?,
 emailVerifiedAt?, phoneVerifiedAt?, status, role, activityStatus, isOnline, lastActivityAt?, lastSeenAt?,
 createdAt, updatedAt, dateOfBirth?, gender?, lastSignInAt?, publicMetadata?, privateMetadata?
 }
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(100).nullable().optional(),
  email: z.string().email(),
  emailNormalized: z.string().email(), // server sẽ normalize lowercase
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  phoneCode: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),

  emailVerifiedAt: z.date().nullable().optional(),
  phoneVerifiedAt: z.date().nullable().optional(),

  status: UserStatus.default("active"),
  role: UserRole.default("customer"),
  activityStatus: UserActivityStatus.default("available"),
  isOnline: z.boolean().default(false),
  lastActivityAt: z.date().nullable().optional(),
  lastSeenAt: z.date().nullable().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  dateOfBirth: z.date().nullable().optional(),
  gender: z.string().nullable().optional(),
  lastSignInAt: z.date().nullable().optional(),

  loyaltyPoints: z.number().int().default(0),
  totalOrders: z.number().int().default(0),
  totalSpent: DecimalLike.default(0),

  // Supabase integration
  supabaseUserId: z.string().uuid().nullable().optional(),
  providers: z.array(AuthProvider).default([]),
  lastProvider: AuthProvider.nullable().optional(),

  // Security & permissions
  twoFactorEnabled: z.boolean().default(false),
  totpEnabled: z.boolean().default(false),
  backupCodeEnabled: z.boolean().default(false),
  banned: z.boolean().default(false),
  locked: z.boolean().default(false),
  lockoutExpiresInSeconds: z.number().int().nullable().optional(),
  deleteSelfEnabled: z.boolean().default(true),
  createOrganizationEnabled: z.boolean().default(false),
  createOrganizationsLimit: z.number().int().nullable().optional(),
  legalAcceptedAt: z.date().nullable().optional(),

  // Metadata
  publicMetadata: z.record(z.string(), z.any()).nullable().optional(),
  privateMetadata: z.record(z.string(), z.any()).nullable().optional(),
  unsafeMetadata: z.record(z.string(), z.any()).nullable().optional(),
  emailAddresses: z.any().nullable().optional(),
  phoneNumbers: z.any().nullable().optional(),
  web3Wallets: z.any().nullable().optional(),
  externalAccounts: z.any().nullable().optional(),
  enterpriseAccounts: z.any().nullable().optional(),
  passkeys: z.any().nullable().optional(),

  // Legacy-compat
  hasImage: z.boolean().default(false),
  imageUrl: z.string().url().nullable().optional(),
  passwordEnabled: z.boolean().default(false),
  twoFactorSecret: z.string().nullable().optional(),
  backupCodes: z.any().nullable().optional(),
});

/** Server-side: dữ liệu client gửi lên để tạo mới.
 *  Lưu ý: emailNormalized/supabaseUserId/providers/lastProvider… do server set.
 */
const AdminCreatableUserRole = z.enum([
  "manager",
  "staff",
  "delivery",
  "warehouse",
  "customer",
]);

export const CreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1).max(100).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  phoneCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  restaurantId: z
    .preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),

  status: UserStatus.optional(),
  role: AdminCreatableUserRole.optional(),
  activityStatus: UserActivityStatus.optional(),

  emailVerifiedAt: z.date().optional(),
  phoneVerifiedAt: z.date().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.string().optional(),

  publicMetadata: z.record(z.string(), z.any()).optional(),
  privateMetadata: z.record(z.string(), z.any()).optional(),
  unsafeMetadata: z.record(z.string(), z.any()).optional(),
});

/** Server-side: cập nhật một phần hồ sơ. Các field không cho client sửa thì bỏ. */
export const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(100).nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  phoneCode: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),

  status: UserStatus.optional(),
  role: UserRole.optional(),
  activityStatus: UserActivityStatus.optional(),

  emailVerifiedAt: z.coerce.date().nullable().optional(),
  phoneVerifiedAt: z.coerce.date().nullable().optional(),
  dateOfBirth: z.coerce.date().nullable().optional(),
  gender: z.string().nullable().optional(),

  publicMetadata: z.record(z.string(), z.any()).nullable().optional(),
  privateMetadata: z.record(z.string(), z.any()).nullable().optional(),
  unsafeMetadata: z.record(z.string(), z.any()).nullable().optional(),
});

// Query schema for getting users with filters
export const GetUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(), // Search by email, username, fullName
  status: UserStatus.optional(),
  role: UserRole.optional(),
  activityStatus: UserActivityStatus.optional(),
  isOnline: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'email', 'fullName', 'lastSignInAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schema for updating user status
export const UpdateUserStatusSchema = z.object({
  id: z.string().uuid(),
  status: UserStatus,
  reason: z.string().optional(), // Optional reason for status change
});

// Schema for updating user activity
export const UpdateUserActivitySchema = z.object({
  id: z.string().uuid(),
  activityStatus: UserActivityStatus.optional(),
  isOnline: z.boolean().optional(),
  lastActivityAt: z.coerce.date().optional(),
  lastSeenAt: z.coerce.date().optional(),
});

// Type exports for User CRUD
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type GetUserQuery = z.infer<typeof GetUserQuerySchema>;
export type UpdateUserStatus = z.infer<typeof UpdateUserStatusSchema>;
export type UpdateUserActivity = z.infer<typeof UpdateUserActivitySchema>;

/** ===== Address ===== */
// export const AddressSchema = z.object({
//   id: z.string().uuid(),
//   userId: z.string().uuid(),
//   recipientName: z.string(),
//   recipientPhone: z.string(),
//   streetAddress: z.string(),
//   ward: z.string().optional(),
//   district: z.string(),
//   city: z.string(),
//   country: z.string().default("Vietnam"),
//   lat: DecimalLike.nullable().optional(),
//   lng: DecimalLike.nullable().optional(),
//   tag: z.string().optional(),
//   note: z.string().optional(),
//   isDefault: z.boolean().default(false),
//   createdAt: z.date(),
//   updatedAt: z.date(),
// });
// export const CreateAddressSchema = z.object({
//   userId: z.string().uuid(),
//   recipientName: z.string(),
//   recipientPhone: z.string(),
//   streetAddress: z.string(),
//   ward: z.string().optional(),
//   district: z.string(),
//   city: z.string(),
//   country: z.string().default("Vietnam").optional(),
//   lat: DecimalLike.optional(),
//   lng: DecimalLike.optional(),
//   tag: z.string().optional(),
//   note: z.string().optional(),
//   isDefault: z.boolean().optional(),
// });
// export const UpdateAddressSchema = z.object({
//   id: z.string().uuid(),
//   recipientName: z.string().optional(),
//   recipientPhone: z.string().optional(),
//   streetAddress: z.string().optional(),
//   ward: z.string().optional(),
//   district: z.string().optional(),
//   city: z.string().optional(),
//   country: z.string().optional(),
//   lat: DecimalLike.nullable().optional(),
//   lng: DecimalLike.nullable().optional(),
//   tag: z.string().optional(),
//   note: z.string().optional(),
//   isDefault: z.boolean().optional(),
// });

/** ===== Conversation / Message ===== */
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  type: ConversationType.default("support"),
  customerId: z.string().uuid().nullable().optional(),
  restaurantId: z.string().uuid().nullable().optional(),
  staffId: z.string().uuid().nullable().optional(),
  title: z.string().optional(),
  status: ConversationStatus.default("active"),
  lastMessageAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export const CreateConversationSchema = z.object({
  type: ConversationType.optional(),
  customerId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  title: z.string().optional(),
  status: ConversationStatus.optional(),
});
export const UpdateConversationSchema = z.object({
  id: z.string().uuid(),
  type: ConversationType.optional(),
  customerId: z.string().uuid().nullable().optional(),
  restaurantId: z.string().uuid().nullable().optional(),
  staffId: z.string().uuid().nullable().optional(),
  title: z.string().optional(),
  status: ConversationStatus.optional(),
  lastMessageAt: z.date().nullable().optional(),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  messageType: MessageType.default("text"),
  attachments: z.array(z.string()).default([]),
  isRead: z.boolean().default(false),
  createdAt: z.date(),
});
export const CreateMessageSchema = z.object({
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().min(1),
  messageType: MessageType.optional(),
  attachments: z.array(z.string()).optional(),
});
export const UpdateMessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string().optional(),
  messageType: MessageType.optional(),
  attachments: z.array(z.string()).optional(),
  isRead: z.boolean().optional(),
});

/** ===== DeviceToken ===== */
export const DeviceTokenSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  platform: DevicePlatform,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export const CreateDeviceTokenSchema = z.object({
  userId: z.string().uuid(),
  token: z.string().min(10),
  platform: DevicePlatform,
});
export const UpdateDeviceTokenSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(10).optional(),
  platform: DevicePlatform.optional(),
});

// =========================
// ADDRESS SCHEMAS
// =========================

/**
 * Base Address Schema matching Prisma model
 */
export const AddressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  restaurantId: z.string().uuid().nullable(),
  recipientName: z.string(),
  recipientPhone: z.string(),
  streetAddress: z.string(),
  ward: z.string().nullable(),
  district: z.string(),
  city: z.string(),
  country: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  tag: z.string().nullable(),
  note: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Address = z.infer<typeof AddressSchema>;

/**
 * Create Address Schema with validation
 */
export const CreateAddressSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  recipientName: z
    .string()
    .min(1, 'Recipient name is required')
    .max(100, 'Recipient name too long'),
  recipientPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^[0-9+\-() ]+$/, 'Invalid phone number format'),
  streetAddress: z
    .string()
    .min(1, 'Street address is required')
    .max(200, 'Street address too long'),
  ward: z.string().max(100, 'Ward name too long').optional(),
  district: z
    .string()
    .min(1, 'District is required')
    .max(100, 'District name too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  country: z.string().max(100, 'Country name too long').default('Vietnam'),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  tag: z
    .string()
    .max(50, 'Tag too long')
    .regex(/^[a-z0-9-]+$/, 'Tag must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  note: z.string().max(500, 'Note too long').optional(),
  isDefault: z.boolean().default(false),
});

export type CreateAddress = z.infer<typeof CreateAddressSchema>;

/**
 * Update Address Schema - all fields optional
 */
export const UpdateAddressSchema = z.object({
  recipientName: z
    .string()
    .min(1, 'Recipient name is required')
    .max(100, 'Recipient name too long')
    .optional(),
  recipientPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^[0-9+\-() ]+$/, 'Invalid phone number format')
    .optional(),
  streetAddress: z
    .string()
    .min(1, 'Street address is required')
    .max(200, 'Street address too long')
    .optional(),
  ward: z.string().max(100, 'Ward name too long').optional(),
  district: z
    .string()
    .min(1, 'District is required')
    .max(100, 'District name too long')
    .optional(),
  city: z.string().min(1, 'City is required').max(100, 'City name too long').optional(),
  country: z.string().max(100, 'Country name too long').optional(),
  restaurantId: z.string().uuid('Invalid restaurant ID').nullable().optional(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  tag: z
    .string()
    .max(50, 'Tag too long')
    .regex(/^[a-z0-9-]+$/, 'Tag must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  note: z.string().max(500, 'Note too long').optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateAddress = z.infer<typeof UpdateAddressSchema>;

/**
 * Address Query Schema for filtering and pagination
 */
export const AddressQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  tag: z.string().optional(),
  isDefault: z.coerce.boolean().optional(),
  search: z.string().optional(), // Search in recipientName, streetAddress, district, city
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(['recipientName', 'city', 'district', 'isDefault', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AddressQuery = z.infer<typeof AddressQuerySchema>;
