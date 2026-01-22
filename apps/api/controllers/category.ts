import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import { getUserIdFromRequest } from '@/lib/utils/auth';
import {
  createCategory as createCategoryService,
  getCategoryById as getCategoryByIdService,
  getCategoryBySlug as getCategoryBySlugService,
  getCategories as getCategoriesService,
  // getCategoryTree as getCategoryTreeService,
  updateCategory as updateCategoryService,
  updateStatusCategory as updateStatusCategoryService,
  deleteCategory as deleteCategoryService,
  hardDeleteCategory as hardDeleteCategoryService,
  reorderCategories as reorderCategoriesService,
  moveCategory as moveCategoryService,
  getCategoryBreadcrumbs as getCategoryBreadcrumbsService,
  getAllCategories as getAllCategoriesService,

  checkCategorySlugExists,
  checkCategoryHasChildren,
  checkCategoryHasMenuItems,
  checkCircularReference,
  checkAllCategoriesExist,
} from '@/services/category';
import { checkCategoryExists } from "@/services/helper"
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryQuerySchema
} from '@/schemas/category';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategoriesService();

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories.data,
      total: categories.total,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get categories';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Create a new category
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    // Validate request body
    const result = await CreateCategorySchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate slug uniqueness
    const slugExists = await checkCategorySlugExists(validatedData.slug);

    if (slugExists) {
      return res.status(400).json({
        success: false,
        message: 'Category slug already exists'
      });
    }

    // Validate parent category exists if provided
    if (validatedData.parentId) {
      const parentExists = await checkCategoryExists(validatedData.parentId);

      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const category = await createCategoryService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is not valid'
      });
    }

    const category = await getCategoryByIdService(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category found',
      data: category,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get category';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Category slug is required'
      });
    }

    const category = await getCategoryBySlugService(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category found',
      data: category
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get category by slug';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all categories with filtering and pagination
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await CategoryQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getCategoriesService(result.data);

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get categories';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get category tree (hierarchical structure)
 */
export const getCategoryTree = async (req: Request, res: Response) => {
  // try {
  //   const { parent_id } = req.query;
  //
  //   const tree = await getCategoryTreeService(
  //     parent_id ? String(parent_id) : null
  //   );
  //
  //   res.status(200).json({
  //     success: true,
  //     message: 'Category tree retrieved successfully',
  //     data: tree
  //   });
  // } catch (error) {
  //   const errorMessage = error instanceof Error ? error.message : 'Failed to get category tree';
  //   res.status(500).json({
  //     success: false,
  //     message: errorMessage
  //   });
  // }
};

/**
 * Update category
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateCategorySchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate category exists
    const categoryExists = await checkCategoryExists(id);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Validate slug uniqueness if slug is being updated
    if (validatedData.slug) {
      const slugExists = await checkCategorySlugExists(validatedData.slug, id);

      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: 'Category slug already exists'
        });
      }
    }

    // Validate parent category exists if parentId is provided
    if (validatedData.parentId !== undefined && validatedData.parentId) {
      const parentExists = await checkCategoryExists(validatedData.parentId);

      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      // Check for circular reference
      const hasCircularReference = await checkCircularReference(id, validatedData.parentId);

      if (hasCircularReference) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set parent category - would create circular reference'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const category = await updateCategoryService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export async function updateStatusCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateCategorySchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate category exists
    const categoryExists = await checkCategoryExists(id);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = await updateStatusCategoryService(id, { isActive: validatedData.isActive! });

    res.status(200).json({
      success: true,
      message: 'Category status updated successfully',
      data: category
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update category status';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}

/**
 * Delete category (soft delete)
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is not valid'
      });
    }

    // Validate category exists
    const categoryExists = await checkCategoryExists(id);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has active children
    const hasChildren = await checkCategoryHasChildren(id);

    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with active subcategories. Please delete or move subcategories first.'
      });
    }

    // Check if category has menu items
    const hasMenuItems = await checkCategoryHasMenuItems(id);

    if (hasMenuItems) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with menu items. Please move or delete menu items first.'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteCategoryService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Hard delete category (permanently remove)
 */
export const hardDeleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is not valid'
      });
    }

    // Validate category exists
    const categoryExists = await checkCategoryExists(id);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children
    const hasChildren = await checkCategoryHasChildren(id);

    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.'
      });
    }

    // Check if category has menu items
    const hasMenuItems = await checkCategoryHasMenuItems(id);

    if (hasMenuItems) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with menu items. Please delete menu items first.'
      });
    }

    await hardDeleteCategoryService(id);

    res.status(200).json({
      success: true,
      message: 'Category permanently deleted'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to permanently delete category';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Reorder categories
 */
export const reorderCategories = async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories array is required'
      });
    }

    // Validate each category item
    const isValid = categories.every(item =>
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.displayOrder === 'number'
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Each category must have id (string) and displayOrder (number)'
      });
    }

    // Validate all category IDs are valid UUIDs
    const categoryIds = categories.map(item => item.id);
    for (const id of categoryIds) {
      if (!validate(id)) {
        return res.status(400).json({
          success: false,
          message: `Category ID is not valid: ${id}`
        });
      }
    }

    // Validate all categories exist
    const { allExist, missingIds } = await checkAllCategoriesExist(categoryIds);

    if (!allExist) {
      return res.status(404).json({
        success: false,
        message: `Categories not found: ${missingIds.join(', ')}`
      });
    }

    await reorderCategoriesService(categories);

    res.status(200).json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reorder categories';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Move category to different parent
 */
export const moveCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newParentId, newDisplayOrder } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is not valid'
      });
    }

    // Validate category exists
    const categoryExists = await checkCategoryExists(id);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Validate new parent exists if provided
    if (newParentId) {
      if (!validate(newParentId)) {
        return res.status(400).json({
          success: false,
          message: 'New parent category ID is not valid'
        });
      }

      const parentExists = await checkCategoryExists(newParentId);

      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'New parent category not found'
        });
      }

      // Check for circular reference
      const hasCircularReference = await checkCircularReference(id, newParentId);

      if (hasCircularReference) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move category - would create circular reference'
        });
      }
    }

    const category = await moveCategoryService(
      id,
      newParentId || null,
      newDisplayOrder
    );

    res.status(200).json({
      success: true,
      message: 'Category moved successfully',
      data: category
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to move category';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get category breadcrumbs
 */
export const getCategoryBreadcrumbs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is not valid'
      });
    }

    // Validate category exists
    const categoryExists = await checkCategoryExists(id);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const breadcrumbs = await getCategoryBreadcrumbsService(id);

    res.status(200).json({
      success: true,
      message: 'Breadcrumbs retrieved successfully',
      data: breadcrumbs
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get breadcrumbs';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};
