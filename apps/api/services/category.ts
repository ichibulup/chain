import {
  CreateCategory,
  UpdateCategory,
  CategoryQuery,
  CategoryTreeNode
} from '@/schemas/category';
import { Database } from '@/models/database';
import { Category } from '@/models/menu';
import { CategoryShortly } from "lib/interfaces";

export const getAllCategories = async () => {
  try {
    const categories = await Category.findMany({
      include: {
        parent: {
          select: CategoryShortly
        },
        children: {
          select: CategoryShortly,
          orderBy: {
            isActive: 'desc'
          }
        },
        _count: {
          select: {
            menuItems: true
          }
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { updatedAt: 'desc' }
      ]
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
 * Create a new category
 */
export const createCategory = async (data: CreateCategory, userId?: string | null) => {
  try {
    // Check if slug already exists
    const existingCategory = await Category.findUnique({
      where: { slug: data.slug }
    });

    if (existingCategory) {
      throw new Error('Category slug already exists');
    }

    // Validate parent category exists if parentId is provided
    if (data.parentId) {
      const parentCategory = await Category.findUnique({
        where: { id: data.parentId }
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    // If displayOrder not provided, set it as the next order in the same level
    let displayOrder = data.displayOrder ?? 0;
    // if (displayOrder === 0) {
    //   const maxOrder = await Category.aggregate({
    //     where: { parentId: data.parentId },
    //     _max: { displayOrder: true }
    //   });
    //   displayOrder = (maxOrder._max.displayOrder ?? 0) + 1;
    // }

    const category = await Category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
        isActive: data.isActive,
        displayOrder,
        createdById: userId || null,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            menuItems: true
          }
        }
      },
    });

    return category;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
    throw new Error('Failed to create category');
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string) => {
  try {
    const category = await Category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: {
            isActive: 'desc'
          }
        },
        _count: {
          select: {
            menuItems: true
          }
        }
      },
    });

    if (!category) return null;

    return category;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get category: ${error.message}`);
    }
    throw new Error('Failed to get category');
  }
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = async (slug: string) => {
  try {
    const category = await Category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          orderBy: {
            isActive: 'desc'
          }
        },
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });

    if (!category) return null;

    return category;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get category by slug: ${error.message}`);
    }
    throw new Error('Failed to get category by slug');
  }
};

/**
 * Get all categories with filtering and pagination
 */
export const getCategories = async (query: CategoryQuery) => {
  try {
    const {
      parentId,
      isActive,
      name,
      slug,
      page = 1,
      limit = 10,
      sortBy = 'isActive',
      sortOrder = 'desc'
    } = query;

    const where: any = {};

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      };
    }

    if (slug) {
      where.slug = {
        contains: slug,
        mode: 'insensitive'
      };
    }

    const total = await Category.count({ where });

    const categories = await Category.findMany({
      where,
      include: {
        parent: true,
        children: {
          orderBy: {
            isActive: 'desc'
          }
        },
        _count: {
          select: {
            menuItems: true
          }
        }
      },
      orderBy: [
        { [sortBy]: sortOrder },
        { isActive: 'desc' }
      ],
      // skip: (page - 1) * limit,
      // take: limit
    });

    const totalPages = Math.ceil(total / limit);

    return {
      categories: categories,
      total,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
    throw new Error('Failed to get categories');
  }
};

/**
 * Get category tree (hierarchical structure)
 */
// export const getCategoryTree = async (parent_id: string | null = null): Promise<CategoryTreeNode[]> => {
//   try {
//     const categories = await Category.findMany({
//       where: {
//         parent_id: parent_id,
//         is_active: true
//       },
//       include: {
//         _count: {
//           select: {
//             menuItems: true
//           }
//         }
//       },
//       orderBy: {
//         displayOrder: 'asc'
//       }
//     });
//
//     const tree: CategoryTreeNode[] = [];
//
//     for (const category of categories) {
//       const children = await getCategoryTree(category.id);
//
//       tree.push({
//         id: category.id,
//         name: category.name,
//         slug: category.slug,
//         description: category.description,
//         image_url: category.image_url,
//         displayOrder: category.display_order,
//         is_active: category.is_active,
//         menu_items_count: category._count.menu_items,
//         children: children.length > 0 ? children : undefined
//       });
//     }
//
//     return tree;
//   } catch (error) {
//     if (error instanceof Error) {
//       throw new Error(`Failed to get category tree: ${error.message}`);
//     }
//     throw new Error('Failed to get category tree');
//   }
// };

/**
 * Update category
 */
export const updateCategory = async (id: string, data: UpdateCategory, userId?: string | null) => {
  try {
    // Check if category exists
    const existingCategory = await Category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if new slug already exists (if slug is being updated)
    if (data.slug && data.slug !== existingCategory.slug) {
      const slugExists = await Category.findUnique({
        where: { slug: data.slug }
      });

      if (slugExists) {
        throw new Error('Category slug already exists');
      }
    }

    // Validate parent category exists if parentId is provided
    if (data.parentId !== undefined && data.parentId) {
      const parentCategory = await Category.findUnique({
        where: { id: data.parentId }
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }

      // Prevent circular reference
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }
    }

    const category = await Category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
        updatedById: userId || undefined,
        updatedAt: new Date()
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });

    return category;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
    throw new Error('Failed to update category');
  }
};

export async function updateStatusCategory(id: string, data: { isActive: boolean }) {
  try {
    // Check if category exists
    const existingCategory = await Category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    const category = await Category.update({
      where: { id },
      data: {
        isActive: data.isActive,
        updatedAt: new Date()
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });

    return category;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
    throw new Error('Failed to update category');
  }
}

/**
 * Delete category (soft delete by setting is_active to false)
 */
export const deleteCategory = async (id: string, userId?: string | null): Promise<void> => {
  try {
    const existingCategory = await Category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if category has active children
    const activeChildren = existingCategory.children.filter((child: any) => child.isActive);
    if (activeChildren.length > 0) {
      throw new Error('Cannot delete category with active subcategories. Please delete or move subcategories first.');
    }

    // Check if category has menu items
    if (existingCategory._count.menuItems > 0) {
      throw new Error('Cannot delete category with menu items. Please move or delete menu items first.');
    }

    await Category.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: userId || null,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
    throw new Error('Failed to delete category');
  }
};

/**
 * Hard delete category (permanently remove from database)
 */
export const hardDeleteCategory = async (id: string): Promise<void> => {
  try {
    const existingCategory = await Category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if category has children
    if (existingCategory.children.length > 0) {
      throw new Error('Cannot delete category with subcategories. Please delete subcategories first.');
    }

    // Check if category has menu items
    if (existingCategory._count.menuItems > 0) {
      throw new Error('Cannot delete category with menu items. Please delete menu items first.');
    }

    await Category.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to hard delete category: ${error.message}`);
    }
    throw new Error('Failed to hard delete category');
  }
};

/**
 * Reorder categories
 */
export const reorderCategories = async (categories: { id: string; displayOrder: number }[]): Promise<void> => {
  try {
    await Database.$transaction(async (tx) => {
      for (const item of categories) {
        await tx.category.update({
          where: { id: item.id },
          data: {
            displayOrder: item.displayOrder,
            updatedAt: new Date()
          }
        });
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to reorder categories: ${error.message}`);
    }
    throw new Error('Failed to reorder categories');
  }
};

/**
 * Move category to different parent
 */
export const moveCategory = async (categoryId: string, newParentId: string | null, newDisplayOrder?: number) => {
  try {
    // Check if category exists
    const category = await Category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if new parent exists (if not null)
    if (newParentId) {
      const newParent = await Category.findUnique({
        where: { id: newParentId }
      });

      if (!newParent) {
        throw new Error('New parent category not found');
      }

      // Prevent circular reference
      if (newParentId === categoryId) {
        throw new Error('Category cannot be moved to itself');
      }
    }

    // Calculate new display order if not provided
    let displayOrder = newDisplayOrder;
    if (displayOrder === undefined) {
      const maxOrder = await Category.aggregate({
        where: { parentId: newParentId },
        _max: { displayOrder: true }
      });
      displayOrder = (maxOrder._max.displayOrder ?? 0) + 1;
    }

    const updatedCategory = await Category.update({
      where: { id: categoryId },
      data: {
        parentId: newParentId,
        displayOrder,
        updatedAt: new Date()
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });

    return category;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to move category: ${error.message}`);
    }
    throw new Error('Failed to move category');
  }
};

/**
 * Get category breadcrumbs (path from root to category)
 */
export const getCategoryBreadcrumbs = async (id: string) => {
  try {
    const breadcrumbs: { id: string; name: string; slug: string }[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const category: { id: string; name: string; slug: string; parentId: string | null } | null = await Category.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true
        }
      });

      if (!category) break;

      breadcrumbs.unshift({
        id: category.id,
        name: category.name,
        slug: category.slug
      });

      currentId = category.parentId;
    }

    return breadcrumbs;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get category breadcrumbs: ${error.message}`);
    }
    throw new Error('Failed to get category breadcrumbs');
  }
};

// ================================
// 🔍 EXISTENCE CHECK FUNCTIONS
// ================================

// Kiểm tra category slug có tồn tại không
export const checkCategorySlugExists = async (slug: string, excludeId?: string): Promise<boolean> => {
  try {
    const where: any = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    
    const category = await Category.findUnique({
      where,
      select: { id: true }
    });
    return !!category;
  } catch (error) {
    return false;
  }
};

// Kiểm tra category có children không
export const checkCategoryHasChildren = async (categoryId: string): Promise<boolean> => {
  try {
    const category = await Category.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          where: { isActive: true }
        }
      }
    });
    return category ? category.children.length > 0 : false;
  } catch (error) {
    return false;
  }
};

// Kiểm tra category có menu items không
export const checkCategoryHasMenuItems = async (categoryId: string): Promise<boolean> => {
  try {
    const category = await Category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });
    return category ? category._count.menuItems > 0 : false;
  } catch (error) {
    return false;
  }
};

// Kiểm tra circular reference khi update parent
export const checkCircularReference = async (categoryId: string, newParentId: string): Promise<boolean> => {
  try {
    if (categoryId === newParentId) {
      return true; // Self reference
    }

    let currentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) {
        return true; // Circular reference detected
      }
      
      if (currentId === categoryId) {
        return true; // Would create circular reference
      }

      visited.add(currentId);

      const category: { parentId: string | null } | null = await Category.findUnique({
        where: { id: currentId },
        select: { parentId: true }
      });

      currentId = category?.parentId || null;
    }

    return false;
  } catch (error) {
    return true; // Assume circular reference to be safe
  }
};

// Kiểm tra tất cả categories có tồn tại không
export const checkAllCategoriesExist = async (categoryIds: string[]): Promise<{ allExist: boolean; missingIds: string[] }> => {
  try {
    const existingCategories = await Category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true }
    });

    const foundIds = existingCategories.map(category => category.id);
    const missingIds = categoryIds.filter(id => !foundIds.includes(id));

    return {
      allExist: missingIds.length === 0,
      missingIds
    };
  } catch (error) {
    return {
      allExist: false,
      missingIds: categoryIds
    };
  }
};
