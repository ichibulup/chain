import { z } from 'zod';

// ============================================================================
// RETAIL PRODUCT SCHEMAS
// ============================================================================

/**
 * Base RetailProduct Schema
 */
export const RetailProductSchema = z.object({
  id: z.string().uuid(),
  inventoryItemId: z.string().uuid().nullable(),
  restaurantId: z.string().uuid().nullable(),
  menuItemId: z.string().uuid().nullable(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  imageUrls: z.array(z.string()),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  costPrice: z.number().nullable(),
  isActive: z.boolean(),
  stockQty: z.number().nullable(),
  category: z.string().nullable(),
  tags: z.array(z.string()),
  allergens: z.array(z.string()),
  dietaryInfo: z.array(z.string()),
  calories: z.number().int().nullable(),
  weight: z.number().nullable(),
  unit: z.string().nullable(),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  rating: z.number().nullable(),
  reviewCount: z.number().int(),
  soldCount: z.number().int(),
  isDeliverable: z.boolean(),
  deliveryTimeMin: z.number().int().nullable(),
  minOrderQty: z.number().nullable(),
  maxOrderQty: z.number().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  keywords: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

/**
 * Create RetailProduct Schema
 */
export const CreateRetailProductSchema = z.object({
  inventoryItemId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  menuItemId: z.string().uuid().optional(),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().max(5000, 'Description too long').optional(),
  shortDescription: z.string().max(300, 'Short description too long').optional(),
  imageUrls: z.array(z.string().url()).default([]),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  stockQty: z.number().nonnegative().optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).default([]),
  allergens: z.array(z.string().max(50)).default([]),
  dietaryInfo: z.array(z.string().max(50)).default([]),
  calories: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().default(0),
  soldCount: z.number().int().nonnegative().default(0),
  isDeliverable: z.boolean().default(true),
  deliveryTimeMin: z.number().int().positive().optional(),
  minOrderQty: z.number().positive().optional(),
  maxOrderQty: z.number().positive().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  keywords: z.array(z.string().max(50)).default([]),
});

/**
 * Update RetailProduct Schema
 */
export const UpdateRetailProductSchema = z.object({
  inventoryItemId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  menuItemId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  stockQty: z.number().nonnegative().optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  allergens: z.array(z.string().max(50)).optional(),
  dietaryInfo: z.array(z.string().max(50)).optional(),
  calories: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  soldCount: z.number().int().nonnegative().optional(),
  isDeliverable: z.boolean().optional(),
  deliveryTimeMin: z.number().int().positive().optional(),
  minOrderQty: z.number().positive().optional(),
  maxOrderQty: z.number().positive().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  keywords: z.array(z.string().max(50)).optional(),
});

/**
 * RetailProduct Query Schema
 */
export const RetailProductQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  menuItemId: z.string().uuid().optional(),
  category: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  isDeliverable: z.coerce.boolean().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  tags: z.string().optional(), // Comma-separated tags
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sortBy: z.enum(['createdAt', 'updatedAt', 'price', 'rating', 'soldCount', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// CART SCHEMAS
// ============================================================================

/**
 * Base Cart Schema
 */
export const CartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  restaurantId: z.string().uuid().nullable(),
  sessionId: z.string().nullable(),
  subtotal: z.number(),
  taxAmount: z.number(),
  deliveryFee: z.number(),
  totalAmount: z.number(),
  itemCount: z.number().int(),
  lastActivity: z.date(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Create Cart Schema
 */
export const CreateCartSchema = z.object({
  userId: z.string().uuid(),
  restaurantId: z.string().uuid().optional(),
  sessionId: z.string().max(255).optional(),
  subtotal: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  deliveryFee: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative().default(0),
  itemCount: z.number().int().nonnegative().default(0),
  expiresAt: z.coerce.date().optional(),
});

/**
 * Update Cart Schema
 */
export const UpdateCartSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  sessionId: z.string().max(255).optional(),
  subtotal: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
  itemCount: z.number().int().nonnegative().optional(),
  expiresAt: z.coerce.date().optional(),
});

/**
 * Cart Query Schema
 */
export const CartQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  hasItems: z.coerce.boolean().optional(), // Filter carts with/without items
  isExpired: z.coerce.boolean().optional(), // Filter expired carts
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastActivity', 'totalAmount']).default('lastActivity'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// CART ITEM SCHEMAS
// ============================================================================

/**
 * Base CartItem Schema
 */
export const CartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  menuItemId: z.string().uuid().nullable(),
  retailProductId: z.string().uuid().nullable(),
  quantity: z.number().int(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  notes: z.string().nullable(),
  itemName: z.string().nullable(),
  itemImage: z.string().nullable(),
  specialInstructions: z.string().nullable(),
  isGift: z.boolean(),
  giftMessage: z.string().nullable(),
});

/**
 * Create CartItem Schema
 */
export const CreateCartItemSchema = z.object({
  cartId: z.string().uuid(),
  menuItemId: z.string().uuid().optional(),
  retailProductId: z.string().uuid().optional(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  notes: z.string().max(500).optional(),
  itemName: z.string().max(200).optional(),
  itemImage: z.string().url().optional(),
  specialInstructions: z.string().max(1000).optional(),
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500).optional(),
}).refine(
  (data) => data.menuItemId || data.retailProductId,
  { message: 'Either menuItemId or retailProductId must be provided' }
);

/**
 * Update CartItem Schema
 */
export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
  itemName: z.string().max(200).optional(),
  itemImage: z.string().url().optional(),
  specialInstructions: z.string().max(1000).optional(),
  isGift: z.boolean().optional(),
  giftMessage: z.string().max(500).optional(),
});

/**
 * CartItem Query Schema
 */
export const CartItemQuerySchema = z.object({
  cartId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  menuItemId: z.string().uuid().optional(),
  retailProductId: z.string().uuid().optional(),
  isGift: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'quantity', 'totalPrice']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// CART ITEM OPTION SCHEMAS
// ============================================================================

/**
 * Base CartItemOption Schema
 */
export const CartItemOptionSchema = z.object({
  id: z.string().uuid(),
  cartItemId: z.string().uuid(),
  optionId: z.string().uuid(),
  priceDelta: z.number(),
});

/**
 * Create CartItemOption Schema
 */
export const CreateCartItemOptionSchema = z.object({
  cartItemId: z.string().uuid(),
  optionId: z.string().uuid(),
  priceDelta: z.number().default(0),
});

/**
 * Update CartItemOption Schema
 */
export const UpdateCartItemOptionSchema = z.object({
  optionId: z.string().uuid().optional(),
  priceDelta: z.number().optional(),
});

/**
 * CartItemOption Query Schema
 */
export const CartItemOptionQuerySchema = z.object({
  cartItemId: z.string().uuid().optional(),
  optionId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// RetailProduct types
export type RetailProduct = z.infer<typeof RetailProductSchema>;
export type CreateRetailProduct = z.infer<typeof CreateRetailProductSchema>;
export type UpdateRetailProduct = z.infer<typeof UpdateRetailProductSchema>;
export type RetailProductQuery = z.infer<typeof RetailProductQuerySchema>;

// Cart types
export type Cart = z.infer<typeof CartSchema>;
export type CreateCart = z.infer<typeof CreateCartSchema>;
export type UpdateCart = z.infer<typeof UpdateCartSchema>;
export type CartQuery = z.infer<typeof CartQuerySchema>;

// CartItem types
export type CartItem = z.infer<typeof CartItemSchema>;
export type CreateCartItem = z.infer<typeof CreateCartItemSchema>;
export type UpdateCartItem = z.infer<typeof UpdateCartItemSchema>;
export type CartItemQuery = z.infer<typeof CartItemQuerySchema>;

// CartItemOption types
export type CartItemOption = z.infer<typeof CartItemOptionSchema>;
export type CreateCartItemOption = z.infer<typeof CreateCartItemOptionSchema>;
export type UpdateCartItemOption = z.infer<typeof UpdateCartItemOptionSchema>;
export type CartItemOptionQuery = z.infer<typeof CartItemOptionQuerySchema>;
