import type {
  CreateVoucher,
  UpdateVoucher,
  VoucherQuery,
  CreateVoucherUsage,
  ValidateVoucher,
  CreatePromotion,
  UpdatePromotion,
  PromotionQuery,
  CreatePromotionMenuItem,
  BulkAddPromotionMenuItems,
} from '@/schemas/promotion';
import {
  Promotion,
  PromotionMenuItem,
  Voucher,
  VoucherUsage,
} from '@/models/promotion';
import { MenuItem } from '@/models/menu';
import { Restaurant } from '@/models/organization';
import { Database } from '@/models/database';

// =========================
// VOUCHER SERVICES
// =========================

/**
 * Create a new voucher
 */
export const createVoucher = async (data: CreateVoucher) => {
  try {
    // Check if code already exists
    const existingVoucher = await Voucher.findUnique({
      where: { code: data.code },
    });

    if (existingVoucher) {
      throw new Error('Voucher code already exists');
    }

    // Check if restaurant exists if provided
    if (data.restaurantId) {
      const restaurant = await Restaurant.findUnique({
        where: { id: data.restaurantId },
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    const voucher = await Voucher.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderValue: data.minOrderValue || null,
        maxDiscount: data.maxDiscount || null,
        restaurantId: data.restaurantId || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        usageLimit: data.usageLimit || null,
        isActive: data.isActive,
      },
    });

    return voucher;
  } catch (error) {
    console.error('Error creating voucher:', error);
    throw error;
  }
};

/**
 * Get voucher by ID
 */
export const getVoucherById = async (id: string) => {
  try {
    const voucher = await Voucher.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        usages: {
          select: {
            id: true,
            userId: true,
            orderId: true,
            usedAt: true,
          },
          orderBy: { usedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    return voucher;
  } catch (error) {
    console.error('Error getting voucher by ID:', error);
    throw error;
  }
};

/**
 * Get voucher by code
 */
export const getVoucherByCode = async (code: string) => {
  try {
    const voucher = await Voucher.findUnique({
      where: { code },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    return voucher;
  } catch (error) {
    console.error('Error getting voucher by code:', error);
    throw error;
  }
};

/**
 * Get all vouchers with filtering and pagination
 */
export const getVouchers = async (query: VoucherQuery) => {
  try {
    const {
      restaurantId,
      isActive,
      search,
      discountType,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (discountType) {
      where.discountType = discountType;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vouchers, total] = await Promise.all([
      Voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              usages: true,
            },
          },
        },
      }),
      Voucher.count({ where }),
    ]);

    return {
      data: vouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting vouchers:', error);
    throw error;
  }
};

/**
 * Update voucher
 */
export const updateVoucher = async (id: string, data: UpdateVoucher) => {
  try {
    const voucher = await Voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.minOrderValue !== undefined) updateData.minOrderValue = data.minOrderValue;
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedVoucher = await Voucher.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedVoucher;
  } catch (error) {
    console.error('Error updating voucher:', error);
    throw error;
  }
};

/**
 * Delete voucher
 */
export const deleteVoucher = async (id: string) => {
  try {
    const voucher = await Voucher.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    // Check if voucher has been used
    if (voucher._count.usages > 0) {
      throw new Error('Cannot delete voucher that has been used');
    }

    await Voucher.delete({
      where: { id },
    });

    return { message: 'Voucher deleted successfully' };
  } catch (error) {
    console.error('Error deleting voucher:', error);
    throw error;
  }
};

/**
 * Validate voucher for usage
 */
export const validateVoucher = async (data: ValidateVoucher) => {
  try {
    const voucher = await Voucher.findUnique({
      where: { code: data.code },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
        usages: {
          where: { userId: data.userId },
          select: { id: true },
        },
      },
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    // Check if voucher is active
    if (!voucher.isActive) {
      throw new Error('Voucher is not active');
    }

    // Check if voucher is valid for the restaurant
    if (data.restaurantId && voucher.restaurantId && voucher.restaurantId !== data.restaurantId) {
      throw new Error('Voucher is not valid for this restaurant');
    }

    // Check if voucher is within valid date range
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new Error('Voucher is not valid at this time');
    }

    // Check if voucher usage limit has been reached
    if (voucher.usageLimit && voucher._count.usages >= voucher.usageLimit) {
      throw new Error('Voucher usage limit has been reached');
    }

    // Check minimum order value
    if (voucher.minOrderValue && data.orderValue < Number(voucher.minOrderValue)) {
      throw new Error(`Minimum order value of ${voucher.minOrderValue} not met`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === 'percentage') {
      discountAmount = (data.orderValue * Number(voucher.discountValue)) / 100;
      if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
        discountAmount = Number(voucher.maxDiscount);
      }
    } else {
      discountAmount = Number(voucher.discountValue);
    }

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      },
      discountAmount,
    };
  } catch (error) {
    console.error('Error validating voucher:', error);
    throw error;
  }
};

// =========================
// VOUCHER USAGE SERVICES
// =========================

/**
 * Create voucher usage record
 */
export const createVoucherUsage = async (data: CreateVoucherUsage) => {
  try {
    // Verify voucher exists
    const voucher = await Voucher.findUnique({
      where: { id: data.voucherId },
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    // Create usage record and increment used count
    const [usage] = await Database.$transaction([
      VoucherUsage.create({
        data: {
          voucherId: data.voucherId,
          userId: data.userId,
          orderId: data.orderId || null,
        },
      }),
      Voucher.update({
        where: { id: data.voucherId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return usage;
  } catch (error) {
    console.error('Error creating voucher usage:', error);
    throw error;
  }
};

/**
 * Get voucher usage history
 */
export const getVoucherUsages = async (voucherId: string, page: number = 1, limit: number = 10) => {
  try {
    const skip = (page - 1) * limit;

    const [usages, total] = await Promise.all([
      VoucherUsage.findMany({
        where: { voucherId },
        skip,
        take: limit,
        orderBy: { usedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          order: {
            select: {
              id: true,
              orderCode: true,
              totalAmount: true,
              status: true,
            },
          },
        },
      }),
      VoucherUsage.count({ where: { voucherId } }),
    ]);

    return {
      data: usages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting voucher usages:', error);
    throw error;
  }
};

// =========================
// PROMOTION SERVICES
// =========================

/**
 * Create a new promotion
 */
export const createPromotion = async (data: CreatePromotion) => {
  try {
    // Verify restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Verify menu items exist if provided
    if (data.menuItemIds && data.menuItemIds.length > 0) {
      const menuItems = await MenuItem.findMany({
        where: {
          id: { in: data.menuItemIds },
          // MenuItem doesn't have restaurantId, it links through menu
        },
      });

      if (menuItems.length !== data.menuItemIds.length) {
        throw new Error('One or more menu items not found or do not belong to this restaurant');
      }
    }

    const promotion = await Promotion.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.description || null,
        type: data.type,
        discountValue: data.discountValue,
        conditions: data.conditions || null,
        timeRestrictions: data.timeRestrictions || null,
        isActive: data.isActive,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        menuItems: data.menuItemIds
          ? {
              create: data.menuItemIds.map((menuItemId) => ({
                menuItemId,
              })),
            }
          : undefined,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        menuItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return promotion;
  } catch (error) {
    console.error('Error creating promotion:', error);
    throw error;
  }
};

/**
 * Get promotion by ID
 */
export const getPromotionById = async (id: string) => {
  try {
    const promotion = await Promotion.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        menuItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    return promotion;
  } catch (error) {
    console.error('Error getting promotion by ID:', error);
    throw error;
  }
};

/**
 * Get all promotions with filtering and pagination
 */
export const getPromotions = async (query: PromotionQuery) => {
  try {
    const {
      restaurantId,
      isActive,
      type,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [promotions, total] = await Promise.all([
      Promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              menuItems: true,
            },
          },
        },
      }),
      Promotion.count({ where }),
    ]);

    return {
      data: promotions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting promotions:', error);
    throw error;
  }
};

/**
 * Update promotion
 */
export const updatePromotion = async (id: string, data: UpdatePromotion) => {
  try {
    const promotion = await Promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Verify menu items if provided
    if (data.menuItemIds) {
    // MenuItem doesn't have restaurantId, it links through menu
    const menuItems = await MenuItem.findMany({
      where: {
        id: { in: data.menuItemIds },
        menu: {
          organization: {
            restaurants: {
              some: {
                id: promotion.restaurantId,
              },
            },
          },
        },
      },
    });

      if (menuItems.length !== data.menuItemIds.length) {
        throw new Error('One or more menu items not found or do not belong to this restaurant');
      }
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.timeRestrictions !== undefined) updateData.timeRestrictions = data.timeRestrictions;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

    // Update menu items if provided
    if (data.menuItemIds) {
      // Delete existing menu items
      await PromotionMenuItem.deleteMany({
        where: { promotionId: id },
      });

      // Create new menu items
      updateData.menuItems = {
        create: data.menuItemIds.map((menuItemId) => ({
          menuItemId,
        })),
      };
    }

    const updatedPromotion = await Promotion.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        menuItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return updatedPromotion;
  } catch (error) {
    console.error('Error updating promotion:', error);
    throw error;
  }
};

/**
 * Delete promotion
 */
export const deletePromotion = async (id: string) => {
  try {
    const promotion = await Promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    await Promotion.delete({
      where: { id },
    });

    return { message: 'Promotion deleted successfully' };
  } catch (error) {
    console.error('Error deleting promotion:', error);
    throw error;
  }
};

/**
 * Get active promotions for a restaurant
 */
export const getActivePromotions = async (restaurantId: string) => {
  try {
    const now = new Date();

    const promotions = await Promotion.findMany({
      where: {
        restaurantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        menuItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return promotions;
  } catch (error) {
    console.error('Error getting active promotions:', error);
    throw error;
  }
};

// =========================
// PROMOTION MENU ITEM SERVICES
// =========================

/**
 * Add menu item to promotion
 */
export const addPromotionMenuItem = async (data: CreatePromotionMenuItem) => {
  try {
    // Verify promotion exists
    const promotion = await Promotion.findUnique({
      where: { id: data.promotionId },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Verify menu item exists and belongs to the same restaurant
    // MenuItem links through menu -> organization -> restaurants
    const menuItemWithMenu = await MenuItem.findUnique({
      where: { id: data.menuItemId },
      include: {
        menu: {
          include: {
            organization: {
              include: {
                restaurants: true,
              },
            },
          },
        },
      },
    });

    if (!menuItemWithMenu) {
      throw new Error('Menu item not found');
    }

    if (!menuItemWithMenu.menu.organization.restaurants.some(r => r.id === promotion.restaurantId)) {
      throw new Error('Menu item does not belong to the same restaurant as the promotion');
    }

    // Check if already linked
    const existing = await PromotionMenuItem.findUnique({
      where: {
        promotionId_menuItemId: {
          promotionId: data.promotionId,
          menuItemId: data.menuItemId,
        },
      },
    });

    if (existing) {
      throw new Error('Menu item is already linked to this promotion');
    }

    const promotionMenuItem = await PromotionMenuItem.create({
      data: {
        promotionId: data.promotionId,
        menuItemId: data.menuItemId,
      },
      include: {
        promotion: {
          select: {
            id: true,
            name: true,
            type: true,
            discountValue: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    return promotionMenuItem;
  } catch (error) {
    console.error('Error adding promotion menu item:', error);
    throw error;
  }
};

/**
 * Remove menu item from promotion
 */
export const removePromotionMenuItem = async (id: string) => {
  try {
    const promotionMenuItem = await PromotionMenuItem.findUnique({
      where: { id },
    });

    if (!promotionMenuItem) {
      throw new Error('Promotion menu item link not found');
    }

    await PromotionMenuItem.delete({
      where: { id },
    });

    return { message: 'Menu item removed from promotion successfully' };
  } catch (error) {
    console.error('Error removing promotion menu item:', error);
    throw error;
  }
};

/**
 * Bulk add menu items to promotion
 */
export const bulkAddPromotionMenuItems = async (data: BulkAddPromotionMenuItems) => {
  try {
    // Verify promotion exists
    const promotion = await Promotion.findUnique({
      where: { id: data.promotionId },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Verify all menu items exist and belong to the same restaurant
    const menuItems = await MenuItem.findMany({
      where: {
        id: { in: data.menuItemIds },
        menu: {
          organization: {
            restaurants: {
              some: {
                id: promotion.restaurantId,
              },
            },
          },
        },
      },
    });

    if (menuItems.length !== data.menuItemIds.length) {
      throw new Error('One or more menu items not found or do not belong to this restaurant');
    }

    // Delete existing links
    await PromotionMenuItem.deleteMany({
      where: { promotionId: data.promotionId },
    });

    // Create new links
    const promotionMenuItems = await PromotionMenuItem.createMany({
      data: data.menuItemIds.map((menuItemId) => ({
        promotionId: data.promotionId,
        menuItemId,
      })),
    });

    return {
      message: `${promotionMenuItems.count} menu items added to promotion successfully`,
      count: promotionMenuItems.count,
    };
  } catch (error) {
    console.error('Error bulk adding promotion menu items:', error);
    throw error;
  }
};

// =========================
// HELPER FUNCTIONS
// =========================

/**
 * Check if voucher exists
 */
export const checkVoucherExists = async (voucherId: string): Promise<boolean> => {
  try {
    const voucher = await Voucher.findUnique({
      where: { id: voucherId },
      select: { id: true },
    });
    return !!voucher;
  } catch (error) {
    return false;
  }
};

/**
 * Check if promotion exists
 */
export const checkPromotionExists = async (promotionId: string): Promise<boolean> => {
  try {
    const promotion = await Promotion.findUnique({
      where: { id: promotionId },
      select: { id: true },
    });
    return !!promotion;
  } catch (error) {
    return false;
  }
};
