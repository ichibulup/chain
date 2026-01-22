import { z } from 'zod';

// =========================
// MENU SCHEMAS
// =========================

// Base Menu schema
export const MenuSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  displayOrder: z.number().int(),
  imageUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Menu schema
export const CreateMenuSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Menu name is required').max(100, 'Menu name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
});

// Update Menu schema
export const UpdateMenuSchema = z.object({
  name: z.string().min(1, 'Menu name is required').max(100, 'Menu name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
});

// Menu Query schema
export const MenuQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'displayOrder', 'createdAt', 'updatedAt']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// MENU ITEM SCHEMAS
// =========================

// Base MenuItem schema
export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  menuId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  slug: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().positive(),
  imageUrl: z.string().nullable(),
  isAvailable: z.boolean(),
  displayOrder: z.number().int(),
  isFeatured: z.boolean(),
  allergens: z.array(z.string()),
  calories: z.number().int().positive().nullable(),
  dietaryInfo: z.array(z.string()),
  preparationTime: z.number().int().positive().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
});

// Create MenuItem schema
export const CreateMenuItemSchema = z.object({
  menuId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  slug: z.string().min(1).max(100).optional(),
  name: z.string().min(1, 'Item name is required').max(100, 'Item name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  calories: z.number().int().positive().optional(),
  dietaryInfo: z.array(z.string()).default([]),
  preparationTime: z.number().int().positive().optional(),
});

// Update MenuItem schema
export const UpdateMenuItemSchema = z.object({
  categoryId: z.string().uuid().optional(),
  slug: z.string().min(1).max(100).optional(),
  name: z.string().min(1, 'Item name is required').max(100, 'Item name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  price: z.number().positive('Price must be positive').optional(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
  calories: z.number().int().positive().optional(),
  dietaryInfo: z.array(z.string()).optional(),
  preparationTime: z.number().int().positive().optional(),
});

// MenuItem Query schema
export const MenuItemQuerySchema = z.object({
  menuId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  search: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'price', 'displayOrder', 'createdAt', 'updatedAt']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// RECIPE SCHEMAS
// =========================

// Base Recipe schema
export const RecipeSchema = z.object({
  id: z.string().uuid(),
  menuItemId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  instructions: z.string().nullable(),
  cookTime: z.number().int().positive().nullable(),
  prepTime: z.number().int().positive().nullable(),
  servingSize: z.number().int().positive().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Recipe schema
export const CreateRecipeSchema = z.object({
  menuItemId: z.string().uuid(),
  name: z.string().min(1, 'Recipe name is required').max(100, 'Recipe name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  instructions: z.string().max(2000, 'Instructions too long').optional(),
  cookTime: z.number().int().positive().optional(),
  prepTime: z.number().int().positive().optional(),
  servingSize: z.number().int().positive().optional(),
});

// Update Recipe schema
export const UpdateRecipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(100, 'Recipe name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  instructions: z.string().max(2000, 'Instructions too long').optional(),
  cookTime: z.number().int().positive().optional(),
  prepTime: z.number().int().positive().optional(),
  servingSize: z.number().int().positive().optional(),
});

// =========================
// RECIPE INGREDIENT SCHEMAS
// =========================

// Base RecipeIngredient schema
export const RecipeIngredientSchema = z.object({
  id: z.string().uuid(),
  recipeId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string(),
  notes: z.string().nullable(),
});

// Create RecipeIngredient schema
export const CreateRecipeIngredientSchema = z.object({
  recipeId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().max(200, 'Notes too long').optional(),
});

// Update RecipeIngredient schema
export const UpdateRecipeIngredientSchema = z.object({
  inventoryItemId: z.string().uuid().optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  notes: z.string().max(200, 'Notes too long').optional(),
});

// =========================
// OPTION GROUP SCHEMAS
// =========================

// Base OptionGroup schema
export const OptionGroupSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: z.string(),
  required: z.boolean(),
  minSelect: z.number().int().min(0).nullable(),
  maxSelect: z.number().int().min(0).nullable(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create OptionGroup schema
export const CreateOptionGroupSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1, 'Option group name is required').max(100, 'Name too long'),
  required: z.boolean().default(false),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(0).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// Update OptionGroup schema
export const UpdateOptionGroupSchema = z.object({
  name: z.string().min(1, 'Option group name is required').max(100, 'Name too long').optional(),
  required: z.boolean().optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(0).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// =========================
// OPTION SCHEMAS
// =========================

// Base Option schema
export const OptionSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  name: z.string(),
  priceDelta: z.number(),
  isAvailable: z.boolean(),
  displayOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Option schema
export const CreateOptionSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(1, 'Option name is required').max(100, 'Name too long'),
  priceDelta: z.number().default(0),
  isAvailable: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

// Update Option schema
export const UpdateOptionSchema = z.object({
  name: z.string().min(1, 'Option name is required').max(100, 'Name too long').optional(),
  priceDelta: z.number().optional(),
  isAvailable: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// =========================
// MENU ITEM OPTION GROUP SCHEMAS
// =========================

// Base MenuItemOptionGroup schema
export const MenuItemOptionGroupSchema = z.object({
  id: z.string().uuid(),
  menuItemId: z.string().uuid(),
  groupId: z.string().uuid(),
  displayOrder: z.number().int(),
});

// Create MenuItemOptionGroup schema
export const CreateMenuItemOptionGroupSchema = z.object({
  menuItemId: z.string().uuid(),
  groupId: z.string().uuid(),
  displayOrder: z.number().int().min(0).default(0),
});

// Update MenuItemOptionGroup schema
export const UpdateMenuItemOptionGroupSchema = z.object({
  groupId: z.string().uuid().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// =========================
// BULK OPERATION SCHEMAS
// =========================

// Bulk update menu items schema
export const BulkUpdateMenuItemsSchema = z.object({
  menuItemIds: z.array(z.string().uuid()).min(1, 'At least one menu item is required'),
  updates: z.object({
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
  }),
});

// Bulk toggle availability schema
export const BulkToggleAvailabilitySchema = z.object({
  menuItemIds: z.array(z.string().uuid()).min(1, 'At least one menu item is required'),
  isAvailable: z.boolean(),
});

// Featured items query schema
export const FeaturedItemsQuerySchema = z.object({
  menuId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

// =========================
// EXPORT TYPE DEFINITIONS
// =========================

export type Menu = z.infer<typeof MenuSchema>;
export type CreateMenu = z.infer<typeof CreateMenuSchema>;
export type UpdateMenu = z.infer<typeof UpdateMenuSchema>;
export type MenuQuery = z.infer<typeof MenuQuerySchema>;

export type MenuItem = z.infer<typeof MenuItemSchema>;
export type CreateMenuItem = z.infer<typeof CreateMenuItemSchema>;
export type UpdateMenuItem = z.infer<typeof UpdateMenuItemSchema>;
export type MenuItemQuery = z.infer<typeof MenuItemQuerySchema>;

export type Recipe = z.infer<typeof RecipeSchema>;
export type CreateRecipe = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipe = z.infer<typeof UpdateRecipeSchema>;

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;
export type CreateRecipeIngredient = z.infer<typeof CreateRecipeIngredientSchema>;
export type UpdateRecipeIngredient = z.infer<typeof UpdateRecipeIngredientSchema>;

export type OptionGroup = z.infer<typeof OptionGroupSchema>;
export type CreateOptionGroup = z.infer<typeof CreateOptionGroupSchema>;
export type UpdateOptionGroup = z.infer<typeof UpdateOptionGroupSchema>;

export type Option = z.infer<typeof OptionSchema>;
export type CreateOption = z.infer<typeof CreateOptionSchema>;
export type UpdateOption = z.infer<typeof UpdateOptionSchema>;

export type MenuItemOptionGroup = z.infer<typeof MenuItemOptionGroupSchema>;
export type CreateMenuItemOptionGroup = z.infer<typeof CreateMenuItemOptionGroupSchema>;
export type UpdateMenuItemOptionGroup = z.infer<typeof UpdateMenuItemOptionGroupSchema>;

export type BulkUpdateMenuItems = z.infer<typeof BulkUpdateMenuItemsSchema>;
export type BulkToggleAvailability = z.infer<typeof BulkToggleAvailabilitySchema>;
export type FeaturedItemsQuery = z.infer<typeof FeaturedItemsQuerySchema>;