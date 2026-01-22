import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const OrganizationRole = z.enum(['admin', 'member', 'guest']);
export const RestaurantStaffRole = z.enum([
  'staff',
  'manager',
  'chef',
  'cashier',
  'security',
  'cleaner',
  'supervisor',
  'sousChef',
  'waiter',
  'host'
]);
export const StaffStatus = z.enum(['active', 'inactive', 'onLeave', 'suspended', 'terminated']);
export const RestaurantStatus = z.enum(['active', 'inactive', 'maintenance', 'closed']);

// =========================
// ORGANIZATION SCHEMAS
// =========================

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  ownerId: z.string().uuid(),
  logoUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Organization name too long'),
  code: z.string().min(1, 'Organization code is required').max(50, 'Organization code too long').regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  description: z.string().max(500, 'Description too long').optional(),
  ownerId: z.string().uuid('Invalid owner ID'),
  logoUrl: z.string().url('Invalid logo URL').optional(),
});

export type CreateOrganization = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Organization name too long').optional(),
  code: z.string().min(1, 'Organization code is required').max(50, 'Organization code too long').regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
});

export type UpdateOrganization = z.infer<typeof UpdateOrganizationSchema>;

export const OrganizationQuerySchema = z.object({
  ownerId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'code', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OrganizationQuery = z.infer<typeof OrganizationQuerySchema>;

// =========================
// ORGANIZATION MEMBERSHIP SCHEMAS
// =========================

export const OrganizationMembershipSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: OrganizationRole,
  joinedAt: z.date().nullable(),
  invitedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrganizationMembership = z.infer<typeof OrganizationMembershipSchema>;

export const CreateOrganizationMembershipSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  userId: z.string().uuid('Invalid user ID'),
  role: OrganizationRole.default('member'),
  joinedAt: z.date().optional(),
  invitedAt: z.date().optional(),
});

export type CreateOrganizationMembership = z.infer<typeof CreateOrganizationMembershipSchema>;

export const UpdateOrganizationMembershipSchema = z.object({
  role: OrganizationRole.optional(),
  joinedAt: z.date().optional(),
  invitedAt: z.date().optional(),
});

export type UpdateOrganizationMembership = z.infer<typeof UpdateOrganizationMembershipSchema>;

export const OrganizationMembershipQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  role: OrganizationRole.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['joinedAt', 'invitedAt', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OrganizationMembershipQuery = z.infer<typeof OrganizationMembershipQuerySchema>;

// =========================
// RESTAURANT SCHEMAS
// =========================

export const RestaurantSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  chainId: z.string().uuid().nullable(),
  name: z.string(),
  code: z.string(),
  address: z.string(),
  phoneNumber: z.string().nullable(),
  email: z.email().nullable(),
  description: z.string().nullable(),
  managerId: z.string().uuid(),
  coverUrl: z.string().url().nullable(),
  logoUrl: z.string().url().nullable(),
  status: RestaurantStatus,
  timezone: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;

export const CreateRestaurantSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  chainId: z.string().uuid('Invalid chain ID').optional(),
  name: z.string().min(1, 'Restaurant name is required').max(100, 'Restaurant name too long'),
  code: z.string().min(1, 'Restaurant code is required').max(50, 'Restaurant code too long').regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  address: z.string().max(250, "Address is too long"),
  phoneNumber: z.string().min(10).max(10).optional(),
  email: z.email().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  managerId: z.string().uuid('Invalid manager ID'),
  coverUrl: z.string().url('Invalid cover URL').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  status: RestaurantStatus,
  timezone: z.string().nullable(),
});

export type CreateRestaurant = z.infer<typeof CreateRestaurantSchema>;

export const UpdateRestaurantSchema = z.object({
  chainId: z.string().uuid('Invalid chain ID').optional(),
  name: z.string().min(1, 'Restaurant name is required').max(100, 'Restaurant name too long'),
  code: z.string().min(1, 'Restaurant code is required').max(50, 'Restaurant code too long').regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  address: z.string().max(250, "Address is too long"),
  phoneNumber: z.string().min(10).max(10).optional(),
  email: z.email().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  // managerId: z.string().uuid('Invalid manager ID'),
  coverUrl: z.string().url('Invalid cover URL').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  status: RestaurantStatus,
  timezone: z.string().nullable(),
});

export type UpdateRestaurant = z.infer<typeof UpdateRestaurantSchema>;

export const RestaurantQuerySchema = z.object({
  managerId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'code', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type RestaurantQuery = z.infer<typeof RestaurantQuerySchema>;

// =========================
// RESTAURANT CHAIN SCHEMAS
// =========================

export const RestaurantChainSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  logoUrl: z.string().nullable(),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export type RestaurantChain = z.infer<typeof RestaurantChainSchema>;

export const CreateRestaurantChainSchema = z.object({
  name: z.string().min(1, 'Chain name is required').max(100, 'Chain name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export type CreateRestaurantChain = z.infer<typeof CreateRestaurantChainSchema>;

export const UpdateRestaurantChainSchema = z.object({
  name: z.string().min(1, 'Chain name is required').max(100, 'Chain name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
});

export type UpdateRestaurantChain = z.infer<typeof UpdateRestaurantChainSchema>;

export const RestaurantChainQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type RestaurantChainQuery = z.infer<typeof RestaurantChainQuerySchema>;

// =========================
// RESTAURANT USER ROLE SCHEMAS
// =========================

export const RestaurantUserRoleSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  userId: z.string().uuid(),
  role: RestaurantStaffRole,
  status: StaffStatus,
  hourlyRate: z.number().positive().nullable(),
  joinedAt: z.date(),
  leftAt: z.date().nullable(),
});

export type RestaurantUserRole = z.infer<typeof RestaurantUserRoleSchema>;

export const CreateRestaurantUserRoleSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  userId: z.string().uuid('Invalid user ID'),
  role: RestaurantStaffRole,
  status: StaffStatus.default('active'),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  joinedAt: z.coerce.date().default(() => new Date()),
  leftAt: z.coerce.date().optional(),
});

export type CreateRestaurantUserRole = z.infer<typeof CreateRestaurantUserRoleSchema>;

export const UpdateRestaurantUserRoleSchema = z.object({
  role: RestaurantStaffRole.optional(),
  status: StaffStatus.optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  leftAt: z.date().optional(),
});

export type UpdateRestaurantUserRole = z.infer<typeof UpdateRestaurantUserRoleSchema>;

export const RestaurantUserRoleQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  role: RestaurantStaffRole.optional(),
  status: StaffStatus.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['joinedAt', 'leftAt', 'hourlyRate']).default('joinedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type RestaurantUserRoleQuery = z.infer<typeof RestaurantUserRoleQuerySchema>;

// =========================
// BULK OPERATIONS SCHEMAS
// =========================

export const BulkAddMembersSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  members: z.array(z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: OrganizationRole.default('member'),
  })).min(1, 'At least one member is required'),
});

export type BulkAddMembers = z.infer<typeof BulkAddMembersSchema>;

export const BulkUpdateMemberRolesSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  updates: z.array(z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: OrganizationRole,
  })).min(1, 'At least one update is required'),
});

export type BulkUpdateMemberRoles = z.infer<typeof BulkUpdateMemberRolesSchema>;

export const BulkAddStaffSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  staff: z.array(z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: RestaurantStaffRole,
    hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  })).min(1, 'At least one staff member is required'),
});

export type BulkAddStaff = z.infer<typeof BulkAddStaffSchema>;

export const TransferOwnershipSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  newOwnerId: z.string().uuid('Invalid new owner ID'),
});

export type TransferOwnership = z.infer<typeof TransferOwnershipSchema>;

export const TransferManagershipSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  newManagerId: z.string().uuid('Invalid new manager ID'),
});

export type TransferManagership = z.infer<typeof TransferManagershipSchema>;

export const TransferRestaurantStaffSchema = z.object({
  fromRestaurantId: z.string().uuid('Invalid restaurant ID'),
  toRestaurantId: z.string().uuid('Invalid restaurant ID'),
  userId: z.string().uuid('Invalid user ID'),
  role: RestaurantStaffRole.optional(),
  transferDate: z.coerce.date().optional(),
});

export type TransferRestaurantStaff = z.infer<typeof TransferRestaurantStaffSchema>;
