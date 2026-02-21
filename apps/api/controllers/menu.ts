import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import { getUserIdFromRequest } from '@/lib/utils/auth';
import {
  // Menu services
  getAllMenus as getAllMenusService,
  createMenu as createMenuService,
  getMenuById as getMenuByIdService,
  getMenus as getMenusService,
  updateMenu as updateMenuService,
  deleteMenu as deleteMenuService,
  
  // Menu item services
  getAllMenuItems as getAllMenuItemsService,
  createMenuItem as createMenuItemService,
  getMenuItemById as getMenuItemByIdService,
  getMenuItems as getMenuItemsService,
  updateMenuItem as updateMenuItemService,
  deleteMenuItem as deleteMenuItemService,
  hardDeleteMenuItem as hardDeleteMenuItemService,
  
  // Recipe services
  createRecipe as createRecipeService,
  getRecipeById as getRecipeByIdService,
  getRecipeByMenuItemId as getRecipeByMenuItemIdService,
  updateRecipe as updateRecipeService,
  deleteRecipe as deleteRecipeService,
  
  // Recipe ingredient services
  createRecipeIngredient as createRecipeIngredientService,
  updateRecipeIngredient as updateRecipeIngredientService,
  deleteRecipeIngredient as deleteRecipeIngredientService,
  
  // Option group services
  createOptionGroup as createOptionGroupService,
  getOptionGroupById as getOptionGroupByIdService,
  updateOptionGroup as updateOptionGroupService,
  deleteOptionGroup as deleteOptionGroupService,
  
  // Option services
  createOption as createOptionService,
  updateOption as updateOptionService,
  deleteOption as deleteOptionService,
  
  // Menu item option group services
  createMenuItemOptionGroup as createMenuItemOptionGroupService,
  updateMenuItemOptionGroup as updateMenuItemOptionGroupService,
  deleteMenuItemOptionGroup as deleteMenuItemOptionGroupService,
  
  // Bulk operation services
  bulkUpdateMenuItems as bulkUpdateMenuItemsService,
  bulkToggleAvailability as bulkToggleAvailabilityService,
  getFeaturedItems as getFeaturedItemsService,

  // Existence check services
  checkOptionGroupExists,
  checkOptionExists,
  checkRecipeExists,
} from '@/services/menu';
import {
  checkOrganizationExists,
  checkRestaurantExists,
  checkMenuExists,
  checkCategoryExists,
  checkMenuItemExists,
  checkInventoryItemExists,
} from '@/services/helper';
import {
  CreateMenuSchema,
  UpdateMenuSchema,
  MenuQuerySchema,
  CreateMenuItemSchema,
  UpdateMenuItemSchema,
  MenuItemQuerySchema,
  CreateRecipeSchema,
  UpdateRecipeSchema,
  CreateRecipeIngredientSchema,
  UpdateRecipeIngredientSchema,
  CreateOptionGroupSchema,
  UpdateOptionGroupSchema,
  CreateOptionSchema,
  UpdateOptionSchema,
  CreateMenuItemOptionGroupSchema,
  UpdateMenuItemOptionGroupSchema,
  BulkUpdateMenuItemsSchema,
  BulkToggleAvailabilitySchema,
  FeaturedItemsQuerySchema,
} from '@/schemas/menu';

// =========================
// MENU CONTROLLERS
// =========================

export async function getAllMenus(
  req: Request,
  res: Response,
) {
  try {
    // Validate query parameters
    const menus = await getAllMenusService();

    res.status(200).json({
      success: true,
      message: 'Menus retrieved successfully',
      data: menus.data,
      total: menus.total
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get menus';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}

/**
 * Create a new menu
 */
export const createMenu = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateMenuSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate organization exists
    const organizationExists = await checkOrganizationExists(validatedData.organizationId);

    if (!organizationExists) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const menu = await createMenuService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      data: menu
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create menu';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get menu by ID
 */
export const getMenuById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu ID is not valid'
      });
    }

    const menu = await getMenuByIdService(id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu found',
      data: menu,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get menu';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all menus with filtering and pagination
 */
export const getMenus = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await MenuQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getMenusService(result.data);

    res.status(200).json({
      success: true,
      message: 'Menus retrieved successfully',
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get menus';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update menu
 */
export const updateMenu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateMenuSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate menu exists
    const menuExists = await checkMenuExists(id);

    if (!menuExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const menu = await updateMenuService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Menu updated successfully',
      data: menu
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update menu';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete menu
 */
export const deleteMenu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu ID is not valid'
      });
    }

    // Validate menu exists
    const menuExists = await checkMenuExists(id);

    if (!menuExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteMenuService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// MENU ITEM CONTROLLERS
// =========================

export async function getAllMenuItems(
  req: Request,
  res: Response,
) {
  try {
    // Validate query parameters
    const menus = await getAllMenuItemsService();

    res.status(200).json({
      success: true,
      message: 'Menu Items retrieved successfully',
      data: menus.data,
      total: menus.total
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get menus';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}

/**
 * Create a new menu item
 */
export const createMenuItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateMenuItemSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate menu exists
    const menuExists = await checkMenuExists(validatedData.menuId);

    if (!menuExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // Validate category exists if provided
    if (validatedData.categoryId) {
      const categoryExists = await checkCategoryExists(validatedData.categoryId);

      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    const menuItem = await createMenuItemService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create menu item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get menu item by ID
 */
export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is not valid'
      });
    }

    const menuItem = await getMenuItemByIdService(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item found',
      data: menuItem,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get menu item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all menu items with filtering and pagination
 */
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await MenuItemQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getMenuItemsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Menu items retrieved successfully',
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get menu items';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update menu item
 */
export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateMenuItemSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate menu item exists
    const menuItemExists = await checkMenuItemExists(id);

    if (!menuItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Validate category exists if provided
    if (validatedData.categoryId) {
      const categoryExists = await checkCategoryExists(validatedData.categoryId);

      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const menuItem = await updateMenuItemService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update menu item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete menu item (soft delete)
 */
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is not valid'
      });
    }

    // Validate menu item exists
    const menuItemExists = await checkMenuItemExists(id);

    if (!menuItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const menuItem = await deleteMenuItemService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: menuItem
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Hard delete menu item
 */
export const hardDeleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is not valid'
      });
    }

    // Validate menu item exists
    const menuItemExists = await checkMenuItemExists(id);

    if (!menuItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await hardDeleteMenuItemService(id);

    res.status(200).json({
      success: true,
      message: 'Menu item permanently deleted'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to permanently delete menu item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// RECIPE CONTROLLERS
// =========================

/**
 * Create a new recipe
 */
export const createRecipe = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateRecipeSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate menu item exists
    const menuItemExists = await checkMenuItemExists(validatedData.menuItemId);

    if (!menuItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const recipe = await createRecipeService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: recipe
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create recipe';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get recipe by ID
 */
export const getRecipeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is not valid'
      });
    }

    const recipe = await getRecipeByIdService(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recipe found',
      data: recipe,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get recipe';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get recipe by menu item ID
 */
export const getRecipeByMenuItemId = async (req: Request, res: Response) => {
  try {
    const { menuItemId } = req.params;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is required'
      });
    }

    if (!validate(menuItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID is not valid'
      });
    }

    const recipe = await getRecipeByMenuItemIdService(menuItemId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recipe found',
      data: recipe,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get recipe';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update recipe
 */
export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateRecipeSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate recipe exists
    const recipeExists = await checkRecipeExists(id);

    if (!recipeExists) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const recipe = await updateRecipeService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Recipe updated successfully',
      data: recipe
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update recipe';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete recipe
 */
export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is not valid'
      });
    }

    // Validate recipe exists
    const recipeExists = await checkRecipeExists(id);

    if (!recipeExists) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteRecipeService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete recipe';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// RECIPE INGREDIENT CONTROLLERS
// =========================

/**
 * Create a new recipe ingredient
 */
export const createRecipeIngredient = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateRecipeIngredientSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate recipe exists
    const recipeExists = await checkRecipeExists(validatedData.recipeId);

    if (!recipeExists) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Validate inventory item exists
    const inventoryItemExists = await checkInventoryItemExists(validatedData.inventoryItemId);

    if (!inventoryItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const recipeIngredient = await createRecipeIngredientService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Recipe ingredient created successfully',
      data: recipeIngredient
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create recipe ingredient';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update recipe ingredient
 */
export const updateRecipeIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ingredient ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ingredient ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateRecipeIngredientSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate inventory item exists if provided
    if (validatedData.inventoryItemId) {
      const inventoryItemExists = await checkInventoryItemExists(validatedData.inventoryItemId);

      if (!inventoryItemExists) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found'
        });
      }
    }

    const recipeIngredient = await updateRecipeIngredientService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Recipe ingredient updated successfully',
      data: recipeIngredient
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update recipe ingredient';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete recipe ingredient
 */
export const deleteRecipeIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ingredient ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ingredient ID is not valid'
      });
    }

    await deleteRecipeIngredientService(id);

    res.status(200).json({
      success: true,
      message: 'Recipe ingredient deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete recipe ingredient';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// OPTION GROUP CONTROLLERS
// =========================

/**
 * Create a new option group
 */
export const createOptionGroup = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateOptionGroupSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);

    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const optionGroup = await createOptionGroupService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Option group created successfully',
      data: optionGroup
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create option group';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get option group by ID
 */
export const getOptionGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Option group ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Option group ID is not valid'
      });
    }

    const optionGroup = await getOptionGroupByIdService(id);

    if (!optionGroup) {
      return res.status(404).json({
        success: false,
        message: 'Option group not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Option group found',
      data: optionGroup,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get option group';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update option group
 */
export const updateOptionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Option group ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Option group ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateOptionGroupSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate option group exists
    const optionGroupExists = await checkOptionGroupExists(id);

    if (!optionGroupExists) {
      return res.status(404).json({
        success: false,
        message: 'Option group not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const optionGroup = await updateOptionGroupService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Option group updated successfully',
      data: optionGroup
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update option group';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete option group
 */
export const deleteOptionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Option group ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Option group ID is not valid'
      });
    }

    // Validate option group exists
    const optionGroupExists = await checkOptionGroupExists(id);

    if (!optionGroupExists) {
      return res.status(404).json({
        success: false,
        message: 'Option group not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteOptionGroupService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Option group deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete option group';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// OPTION CONTROLLERS
// =========================

/**
 * Create a new option
 */
export const createOption = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateOptionSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate option group exists
    const optionGroupExists = await checkOptionGroupExists(validatedData.groupId);

    if (!optionGroupExists) {
      return res.status(404).json({
        success: false,
        message: 'Option group not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const option = await createOptionService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Option created successfully',
      data: option
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create option';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update option
 */
export const updateOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateOptionSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate option exists
    const optionExists = await checkOptionExists(id);

    if (!optionExists) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const option = await updateOptionService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Option updated successfully',
      data: option
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update option';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete option
 */
export const deleteOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is not valid'
      });
    }

    // Validate option exists
    const optionExists = await checkOptionExists(id);

    if (!optionExists) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteOptionService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Option deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete option';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// MENU ITEM OPTION GROUP CONTROLLERS
// =========================

/**
 * Create a new menu item option group link
 */
export const createMenuItemOptionGroup = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateMenuItemOptionGroupSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate menu item exists
    const menuItemExists = await checkMenuItemExists(validatedData.menuItemId);

    if (!menuItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Validate option group exists
    const optionGroupExists = await checkOptionGroupExists(validatedData.groupId);

    if (!optionGroupExists) {
      return res.status(404).json({
        success: false,
        message: 'Option group not found'
      });
    }

    const menuItemOptionGroup = await createMenuItemOptionGroupService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Menu item option group created successfully',
      data: menuItemOptionGroup
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create menu item option group';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update menu item option group
 */
export const updateMenuItemOptionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu item option group ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu item option group ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateMenuItemOptionGroupSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate option group exists if provided
    if (validatedData.groupId) {
      const optionGroupExists = await checkOptionGroupExists(validatedData.groupId);

      if (!optionGroupExists) {
        return res.status(404).json({
          success: false,
          message: 'Option group not found'
        });
      }
    }

    const menuItemOptionGroup = await updateMenuItemOptionGroupService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Menu item option group updated successfully',
      data: menuItemOptionGroup
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update menu item option group';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete menu item option group
 */
export const deleteMenuItemOptionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Menu item option group ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Menu item option group ID is not valid'
      });
    }

    await deleteMenuItemOptionGroupService(id);

    res.status(200).json({
      success: true,
      message: 'Menu item option group deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu item option group';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// BULK OPERATION CONTROLLERS
// =========================

/**
 * Bulk update menu items
 */
export const bulkUpdateMenuItems = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdateMenuItemsSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate all menu items exist
    const menuItemExists = await Promise.all(
      validatedData.menuItemIds.map(id => checkMenuItemExists(id))
    );

    const allExist = menuItemExists.every(exists => exists);

    if (!allExist) {
      return res.status(404).json({
        success: false,
        message: 'One or more menu items not found'
      });
    }

    const response = await bulkUpdateMenuItemsService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update menu items';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Bulk toggle availability
 */
export const bulkToggleAvailability = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkToggleAvailabilitySchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate all menu items exist
    const menuItemExists = await Promise.all(
      validatedData.menuItemIds.map(id => checkMenuItemExists(id))
    );

    const allExist = menuItemExists.every(exists => exists);

    if (!allExist) {
      return res.status(404).json({
        success: false,
        message: 'One or more menu items not found'
      });
    }

    const response = await bulkToggleAvailabilityService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk toggle availability';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get featured items
 */
export const getFeaturedItems = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await FeaturedItemsQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const featuredItems = await getFeaturedItemsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Featured items retrieved successfully',
      data: featuredItems
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get featured items';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};
