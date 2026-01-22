import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const NotificationType = z.enum([
  'orderCreated',
  'orderConfirmed',
  'orderPreparing',
  'orderReady',
  'orderDelivered',
  'orderCancelled',
  'orderPaymentSuccess',
  'orderPaymentFailed',
  'reservationCreated',
  'reservationConfirmed',
  'reservationCancelled',
  'reservationReminder',
  'shiftAssigned',
  'shiftReminder',
  'scheduleUpdated',
  'attendanceReminder',
  'newReview',
  'lowInventory',
  'menuUpdated',
  'promotionCreated',
  'voucherExpiresSoon',
  'memberJoined',
  'memberLeft',
  'roleChanged',
  'organizationUpdated',
  'systemMaintenance',
  'featureAnnouncement',
  'securityAlert',
  'newMessage',
  'conversationStarted',
]);

export const NotificationPriority = z.enum(['low', 'medium', 'high', 'urgent']);
export const NotificationStatus = z.enum(['unread', 'read', 'archived']);
export const AuditAction = z.enum(['create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'cancel', 'checkIn', 'checkOut', 'assign', 'unassign', 'activate', 'deactivate']);
export const DevicePlatform = z.enum(['ios', 'android', 'web', 'desktop']);

// =========================
// NOTIFICATION SCHEMAS
// =========================

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: NotificationType,
  priority: NotificationPriority,
  status: NotificationStatus,
  relatedId: z.string().nullable(),
  relatedType: z.string().nullable(),
  actionUrl: z.string().nullable(),
  metadata: z.any().nullable(), // Json
  readAt: z.date().nullable(),
  scheduledAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export const CreateNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  type: NotificationType,
  priority: NotificationPriority.default('medium'),
  status: NotificationStatus.default('unread'),
  relatedId: z.string().optional(),
  relatedType: z.string().max(100).optional(),
  actionUrl: z.string().url().optional(),
  metadata: z.any().optional(),
  scheduledAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const UpdateNotificationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(1000).optional(),
  type: NotificationType.optional(),
  priority: NotificationPriority.optional(),
  status: NotificationStatus.optional(),
  relatedId: z.string().optional(),
  relatedType: z.string().max(100).optional(),
  actionUrl: z.string().url().optional(),
  metadata: z.any().optional(),
  readAt: z.coerce.date().optional(),
  scheduledAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const NotificationQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  type: NotificationType.optional(),
  priority: NotificationPriority.optional(),
  status: NotificationStatus.optional(),
  relatedType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'priority', 'scheduledAt', 'expiresAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const MarkNotificationReadSchema = z.object({
  readAt: z.coerce.date().optional(),
});

export const BulkMarkReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1, 'At least one notification ID is required'),
});

// Type exports
export type Notification = z.infer<typeof NotificationSchema>;
export type CreateNotification = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;
export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
export type MarkNotificationRead = z.infer<typeof MarkNotificationReadSchema>;
export type BulkMarkRead = z.infer<typeof BulkMarkReadSchema>;

// =========================
// SYSTEM CONFIG SCHEMAS
// =========================

export const SystemConfigSchema = z.object({
  id: z.string().uuid(),
  configKey: z.string(),
  configValue: z.any(), // Json
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateSystemConfigSchema = z.object({
  configKey: z.string().min(1, 'Config key is required').max(100, 'Config key too long'),
  configValue: z.any(),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().default(true),
});

export const UpdateSystemConfigSchema = z.object({
  configKey: z.string().min(1).max(100).optional(),
  configValue: z.any().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const SystemConfigQuerySchema = z.object({
  configKey: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['configKey', 'createdAt', 'updatedAt']).default('configKey'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Type exports
export type SystemConfig = z.infer<typeof SystemConfigSchema>;
export type CreateSystemConfig = z.infer<typeof CreateSystemConfigSchema>;
export type UpdateSystemConfig = z.infer<typeof UpdateSystemConfigSchema>;
export type SystemConfigQuery = z.infer<typeof SystemConfigQuerySchema>;

// =========================
// AUDIT LOG SCHEMAS
// =========================

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  tableName: z.string(),
  recordId: z.string(),
  action: AuditAction,
  oldValues: z.any().nullable(), // Json
  newValues: z.any().nullable(), // Json
  userId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
});

export const CreateAuditLogSchema = z.object({
  tableName: z.string().min(1, 'Table name is required').max(100, 'Table name too long'),
  recordId: z.string().uuid(),
  action: AuditAction,
  oldValues: z.any().optional(),
  newValues: z.any().optional(),
  userId: z.string().uuid().optional(),
  ipAddress: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
});

export const AuditLogQuerySchema = z.object({
  tableName: z.string().optional(),
  recordId: z.string().uuid().optional(),
  action: AuditAction.optional(),
  userId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'tableName', 'action']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>;
export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

// =========================
// DEVICE TOKEN SCHEMAS
// =========================

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
  token: z.string().min(1, 'Token is required').max(500, 'Token too long'),
  platform: DevicePlatform,
});

export const UpdateDeviceTokenSchema = z.object({
  token: z.string().min(1).max(500).optional(),
  platform: DevicePlatform.optional(),
});

export const DeviceTokenQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  platform: DevicePlatform.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'platform']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type DeviceToken = z.infer<typeof DeviceTokenSchema>;
export type CreateDeviceToken = z.infer<typeof CreateDeviceTokenSchema>;
export type UpdateDeviceToken = z.infer<typeof UpdateDeviceTokenSchema>;
export type DeviceTokenQuery = z.infer<typeof DeviceTokenQuerySchema>;
