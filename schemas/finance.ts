import { z } from 'zod';

// =========================
// TAX RATE SCHEMAS
// =========================

/**
 * Base TaxRate Schema matching Prisma model
 */
export const TaxRateSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: z.string(),
  ratePct: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export type TaxRate = z.infer<typeof TaxRateSchema>;

/**
 * Create TaxRate Schema with validation
 */
export const CreateTaxRateSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  name: z
    .string()
    .min(1, 'Tax rate name is required')
    .max(100, 'Tax rate name too long'),
  ratePct: z
    .number()
    .min(0, 'Tax rate must be at least 0%')
    .max(100, 'Tax rate cannot exceed 100%'),
  isActive: z.boolean().default(true),
});

export type CreateTaxRate = z.infer<typeof CreateTaxRateSchema>;

/**
 * Update TaxRate Schema - all fields optional
 */
export const UpdateTaxRateSchema = z.object({
  name: z
    .string()
    .min(1, 'Tax rate name is required')
    .max(100, 'Tax rate name too long')
    .optional(),
  ratePct: z
    .number()
    .min(0, 'Tax rate must be at least 0%')
    .max(100, 'Tax rate cannot exceed 100%')
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTaxRate = z.infer<typeof UpdateTaxRateSchema>;

/**
 * TaxRate Query Schema for filtering and pagination
 */
export const TaxRateQuerySchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID').optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(), // Search in name
  minRate: z.coerce.number().min(0).max(100).optional(),
  maxRate: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'ratePct', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TaxRateQuery = z.infer<typeof TaxRateQuerySchema>;

// =========================
// ORDER TAX SCHEMAS
// =========================

/**
 * Base OrderTax Schema matching Prisma model
 */
export const OrderTaxSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  taxRateId: z.string().uuid(),
  amount: z.number(),
});

export type OrderTax = z.infer<typeof OrderTaxSchema>;

/**
 * Create OrderTax Schema with validation
 */
export const CreateOrderTaxSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  taxRateId: z.string().uuid('Invalid tax rate ID'),
  amount: z.number().min(0, 'Tax amount must be at least 0'),
});

export type CreateOrderTax = z.infer<typeof CreateOrderTaxSchema>;

/**
 * Update OrderTax Schema - all fields optional
 */
export const UpdateOrderTaxSchema = z.object({
  taxRateId: z.string().uuid('Invalid tax rate ID').optional(),
  amount: z.number().min(0, 'Tax amount must be at least 0').optional(),
});

export type UpdateOrderTax = z.infer<typeof UpdateOrderTaxSchema>;

/**
 * OrderTax Query Schema for filtering and pagination
 */
export const OrderTaxQuerySchema = z.object({
  orderId: z.string().uuid('Invalid order ID').optional(),
  taxRateId: z.string().uuid('Invalid tax rate ID').optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['amount', 'orderId', 'taxRateId']).default('orderId'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OrderTaxQuery = z.infer<typeof OrderTaxQuerySchema>;
