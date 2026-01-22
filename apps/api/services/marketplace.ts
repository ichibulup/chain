import { Prisma } from '@prisma/client/index';
import {
  CreateRetailProduct,
  UpdateRetailProduct,
  RetailProductQuery,
  CreateCart,
  UpdateCart,
  CartQuery,
  CreateCartItem,
  UpdateCartItem,
  CartItemQuery,
  CreateCartItemOption,
  UpdateCartItemOption,
  CartItemOptionQuery,
} from '@/schemas/marketplace';
import {
  Cart,
  CartItem,
  CartItemOption,
  RetailProduct,
} from '@/models/marketplace';
import { InventoryItem } from '@/models/inventory';
import { MenuItem, Option } from '@/models/menu';
import { Restaurant } from '@/models/organization';
import { checkUserExists } from '@/services/helper'

/**
 * Recalculate cart totals based on items
 */
const recalculateCartTotals = async (cartId: string): Promise<void> => {
  try {
    const items = await CartItem.findMany({
      where: { cartId },
      include: { options: true },
    });

    const subtotal = items.reduce((sum, item) => {
      const itemTotal = Number(item.totalPrice);
      const optionsTotal = item.options.reduce((optSum, opt) => optSum + Number(opt.priceDelta), 0);
      return sum + itemTotal + optionsTotal;
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Simple tax calculation (can be enhanced based on business rules)
    const taxAmount = subtotal * 0.1; // 10% tax
    const deliveryFee = subtotal > 50 ? 0 : 5; // Free delivery over $50
    const totalAmount = subtotal + taxAmount + deliveryFee;

    await Cart.update({
      where: { id: cartId },
      data: {
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        deliveryFee: new Prisma.Decimal(deliveryFee),
        totalAmount: new Prisma.Decimal(totalAmount),
        itemCount,
        lastActivity: new Date(),
      },
    });
  } catch (error) {
    console.error('Error recalculating cart totals:', error);
    throw error;
  }
};

// ============================================================================
// RETAIL PRODUCT SERVICES
// ============================================================================

/**
 * Create new retail product
 */
export const createRetailProduct = async (data: CreateRetailProduct) => {
  try {
    // Verify references if provided
    if (data.restaurantId) {
      const restaurant = await Restaurant.findUnique({
        where: { id: data.restaurantId },
        select: { id: true },
      });
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    if (data.inventoryItemId) {
      const inventoryItem = await InventoryItem.findUnique({
        where: { id: data.inventoryItemId },
        select: { id: true },
      });
      if (!inventoryItem) {
        throw new Error('Inventory item not found');
      }
    }

    if (data.menuItemId) {
      const menuItem = await MenuItem.findUnique({
        where: { id: data.menuItemId },
        select: { id: true },
      });
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
    }

    const product = await RetailProduct.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
        compareAtPrice: data.compareAtPrice ? new Prisma.Decimal(data.compareAtPrice) : null,
        costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : null,
        stockQty: data.stockQty ? new Prisma.Decimal(data.stockQty) : null,
        weight: data.weight ? new Prisma.Decimal(data.weight) : null,
        rating: data.rating ? new Prisma.Decimal(data.rating) : null,
        minOrderQty: data.minOrderQty ? new Prisma.Decimal(data.minOrderQty) : null,
        maxOrderQty: data.maxOrderQty ? new Prisma.Decimal(data.maxOrderQty) : null,
      },
      include: {
        restaurant: true,
        inventoryItem: true,
        menuItem: true,
      },
    });

    return product;
  } catch (error) {
    console.error('Error creating retail product:', error);
    throw error;
  }
};

/**
 * Get retail product by ID
 */
export const getRetailProductById = async (id: string) => {
  try {
    const product = await RetailProduct.findUnique({
      where: { id },
      include: {
        restaurant: true,
        inventoryItem: true,
        menuItem: true,
      },
    });

    return product;
  } catch (error) {
    console.error('Error getting retail product:', error);
    throw error;
  }
};

/**
 * Get retail products with filtering and pagination
 */
export const getRetailProducts = async (query: RetailProductQuery) => {
  try {
    const {
      restaurantId,
      inventoryItemId,
      menuItemId,
      category,
      isFeatured,
      isBestSeller,
      isActive,
      isDeliverable,
      search,
      minPrice,
      maxPrice,
      minRating,
      tags,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.RetailProductWhereInput = {};

    if (restaurantId) where.restaurantId = restaurantId;
    if (inventoryItemId) where.inventoryItemId = inventoryItemId;
    if (menuItemId) where.menuItemId = menuItemId;
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isBestSeller !== undefined) where.isBestSeller = isBestSeller;
    if (isActive !== undefined) where.isActive = isActive;
    if (isDeliverable !== undefined) where.isDeliverable = isDeliverable;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
      if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
    }

    if (minRating !== undefined) {
      where.rating = { gte: new Prisma.Decimal(minRating) };
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      where.tags = { hasSome: tagArray };
    }

    // Build orderBy
    const orderBy: Prisma.RetailProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [products, total] = await Promise.all([
      RetailProduct.findMany({
        where,
        include: {
          restaurant: true,
          inventoryItem: true,
          menuItem: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      RetailProduct.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting retail products:', error);
    throw error;
  }
};

/**
 * Update retail product
 */
export const updateRetailProduct = async (id: string, data: UpdateRetailProduct) => {
  try {
    const existing = await RetailProduct.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Retail product not found');
    }

    // Verify references if provided
    if (data.restaurantId) {
      const restaurant = await Restaurant.findUnique({
        where: { id: data.restaurantId },
        select: { id: true },
      });
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    if (data.inventoryItemId) {
      const inventoryItem = await InventoryItem.findUnique({
        where: { id: data.inventoryItemId },
        select: { id: true },
      });
      if (!inventoryItem) {
        throw new Error('Inventory item not found');
      }
    }

    if (data.menuItemId) {
      const menuItem = await MenuItem.findUnique({
        where: { id: data.menuItemId },
        select: { id: true },
      });
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
    }

    const updateData: any = { ...data };
    if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
    if (data.compareAtPrice !== undefined) updateData.compareAtPrice = data.compareAtPrice ? new Prisma.Decimal(data.compareAtPrice) : null;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice ? new Prisma.Decimal(data.costPrice) : null;
    if (data.stockQty !== undefined) updateData.stockQty = data.stockQty ? new Prisma.Decimal(data.stockQty) : null;
    if (data.weight !== undefined) updateData.weight = data.weight ? new Prisma.Decimal(data.weight) : null;
    if (data.rating !== undefined) updateData.rating = data.rating ? new Prisma.Decimal(data.rating) : null;
    if (data.minOrderQty !== undefined) updateData.minOrderQty = data.minOrderQty ? new Prisma.Decimal(data.minOrderQty) : null;
    if (data.maxOrderQty !== undefined) updateData.maxOrderQty = data.maxOrderQty ? new Prisma.Decimal(data.maxOrderQty) : null;

    const product = await RetailProduct.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: true,
        inventoryItem: true,
        menuItem: true,
      },
    });

    return product;
  } catch (error) {
    console.error('Error updating retail product:', error);
    throw error;
  }
};

/**
 * Delete retail product
 */
export const deleteRetailProduct = async (id: string) => {
  try {
    const existing = await RetailProduct.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Retail product not found');
    }

    await RetailProduct.delete({
      where: { id },
    });

    return { message: 'Retail product deleted successfully' };
  } catch (error) {
    console.error('Error deleting retail product:', error);
    throw error;
  }
};

// ============================================================================
// CART SERVICES
// ============================================================================

/**
 * Create new cart
 */
export const createCart = async (data: CreateCart) => {
  try {
    // const userExists = await checkUserExists(data.userId);
    // if (!userExists) {
    //   throw new Error('User not found');
    // }

    // if (data.restaurantId) {
    //   const restaurant = await Restaurant.findUnique({
    //     where: { id: data.restaurantId },
    //     select: { id: true },
    //   });
    //   if (!restaurant) {
    //     throw new Error('Restaurant not found');
    //   }
    // }

    const cart = await Cart.create({
      data: {
        ...data,
        subtotal: new Prisma.Decimal(data.subtotal || 0),
        taxAmount: new Prisma.Decimal(data.taxAmount || 0),
        deliveryFee: new Prisma.Decimal(data.deliveryFee || 0),
        totalAmount: new Prisma.Decimal(data.totalAmount || 0),
      },
      include: {
        user: true,
        restaurant: true,
        items: true,
      },
    });

    return cart;
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
};

/**
 * Get cart by ID
 */
export const getCartById = async (id: string) => {
  try {
    const cart = await Cart.findUnique({
      where: { id },
      include: {
        user: true,
        restaurant: true,
        items: {
          include: {
            menuItem: true,
            retailProduct: true,
            options: {
              include: {
                option: true,
              },
            },
          },
        },
      },
    });

    return cart;
  } catch (error) {
    console.error('Error getting cart:', error);
    throw error;
  }
};

/**
 * Get carts with filtering and pagination
 */
export const getCarts = async (query: CartQuery) => {
  try {
    const {
      userId,
      restaurantId,
      sessionId,
      hasItems,
      isExpired,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CartWhereInput = {};

    if (userId) where.userId = userId;
    if (restaurantId) where.restaurantId = restaurantId;
    // if (sessionId) where.sessionId = sessionId;

    if (hasItems !== undefined) {
      if (hasItems) {
        where.itemCount = { gt: 0 };
      } else {
        where.itemCount = 0;
      }
    }

    if (isExpired !== undefined) {
      if (isExpired) {
        where.expiresAt = { lte: new Date() };
      } else {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ];
      }
    }

    // Build orderBy
    const orderBy: Prisma.CartOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [carts, total] = await Promise.all([
      Cart.findMany({
        where,
        include: {
          user: true,
          restaurant: true,
          items: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      Cart.count({ where }),
    ]);

    return {
      data: carts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting carts:', error);
    throw error;
  }
};

/**
 * Update cart
 */
export const updateCart = async (id: string, data: UpdateCart) => {
  try {
    const existing = await Cart.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Cart not found');
    }

    if (data.restaurantId) {
      const restaurant = await Restaurant.findUnique({
        where: { id: data.restaurantId },
        select: { id: true },
      });
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    const updateData: any = { ...data };
    if (data.subtotal !== undefined) updateData.subtotal = new Prisma.Decimal(data.subtotal);
    if (data.taxAmount !== undefined) updateData.taxAmount = new Prisma.Decimal(data.taxAmount);
    if (data.deliveryFee !== undefined) updateData.deliveryFee = new Prisma.Decimal(data.deliveryFee);
    if (data.totalAmount !== undefined) updateData.totalAmount = new Prisma.Decimal(data.totalAmount);

    const cart = await Cart.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        restaurant: true,
        items: true,
      },
    });

    return cart;
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
};

/**
 * Delete cart
 */
export const deleteCart = async (id: string) => {
  try {
    const existing = await Cart.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Cart not found');
    }

    await Cart.delete({
      where: { id },
    });

    return { message: 'Cart deleted successfully' };
  } catch (error) {
    console.error('Error deleting cart:', error);
    throw error;
  }
};

/**
 * Clear cart (remove all items)
 */
export const clearCart = async (cartId: string) => {
  try {
    const existing = await Cart.findUnique({
      where: { id: cartId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Cart not found');
    }

    await CartItem.deleteMany({
      where: { cartId },
    });

    await Cart.update({
      where: { id: cartId },
      data: {
        itemCount: 0,
        subtotal: new Prisma.Decimal(0),
        taxAmount: new Prisma.Decimal(0),
        deliveryFee: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(0),
        lastActivity: new Date(),
      },
    });

    return { message: 'Cart cleared successfully' };
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// ============================================================================
// CART ITEM SERVICES
// ============================================================================

/**
 * Create cart item (add to cart)
 */
export const createCartItem = async (data: CreateCartItem) => {
  try {
    const cart = await Cart.findUnique({
      where: { id: data.cartId },
      select: { id: true },
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Verify product exists
    if (data.menuItemId) {
      const menuItem = await MenuItem.findUnique({
        where: { id: data.menuItemId },
        select: { id: true, price: true, name: true, imageUrl: true },
      });
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
    }

    if (data.retailProductId) {
      const retailProduct = await RetailProduct.findUnique({
        where: { id: data.retailProductId },
        select: { id: true, price: true, name: true, imageUrls: true },
      });
      if (!retailProduct) {
        throw new Error('Retail product not found');
      }
    }

    const cartItem = await CartItem.create({
      data: {
        ...data,
        unitPrice: new Prisma.Decimal(data.unitPrice),
        totalPrice: new Prisma.Decimal(data.totalPrice),
      },
      include: {
        cart: true,
        menuItem: true,
        retailProduct: true,
        options: true,
      },
    });

    // Recalculate cart totals
    await recalculateCartTotals(data.cartId);

    return cartItem;
  } catch (error) {
    console.error('Error creating cart item:', error);
    throw error;
  }
};

/**
 * Get cart item by ID
 */
export const getCartItemById = async (id: string) => {
  try {
    const cartItem = await CartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        menuItem: true,
        retailProduct: true,
        options: {
          include: {
            option: true,
          },
        },
      },
    });

    return cartItem;
  } catch (error) {
    console.error('Error getting cart item:', error);
    throw error;
  }
};

/**
 * Get cart items with filtering and pagination
 */
export const getCartItems = async (query: CartItemQuery) => {
  try {
    const {
      cartId,
      userId,
      menuItemId,
      retailProductId,
      isGift,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CartItemWhereInput = {};

    if (cartId) where.cartId = cartId;
    if (menuItemId) where.menuItemId = menuItemId;
    if (retailProductId) where.retailProductId = retailProductId;
    if (isGift !== undefined) where.isGift = isGift;

    if (userId) {
      where.cart = { userId };
    }

    // Build orderBy
    let orderBy: Prisma.CartItemOrderByWithRelationInput = {};
    if (sortBy === 'quantity') {
      orderBy.quantity = sortOrder;
    } else if (sortBy === 'totalPrice') {
      orderBy.totalPrice = sortOrder;
    } else {
      orderBy.cart = { createdAt: sortOrder };
    }

    const [cartItems, total] = await Promise.all([
      CartItem.findMany({
        where,
        include: {
          cart: true,
          menuItem: true,
          retailProduct: true,
          options: {
            include: {
              option: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      CartItem.count({ where }),
    ]);

    return {
      data: cartItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting cart items:', error);
    throw error;
  }
};

/**
 * Update cart item
 */
export const updateCartItem = async (id: string, data: UpdateCartItem) => {
  try {
    const existing = await CartItem.findUnique({
      where: { id },
      select: { id: true, cartId: true },
    });

    if (!existing) {
      throw new Error('Cart item not found');
    }

    const updateData: any = { ...data };
    if (data.unitPrice !== undefined) updateData.unitPrice = new Prisma.Decimal(data.unitPrice);
    if (data.totalPrice !== undefined) updateData.totalPrice = new Prisma.Decimal(data.totalPrice);

    const cartItem = await CartItem.update({
      where: { id },
      data: updateData,
      include: {
        cart: true,
        menuItem: true,
        retailProduct: true,
        options: true,
      },
    });

    // Recalculate cart totals
    await recalculateCartTotals(existing.cartId);

    return cartItem;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

/**
 * Delete cart item
 */
export const deleteCartItem = async (id: string) => {
  try {
    const existing = await CartItem.findUnique({
      where: { id },
      select: { id: true, cartId: true },
    });

    if (!existing) {
      throw new Error('Cart item not found');
    }

    await CartItem.delete({
      where: { id },
    });

    // Recalculate cart totals
    await recalculateCartTotals(existing.cartId);

    return { message: 'Cart item deleted successfully' };
  } catch (error) {
    console.error('Error deleting cart item:', error);
    throw error;
  }
};

/**
 * Add item to cart with duplicate detection
 * If item already exists in cart, increment quantity
 * Otherwise create new cart item
 * AUTO-CREATE CART if it doesn't exist
 */
export const addToCart = async (data: CreateCartItem, userId?: string, restaurantId?: string) => {
  try {
    // Auto-create cart if it doesn't exist
    let cart = await Cart.findUnique({
      where: { id: data.cartId },
      select: { id: true },
    });

    if (!cart && userId) {
      // Create new cart automatically
      console.log(`Auto-creating cart with ID: ${data.cartId} for user: ${userId}`);
      cart = await Cart.create({
        data: {
          id: data.cartId,
          userId,
          restaurantId: restaurantId,
          subtotal: new Prisma.Decimal(0),
          taxAmount: new Prisma.Decimal(0),
          deliveryFee: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(0),
          itemCount: 0,
        },
      });
    }

    if (!cart) {
      throw new Error('Cart not found and cannot be auto-created without userId');
    }

    // Check for existing cart item with same menuItemId or retailProductId
    const existingItem = await CartItem.findFirst({
      where: {
        cartId: data.cartId,
        menuItemId: data.menuItemId || null,
        retailProductId: data.retailProductId || null,
      },
    });

    if (existingItem) {
      // If item exists, update quantity
      const newQuantity = Number(existingItem.quantity) + data.quantity;
      return await updateCartItem(existingItem.id, { quantity: newQuantity });
    }

    // Otherwise create new cart item
    return await createCartItem(data);
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// ============================================================================
// CART ITEM OPTION SERVICES
// ============================================================================

/**
 * Create cart item option
 */
export const createCartItemOption = async (data: CreateCartItemOption) => {
  try {
    const cartItem = await CartItem.findUnique({
      where: { id: data.cartItemId },
      select: { id: true, cartId: true },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    const option = await Option.findUnique({
      where: { id: data.optionId },
      select: { id: true },
    });

    if (!option) {
      throw new Error('Option not found');
    }

    const cartItemOption = await CartItemOption.create({
      data: {
        ...data,
        priceDelta: new Prisma.Decimal(data.priceDelta || 0),
      },
      include: {
        cartItem: true,
        option: true,
      },
    });

    // Recalculate cart totals
    await recalculateCartTotals(cartItem.cartId);

    return cartItemOption;
  } catch (error) {
    console.error('Error creating cart item option:', error);
    throw error;
  }
};

/**
 * Get cart item option by ID
 */
export const getCartItemOptionById = async (id: string) => {
  try {
    const cartItemOption = await CartItemOption.findUnique({
      where: { id },
      include: {
        cartItem: true,
        option: true,
      },
    });

    return cartItemOption;
  } catch (error) {
    console.error('Error getting cart item option:', error);
    throw error;
  }
};

/**
 * Get cart item options with filtering and pagination
 */
export const getCartItemOptions = async (query: CartItemOptionQuery) => {
  try {
    const {
      cartItemId,
      optionId,
      page,
      limit,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CartItemOptionWhereInput = {};

    if (cartItemId) where.cartItemId = cartItemId;
    if (optionId) where.optionId = optionId;

    const [cartItemOptions, total] = await Promise.all([
      CartItemOption.findMany({
        where,
        include: {
          cartItem: true,
          option: true,
        },
        skip,
        take: limit,
      }),
      CartItemOption.count({ where }),
    ]);

    return {
      data: cartItemOptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting cart item options:', error);
    throw error;
  }
};

/**
 * Update cart item option
 */
export const updateCartItemOption = async (id: string, data: UpdateCartItemOption) => {
  try {
    const existing = await CartItemOption.findUnique({
      where: { id },
      include: {
        cartItem: { select: { cartId: true } },
      },
    });

    if (!existing) {
      throw new Error('Cart item option not found');
    }

    if (data.optionId) {
      const option = await Option.findUnique({
        where: { id: data.optionId },
        select: { id: true },
      });
      if (!option) {
        throw new Error('Option not found');
      }
    }

    const updateData: any = { ...data };
    if (data.priceDelta !== undefined) updateData.priceDelta = new Prisma.Decimal(data.priceDelta);

    const cartItemOption = await CartItemOption.update({
      where: { id },
      data: updateData,
      include: {
        cartItem: true,
        option: true,
      },
    });

    // Recalculate cart totals
    await recalculateCartTotals(existing.cartItem.cartId);

    return cartItemOption;
  } catch (error) {
    console.error('Error updating cart item option:', error);
    throw error;
  }
};

/**
 * Delete cart item option
 */
export const deleteCartItemOption = async (id: string) => {
  try {
    const existing = await CartItemOption.findUnique({
      where: { id },
      include: {
        cartItem: { select: { cartId: true } },
      },
    });

    if (!existing) {
      throw new Error('Cart item option not found');
    }

    await CartItemOption.delete({
      where: { id },
    });

    // Recalculate cart totals
    await recalculateCartTotals(existing.cartItem.cartId);

    return { message: 'Cart item option deleted successfully' };
  } catch (error) {
    console.error('Error deleting cart item option:', error);
    throw error;
  }
};
