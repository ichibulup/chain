import {
  Category,
  Menu,
  MenuItem,
  MenuItemOptionGroup,
  Option,
  OptionGroup,
  Recipe,
  RecipeIngredient,
} from '@/models/menu';
import { InventoryItem } from '@/models/inventory';
import { Organization, Restaurant } from '@/models/organization';
import {
  // Menu types
  CreateMenu,
  UpdateMenu,
  MenuQuery,
  // Menu item types
  CreateMenuItem,
  UpdateMenuItem,
  MenuItemQuery,
  // Recipe types
  CreateRecipe,
  UpdateRecipe,
  // Recipe ingredient types
  CreateRecipeIngredient,
  UpdateRecipeIngredient,
  // Option group types
  CreateOptionGroup,
  UpdateOptionGroup,
  // Option types
  CreateOption,
  UpdateOption,
  // Menu item option group types
  CreateMenuItemOptionGroup,
  UpdateMenuItemOptionGroup,
  // Bulk operation types
  BulkUpdateMenuItems,
  BulkToggleAvailability,
  FeaturedItemsQuery,
} from '@/schemas/menu';
import { CategoryShortly, MenuShortly, OrganizationShortly } from "lib/interfaces";

// =========================
// MENU SERVICES
// =========================

export const getAllMenus = async () => {
  try {
    const categories = await Menu.findMany({
      // where,
      include: {
        organization: {
          select: OrganizationShortly
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return {
      data: categories,
      total: categories.length,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
    throw new Error('Failed to get categories');
  }
};

/**
 * Create a new menu
 */
export const createMenu = async (data: CreateMenu, userId?: string | null) => {
  try {
    // Check if organization exists
    // const organization = await checkOrganizationExists(data.organizationId)
    // const organization = await Organization.findUnique({
    //   where: { id: data.organizationId }
    // });
    //
    // if (!organization) {
    //   throw new Error('Organization not found');
    // }

    const menu = await Menu.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
        imageUrl: data.imageUrl,
        createdById: userId || null,
      },
      include: {
        organization: true,
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    return menu;
  } catch (error) {
    console.error('Error creating menu:', error);
    throw new Error('Failed to create menu');
  }
};

/**
 * Get menu by ID
 */
export const getMenuById = async (id: string) => {
  try {
    const menu = await Menu.findUnique({
      where: { id },
      include: {
        organization: true,
        items: {
          include: {
            category: true,
            optionLinks: {
              include: {
                group: {
                  include: {
                    items: true,
                  },
                },
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    return menu;
  } catch (error) {
    console.error('Error getting menu by ID:', error);
    throw new Error('Failed to get menu');
  }
};

/**
 * Get all menus with filtering and pagination
 */
export const getMenus = async (query: MenuQuery) => {
  try {
    const {
      organizationId,
      isActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [menus, total] = await Promise.all([
      Menu.findMany({
        where,
        include: {
          organization: {
            select: OrganizationShortly
          },
          _count: {
            select: {
              items: true,
            },
          }
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Menu.count({ where }),
    ]);

    return {
      data: menus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting menus:', error);
    throw new Error('Failed to get menus');
  }
};

/**
 * Update menu
 */
export const updateMenu = async (id: string, data: UpdateMenu, userId?: string | null) => {
  try {
    const menu = await Menu.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        organization: true,
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    return menu;
  } catch (error) {
    console.error('Error updating menu:', error);
    throw new Error('Failed to update menu');
  }
};

/**
 * Delete menu
 */
export const deleteMenu = async (id: string, userId?: string | null) => {
  try {
    // Check if menu has items
    const menuItemsCount = await MenuItem.count({
      where: { menuId: id },
    });

    if (menuItemsCount > 0) {
      throw new Error('Cannot delete menu with items');
    }

    const menu = await Menu.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Menu deleted successfully', data: menu };
  } catch (error) {
    console.error('Error deleting menu:', error);
    throw new Error('Failed to delete menu');
  }
};

// =========================
// MENU ITEM SERVICES
// =========================

export const getAllMenuItems = async () => {
  try {
    const menuItems = await MenuItem.findMany({
      // where,
      include: {
        menu: {
          select: MenuShortly
        },
        category: {
          select: CategoryShortly
        },
      },
      orderBy: [
        { isAvailable: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return {
      data: menuItems,
      total: menuItems.length,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
    throw new Error('Failed to get categories');
  }
};

/**
 * Create a new menu item
 */
export const createMenuItem = async (data: CreateMenuItem, userId?: string | null) => {
  try {
    // Check if menu exists
    const menu = await Menu.findUnique({
      where: { id: data.menuId }
    });

    if (!menu) {
      throw new Error('Menu not found');
    }

    // Check if category exists (if provided)
    if (data.categoryId) {
      const category = await Category.findUnique({
        where: { id: data.categoryId }
      });

      if (!category) {
        throw new Error('Category not found');
      }
    }

    const menuItem = await MenuItem.create({
      data: {
        menuId: data.menuId,
        categoryId: data.categoryId,
        slug: data.slug,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable,
        displayOrder: data.displayOrder,
        isFeatured: data.isFeatured,
        allergens: data.allergens,
        calories: data.calories,
        dietaryInfo: data.dietaryInfo,
        preparationTime: data.preparationTime,
        createdById: userId || null,
      },
      include: {
        menu: {
          include: {
            organization: true,
          },
        },
        category: true,
        optionLinks: {
          include: {
            group: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    return menuItem;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw new Error('Failed to create menu item');
  }
};

/**
 * Get menu item by ID
 */
export const getMenuItemById = async (id: string) => {
  try {
    const menuItem = await MenuItem.findUnique({
      where: { id },
      include: {
        menu: {
          select: MenuShortly,
        },
        category: {
          select: CategoryShortly,
        },
        recipes: {
          include: {
            ingredients: {
              include: {
                inventoryItem: true,
              },
            },
          },
        },
        // optionLinks: {
        //   include: {
        //     group: {
        //       include: {
        //         items: true,
        //       },
        //     },
        //   },
        // },
      },
    });

    return menuItem;
  } catch (error) {
    console.error('Error getting menu item by ID:', error);
    throw new Error('Failed to get menu item');
  }
};

/**
 * Get all menu items with filtering and pagination
 */
export const getMenuItems = async (query: MenuItemQuery) => {
  try {
    const {
      menuId,
      categoryId,
      isAvailable,
      isFeatured,
      search,
      minPrice,
      maxPrice,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (menuId) {
      where.menuId = menuId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    const [menuItems, total] = await Promise.all([
      MenuItem.findMany({
        where,
        include: {
          menu: {
            include: {
              organization: true,
            },
          },
          category: true,
          optionLinks: {
            include: {
              group: {
                include: {
                  items: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      MenuItem.count({ where }),
    ]);

    return {
      data: menuItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw new Error('Failed to get menu items');
  }
};

/**
 * Update menu item
 */
export const updateMenuItem = async (id: string, data: UpdateMenuItem, userId?: string | null) => {
  try {
    const menuItem = await MenuItem.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        menu: {
          include: {
            organization: true,
          },
        },
        category: true,
        optionLinks: {
          include: {
            group: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    return menuItem;
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw new Error('Failed to update menu item');
  }
};

/**
 * Delete menu item (soft delete)
 */
export const deleteMenuItem = async (id: string, userId?: string | null) => {
  try {
    const menuItem = await MenuItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return menuItem;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw new Error('Failed to delete menu item');
  }
};

/**
 * Hard delete menu item
 */
export const hardDeleteMenuItem = async (id: string) => {
  try {
    await MenuItem.delete({
      where: { id },
    });

    return { message: 'Menu item permanently deleted' };
  } catch (error) {
    console.error('Error hard deleting menu item:', error);
    throw new Error('Failed to permanently delete menu item');
  }
};

// =========================
// RECIPE SERVICES
// =========================

/**
 * Create a new recipe
 */
export const createRecipe = async (data: CreateRecipe, userId?: string | null) => {
  try {
    // Check if menu item exists
    const menuItem = await MenuItem.findUnique({
      where: { id: data.menuItemId }
    });

    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    const recipe = await Recipe.create({
      data: {
        menuItemId: data.menuItemId,
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        cookTime: data.cookTime,
        prepTime: data.prepTime,
        servingSize: data.servingSize,
        createdById: userId || null,
      },
      include: {
        menuItem: true,
        ingredients: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return recipe;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw new Error('Failed to create recipe');
  }
};

/**
 * Get recipe by ID
 */
export const getRecipeById = async (id: string) => {
  try {
    const recipe = await Recipe.findUnique({
      where: { id },
      include: {
        menuItem: true,
        ingredients: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return recipe;
  } catch (error) {
    console.error('Error getting recipe by ID:', error);
    throw new Error('Failed to get recipe');
  }
};

/**
 * Get recipe by menu item ID
 */
export const getRecipeByMenuItemId = async (menuItemId: string) => {
  try {
    const recipe = await Recipe.findFirst({
      where: { menuItemId },
      include: {
        menuItem: true,
        ingredients: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return recipe;
  } catch (error) {
    console.error('Error getting recipe by menu item ID:', error);
    throw new Error('Failed to get recipe');
  }
};

/**
 * Update recipe
 */
export const updateRecipe = async (id: string, data: UpdateRecipe, userId?: string | null) => {
  try {
    const recipe = await Recipe.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        menuItem: true,
        ingredients: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return recipe;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw new Error('Failed to update recipe');
  }
};

/**
 * Delete recipe
 */
export const deleteRecipe = async (id: string, userId?: string | null) => {
  try {
    const recipe = await Recipe.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Recipe deleted successfully', data: recipe };
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw new Error('Failed to delete recipe');
  }
};

// =========================
// RECIPE INGREDIENT SERVICES
// =========================

/**
 * Create a new recipe ingredient
 */
export const createRecipeIngredient = async (data: CreateRecipeIngredient) => {
  try {
    // Check if recipe exists
    const recipe = await Recipe.findUnique({
      where: { id: data.recipeId }
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Check if inventory item exists
    const inventoryItem = await InventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    const recipeIngredient = await RecipeIngredient.create({
      data: {
        recipeId: data.recipeId,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        unit: data.unit,
        notes: data.notes,
      },
      include: {
        recipe: true,
        inventoryItem: true,
      },
    });

    return recipeIngredient;
  } catch (error) {
    console.error('Error creating recipe ingredient:', error);
    throw new Error('Failed to create recipe ingredient');
  }
};

/**
 * Update recipe ingredient
 */
export const updateRecipeIngredient = async (id: string, data: UpdateRecipeIngredient) => {
  try {
    const recipeIngredient = await RecipeIngredient.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        recipe: true,
        inventoryItem: true,
      },
    });

    return recipeIngredient;
  } catch (error) {
    console.error('Error updating recipe ingredient:', error);
    throw new Error('Failed to update recipe ingredient');
  }
};

/**
 * Delete recipe ingredient
 */
export const deleteRecipeIngredient = async (id: string) => {
  try {
    await RecipeIngredient.delete({
      where: { id },
    });

    return { message: 'Recipe ingredient deleted successfully' };
  } catch (error) {
    console.error('Error deleting recipe ingredient:', error);
    throw new Error('Failed to delete recipe ingredient');
  }
};

// =========================
// OPTION GROUP SERVICES
// =========================

/**
 * Create a new option group
 */
export const createOptionGroup = async (data: CreateOptionGroup, userId?: string | null) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const optionGroup = await OptionGroup.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        required: data.required,
        minSelect: data.minSelect,
        maxSelect: data.maxSelect,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        createdById: userId || null,
      },
      include: {
        restaurant: true, // OptionGroup still uses restaurantId
        items: true,
      },
    });

    return optionGroup;
  } catch (error) {
    console.error('Error creating option group:', error);
    throw new Error('Failed to create option group');
  }
};

/**
 * Get option group by ID
 */
export const getOptionGroupById = async (id: string) => {
  try {
    const optionGroup = await OptionGroup.findUnique({
      where: { id },
      include: {
        restaurant: true, // OptionGroup still uses restaurantId
        items: true,
        menuLinks: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return optionGroup;
  } catch (error) {
    console.error('Error getting option group by ID:', error);
    throw new Error('Failed to get option group');
  }
};

/**
 * Update option group
 */
export const updateOptionGroup = async (id: string, data: UpdateOptionGroup, userId?: string | null) => {
  try {
    const optionGroup = await OptionGroup.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        restaurant: true, // OptionGroup still uses restaurantId
        items: true,
        menuLinks: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return optionGroup;
  } catch (error) {
    console.error('Error updating option group:', error);
    throw new Error('Failed to update option group');
  }
};

/**
 * Delete option group
 */
export const deleteOptionGroup = async (id: string, userId?: string | null) => {
  try {
    const optionGroup = await OptionGroup.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Option group deleted successfully', data: optionGroup };
  } catch (error) {
    console.error('Error deleting option group:', error);
    throw new Error('Failed to delete option group');
  }
};

// =========================
// OPTION SERVICES
// =========================

/**
 * Create a new option
 */
export const createOption = async (data: CreateOption, userId?: string | null) => {
  try {
    // Check if option group exists
    const optionGroup = await OptionGroup.findUnique({
      where: { id: data.groupId }
    });

    if (!optionGroup) {
      throw new Error('Option group not found');
    }

    const option = await Option.create({
      data: {
        groupId: data.groupId,
        name: data.name,
        priceDelta: data.priceDelta,
        isAvailable: data.isAvailable,
        displayOrder: data.displayOrder,
        createdById: userId || null,
      },
      include: {
        group: true,
      },
    });

    return option;
  } catch (error) {
    console.error('Error creating option:', error);
    throw new Error('Failed to create option');
  }
};

/**
 * Update option
 */
export const updateOption = async (id: string, data: UpdateOption, userId?: string | null) => {
  try {
    const option = await Option.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        group: true,
      },
    });

    return option;
  } catch (error) {
    console.error('Error updating option:', error);
    throw new Error('Failed to update option');
  }
};

/**
 * Delete option
 */
export const deleteOption = async (id: string, userId?: string | null) => {
  try {
    const option = await Option.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Option deleted successfully', data: option };
  } catch (error) {
    console.error('Error deleting option:', error);
    throw new Error('Failed to delete option');
  }
};

// =========================
// MENU ITEM OPTION GROUP SERVICES
// =========================

/**
 * Create a new menu item option group link
 */
export const createMenuItemOptionGroup = async (data: CreateMenuItemOptionGroup) => {
  try {
    // Check if menu item exists
    const menuItem = await MenuItem.findUnique({
      where: { id: data.menuItemId }
    });

    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    // Check if option group exists
    const optionGroup = await OptionGroup.findUnique({
      where: { id: data.groupId }
    });

    if (!optionGroup) {
      throw new Error('Option group not found');
    }

    const menuItemOptionGroup = await MenuItemOptionGroup.create({
      data: {
        menuItemId: data.menuItemId,
        groupId: data.groupId,
        displayOrder: data.displayOrder,
      },
      include: {
        menuItem: true,
        group: {
          include: {
            items: true,
          },
        },
      },
    });

    return menuItemOptionGroup;
  } catch (error) {
    console.error('Error creating menu item option group:', error);
    throw new Error('Failed to create menu item option group');
  }
};

/**
 * Update menu item option group
 */
export const updateMenuItemOptionGroup = async (id: string, data: UpdateMenuItemOptionGroup) => {
  try {
    const menuItemOptionGroup = await MenuItemOptionGroup.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        menuItem: true,
        group: {
          include: {
            items: true,
          },
        },
      },
    });

    return menuItemOptionGroup;
  } catch (error) {
    console.error('Error updating menu item option group:', error);
    throw new Error('Failed to update menu item option group');
  }
};

/**
 * Delete menu item option group
 */
export const deleteMenuItemOptionGroup = async (id: string) => {
  try {
    await MenuItemOptionGroup.delete({
      where: { id },
    });

    return { message: 'Menu item option group deleted successfully' };
  } catch (error) {
    console.error('Error deleting menu item option group:', error);
    throw new Error('Failed to delete menu item option group');
  }
};

// =========================
// BULK OPERATION SERVICES
// =========================

/**
 * Bulk update menu items
 */
export const bulkUpdateMenuItems = async (data: BulkUpdateMenuItems) => {
  try {
    const { menuItemIds, updates } = data;

    await MenuItem.updateMany({
      where: {
        id: { in: menuItemIds },
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return { message: `${menuItemIds.length} menu items updated successfully` };
  } catch (error) {
    console.error('Error bulk updating menu items:', error);
    throw new Error('Failed to bulk update menu items');
  }
};

/**
 * Bulk toggle availability
 */
export const bulkToggleAvailability = async (data: BulkToggleAvailability) => {
  try {
    const { menuItemIds, isAvailable } = data;

    await MenuItem.updateMany({
      where: {
        id: { in: menuItemIds },
      },
      data: {
        isAvailable,
        updatedAt: new Date(),
      },
    });

    return { message: `${menuItemIds.length} menu items availability updated` };
  } catch (error) {
    console.error('Error bulk toggling availability:', error);
    throw new Error('Failed to bulk toggle availability');
  }
};

/**
 * Get featured items
 */
export const getFeaturedItems = async (query: FeaturedItemsQuery) => {
  try {
    const { menuId, limit } = query;

    const where: any = {
      isFeatured: true,
      isAvailable: true,
    };

    if (menuId) {
      where.menuId = menuId;
    }

    const featuredItems = await MenuItem.findMany({
      where,
      include: {
        menu: {
          include: {
            organization: true,
          },
        },
        category: true,
        optionLinks: {
          include: {
            group: {
              include: {
                items: true,
              },
            },
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
      take: limit,
    });

    return featuredItems;
  } catch (error) {
    console.error('Error getting featured items:', error);
    throw new Error('Failed to get featured items');
  }
};

// =========================
// EXISTENCE CHECK SERVICES
// =========================

/**
 * Check if option group exists
 */
export const checkOptionGroupExists = async (optionGroupId: string): Promise<boolean> => {
  try {
    const optionGroup = await OptionGroup.findUnique({
      where: { id: optionGroupId },
      select: { id: true },
    });
    return !!optionGroup;
  } catch (error) {
    console.error('Error checking option group existence:', error);
    return false;
  }
};

/**
 * Check if option exists
 */
export const checkOptionExists = async (optionId: string): Promise<boolean> => {
  try {
    const option = await Option.findUnique({
      where: { id: optionId },
      select: { id: true },
    });
    return !!option;
  } catch (error) {
    console.error('Error checking option existence:', error);
    return false;
  }
};

/**
 * Check if recipe exists
 */
export const checkRecipeExists = async (recipeId: string): Promise<boolean> => {
  try {
    const recipe = await Recipe.findUnique({
      where: { id: recipeId },
      select: { id: true },
    });
    return !!recipe;
  } catch (error) {
    console.error('Error checking recipe existence:', error);
    return false;
  }
};
