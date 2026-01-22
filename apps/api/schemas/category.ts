import { z } from 'zod';

// Interface
// export interface Category {
//   id: string;
//   parentId: string | null;
//   name: string;
//   slug: string;
//   description: string | null;
//   imageUrl: string | null;
//   displayOrder: number;
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// Base category schema
export const CategorySchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
});

// Create category schema (without auto-generated fields)
export const CreateCategorySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  slug: z.string().min(1, "Slug is required").max(120, "Slug must be less than 120 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid URL format").optional(),
  displayOrder: z.number().int().min(0).default(0).optional(),
  isActive: z.boolean().default(true).optional(),
}).refine(async (data) => {
  // Custom validation can be added here
  return true;
}, {
  message: "Invalid category data",
});

// Update category schema (partial update)
export const UpdateCategorySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only").optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid URL format").optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Query params for filtering categories
export const CategoryQuerySchema = z.object({
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(10).optional(),
  sortBy: z.enum(['createdAt', 'name', 'displayOrder', 'updatedAt', 'isActive']).default('isActive').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
  includeChildren: z.boolean().default(false).optional(),
  includeParent: z.boolean().default(false).optional(),
});

// Category with hierarchy schema
export const CategoryWithHierarchySchema = CategorySchema.extend({
  parent: CategorySchema.nullable().optional(),
  children: z.array(CategorySchema).optional(),
  menuItemsCount: z.number().int().min(0).optional(),
});

// Category tree node schema (for hierarchical display)
export const CategoryTreeNodeSchema: z.ZodType<CategoryTreeNode> = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  children: z.array(z.lazy(() => CategoryTreeNodeSchema)).optional(),
  menuItemsCount: z.number().int().min(0).optional(),
});

// Define type first for recursive reference
export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  children?: CategoryTreeNode[];
  menuItemsCount?: number;
};

// Bulk operation schemas
export const BulkUpdateCategorySchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one category ID is required"),
  updates: UpdateCategorySchema.omit({ parentId: true }), // Prevent bulk parent changes
});

export const BulkDeleteCategorySchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one category ID is required"),
  force: z.boolean().default(false), // Force delete even if has children/menu items
});

// Category reorder schema
export const ReorderCategorySchema = z.object({
  categories: z.array(z.object({
    id: z.string().uuid(),
    displayOrder: z.number().int().min(0),
  })).min(1, "At least one category is required"),
});

// Move category schema
export const MoveCategorySchema = z.object({
  categoryId: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
  newDisplayOrder: z.number().int().min(0).optional(),
}).refine((data) => {
  // Prevent moving category to itself
  return data.categoryId !== data.newParentId;
}, {
  message: "Cannot move category to itself",
  path: ["newParentId"],
});

// Export type definitions
export type Category = z.infer<typeof CategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;
export type CategoryWithHierarchy = z.infer<typeof CategoryWithHierarchySchema>;
export type BulkUpdateCategory = z.infer<typeof BulkUpdateCategorySchema>;
export type BulkDeleteCategory = z.infer<typeof BulkDeleteCategorySchema>;
export type ReorderCategory = z.infer<typeof ReorderCategorySchema>;
export type MoveCategory = z.infer<typeof MoveCategorySchema>;
