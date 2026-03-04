import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const VoucherDiscountType = z.enum(['percentage', 'fixedAmount']);
export const PromotionType = z.enum(['percentage', 'fixedAmount', 'buyOneGetOne', 'comboDeal', 'happyHour', 'seasonal']);

// =========================
// VOUCHER SCHEMAS
// =========================

export const VoucherSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  discountType: VoucherDiscountType,
  discountValue: z.number().positive(),
  minOrderValue: z.number().positive().nullable(),
  maxDiscount: z.number().positive().nullable(),
  restaurantId: z.string().uuid().nullable(),
  startDate: z.date(),
  endDate: z.date(),
  usageLimit: z.number().int().positive().nullable(),
  usedCount: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export type Voucher = z.infer<typeof VoucherSchema>;

export const CreateVoucherSchema = z.object({
  code: z.string()
    .min(3, 'Voucher code must be at least 3 characters')
    .max(50, 'Voucher code too long')
    .regex(/^[A-Z0-9_-]+$/, 'Voucher code must contain only uppercase letters, numbers, hyphens, and underscores'),
  name: z.string()
    .min(1, 'Voucher name is required')
    .max(100, 'Voucher name too long'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  discountType: VoucherDiscountType.describe('Discount type must be either "percentage" or "fixedAmount"'),
  discountValue: z.number()
    .positive('Discount value must be positive'),
  minOrderValue: z.number()
    .positive('Minimum order value must be positive')
    .optional(),
  maxDiscount: z.number()
    .positive('Maximum discount must be positive')
    .optional(),
  restaurantId: z.string().uuid().optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  usageLimit: z.number()
    .int()
    .positive('Usage limit must be a positive integer')
    .optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
).refine(
  (data) => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return false;
    }
    return true;
  },
  { message: 'Percentage discount cannot exceed 100%', path: ['discountValue'] }
);

export type CreateVoucher = z.infer<typeof CreateVoucherSchema>;

export const UpdateVoucherSchema = z.object({
  name: z.string()
    .min(1, 'Voucher name is required')
    .max(100, 'Voucher name too long')
    .optional(),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  discountType: VoucherDiscountType.optional(),
  discountValue: z.number()
    .positive('Discount value must be positive')
    .optional(),
  minOrderValue: z.number()
    .positive('Minimum order value must be positive')
    .optional(),
  maxDiscount: z.number()
    .positive('Maximum discount must be positive')
    .optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  usageLimit: z.number()
    .int()
    .positive('Usage limit must be a positive integer')
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateVoucher = z.infer<typeof UpdateVoucherSchema>;

export const VoucherQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  discountType: VoucherDiscountType.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['code', 'name', 'startDate', 'endDate', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type VoucherQuery = z.infer<typeof VoucherQuerySchema>;

// =========================
// VOUCHER USAGE SCHEMAS
// =========================

export const VoucherUsageSchema = z.object({
  id: z.string().uuid(),
  voucherId: z.string().uuid(),
  userId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  usedAt: z.date(),
});

export type VoucherUsage = z.infer<typeof VoucherUsageSchema>;

export const CreateVoucherUsageSchema = z.object({
  voucherId: z.string().uuid(),
  userId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
});

export type CreateVoucherUsage = z.infer<typeof CreateVoucherUsageSchema>;

export const ValidateVoucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required'),
  userId: z.string().uuid(),
  restaurantId: z.string().uuid().optional(),
  orderValue: z.number().positive('Order value must be positive'),
});

export type ValidateVoucher = z.infer<typeof ValidateVoucherSchema>;

// =========================
// PROMOTION SCHEMAS
// =========================

export const PromotionSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: PromotionType,
  discountValue: z.number().positive(),
  conditions: z.any().nullable(),
  timeRestrictions: z.any().nullable(),
  isActive: z.boolean(),
  startDate: z.date(),
  endDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export type Promotion = z.infer<typeof PromotionSchema>;

export const CreatePromotionSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string()
    .min(1, 'Promotion name is required')
    .max(100, 'Promotion name too long'),
  description: z.string()
    .max(1000, 'Description too long')
    .optional(),
  type: PromotionType.describe('Promotion type must be one of: percentage, fixedAmount, buyOneGetOne, comboDeal, happyHour, seasonal'),
  discountValue: z.number()
    .positive('Discount value must be positive'),
  conditions: z.any().optional(),
  timeRestrictions: z.any().optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  menuItemIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
);

export type CreatePromotion = z.infer<typeof CreatePromotionSchema>;

export const UpdatePromotionSchema = z.object({
  name: z.string()
    .min(1, 'Promotion name is required')
    .max(100, 'Promotion name too long')
    .optional(),
  description: z.string()
    .max(1000, 'Description too long')
    .optional(),
  type: PromotionType.optional(),
  discountValue: z.number()
    .positive('Discount value must be positive')
    .optional(),
  conditions: z.any().optional(),
  timeRestrictions: z.any().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  menuItemIds: z.array(z.string().uuid()).optional(),
});

export type UpdatePromotion = z.infer<typeof UpdatePromotionSchema>;

export const PromotionQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  type: PromotionType.optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'type', 'startDate', 'endDate', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PromotionQuery = z.infer<typeof PromotionQuerySchema>;

// =========================
// PROMOTION MENU ITEM SCHEMAS
// =========================

export const PromotionMenuItemSchema = z.object({
  id: z.string().uuid(),
  promotionId: z.string().uuid(),
  menuItemId: z.string().uuid(),
});

export type PromotionMenuItem = z.infer<typeof PromotionMenuItemSchema>;

export const CreatePromotionMenuItemSchema = z.object({
  promotionId: z.string().uuid(),
  menuItemId: z.string().uuid(),
});

export type CreatePromotionMenuItem = z.infer<typeof CreatePromotionMenuItemSchema>;

export const BulkAddPromotionMenuItemsSchema = z.object({
  promotionId: z.string().uuid(),
  menuItemIds: z.array(z.string().uuid()).min(1, 'At least one menu item is required'),
});

export type BulkAddPromotionMenuItems = z.infer<typeof BulkAddPromotionMenuItemsSchema>;


