import { Router } from 'express';
import { cacheMiddleware } from '@/middlewares/cache';
import {
  // Menu controllers
  getAllMenus,
  createMenu,
  getMenuById,
  getMenus,
  updateMenu,
  deleteMenu,

  // Menu item controllers
  getAllMenuItems,
  createMenuItem,
  getMenuItemById,
  getMenuItems,
  updateMenuItem,
  deleteMenuItem,
  hardDeleteMenuItem,

  // Recipe controllers
  createRecipe,
  getRecipeById,
  getRecipeByMenuItemId,
  updateRecipe,
  deleteRecipe,

  // Recipe ingredient controllers
  createRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient,

  // Option group controllers
  createOptionGroup,
  getOptionGroupById,
  updateOptionGroup,
  deleteOptionGroup,

  // Option controllers
  createOption,
  updateOption,
  deleteOption,

  // Menu item option group controllers
  createMenuItemOptionGroup,
  updateMenuItemOptionGroup,
  deleteMenuItemOptionGroup,

  // Bulk operation controllers
  bulkUpdateMenuItems,
  bulkToggleAvailability,
  getFeaturedItems,
} from '@/controllers/menu';

const router = Router();

// =========================
// MENU ITEM ROUTES
// =========================

// Create a new menu item
router.post('/item', createMenuItem);

// Get all menu items with filtering and pagination
// router.get('/item', getMenuItems);
router.get('/item', getAllMenuItems);

// Get menu item by ID
router.get('/item/:id', getMenuItemById);

// Update menu item
router.put('/item/:id', updateMenuItem);

// Delete menu item (soft delete)
router.delete('/item/:id', deleteMenuItem);

// Hard delete menu item
router.delete('/item/:id/hard', hardDeleteMenuItem);

// =========================
// RECIPE ROUTES
// =========================

// Create a new recipe
router.post('/recipe', createRecipe);

// Get recipe by menu item ID
router.get('/recipe/menu-item/:menuItemId', getRecipeByMenuItemId);

// Get recipe by ID
router.get('/recipe/:id', getRecipeById);

// Update recipe
router.put('/recipe/:id', updateRecipe);

// Delete recipe
router.delete('/recipe/:id', deleteRecipe);

// =========================
// RECIPE INGREDIENT ROUTES
// =========================

// Create a new recipe ingredient
router.post('/recipe-ingredients', createRecipeIngredient);

// Update recipe ingredient
router.put('/recipe-ingredients/:id', updateRecipeIngredient);

// Delete recipe ingredient
router.delete('/recipe-ingredients/:id', deleteRecipeIngredient);

// =========================
// OPTION GROUP ROUTES
// =========================

// Create a new option group
router.post('/option-groups', createOptionGroup);

// Get option group by ID
router.get('/option-groups/:id', getOptionGroupById);

// Update option group
router.put('/option-groups/:id', updateOptionGroup);

// Delete option group
router.delete('/option-groups/:id', deleteOptionGroup);

// =========================
// OPTION ROUTES
// =========================

// Create a new option
router.post('/options', createOption);

// Update option
router.put('/options/:id', updateOption);

// Delete option
router.delete('/options/:id', deleteOption);

// =========================
// MENU ITEM OPTION GROUP ROUTES
// =========================

// Create a new menu item option group link
router.post('/menu-item-option-groups', createMenuItemOptionGroup);

// Update menu item option group
router.put('/menu-item-option-groups/:id', updateMenuItemOptionGroup);

// Delete menu item option group
router.delete('/menu-item-option-groups/:id', deleteMenuItemOptionGroup);

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update menu items
router.patch('/item/bulk-update', bulkUpdateMenuItems);

// Bulk toggle availability
router.patch('/item/bulk-toggle-availability', bulkToggleAvailability);

// Get featured items
router.get('/item/featured', getFeaturedItems);

// =========================
// MENU ROUTES
// =========================

// Create a new menu
router.post('/', createMenu);

// Get all menus with filtering and pagination (cached 30s)
// router.get('/', cacheMiddleware(30), getMenus);
router.get('/', getAllMenus);

// Get menu by ID
router.get('/:id', getMenuById);

// Update menu
router.put('/:id', updateMenu);

// Delete menu
router.delete('/:id', deleteMenu);

export default router;
