import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import * as marketplaceService from '@/services/marketplace';
import {
  CreateRetailProductSchema,
  UpdateRetailProductSchema,
  RetailProductQuerySchema,
  CreateCartSchema,
  UpdateCartSchema,
  CartQuerySchema,
  CreateCartItemSchema,
  UpdateCartItemSchema,
  CartItemQuerySchema,
  CreateCartItemOptionSchema,
  UpdateCartItemOptionSchema,
  CartItemOptionQuerySchema,
} from '@/schemas/marketplace';
import { checkOrganizationExists, checkUserExists } from "@/services/helper";

// ============================================================================
// RETAIL PRODUCT CONTROLLERS
// ============================================================================

/**
 * Create new retail product
 * @route POST /api/marketplace/retail-products
 */
export const createRetailProduct = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = CreateRetailProductSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const product = await marketplaceService.createRetailProduct(validation.data);

    res.status(201).json({
      success: true,
      message: 'Retail product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error in createRetailProduct controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create retail product',
    });
  }
};

/**
 * Get retail product by ID
 * @route GET /api/marketplace/retail-products/:id
 */
export const getRetailProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid retail product ID format',
      });
    }

    const product = await marketplaceService.getRetailProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Retail product not found',
      });
    }

    res.json({
      success: true,
      message: 'Retail product retrieved successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error in getRetailProductById controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get retail product',
    });
  }
};

/**
 * Get retail products with filtering and pagination
 * @route GET /api/marketplace/retail-products
 */
export const getRetailProducts = async (req: Request, res: Response) => {
  try {
    const validation = RetailProductQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.issues,
      });
    }

    const result = await marketplaceService.getRetailProducts(validation.data);

    res.json({
      success: true,
      message: 'Retail products retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error in getRetailProducts controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get retail products',
    });
  }
};

/**
 * Update retail product
 * @route PUT /api/marketplace/retail-products/:id
 */
export const updateRetailProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid retail product ID format',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = UpdateRetailProductSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const product = await marketplaceService.updateRetailProduct(id, validation.data);

    res.json({
      success: true,
      message: 'Retail product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error in updateRetailProduct controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update retail product',
    });
  }
};

/**
 * Delete retail product
 * @route DELETE /api/marketplace/retail-products/:id
 */
export const deleteRetailProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid retail product ID format',
      });
    }

    await marketplaceService.deleteRetailProduct(id);

    res.json({
      success: true,
      message: 'Retail product deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteRetailProduct controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete retail product',
    });
  }
};

// ============================================================================
// CART CONTROLLERS
// ============================================================================

/**
 * Create new cart
 * @route POST /api/marketplace/carts
 */
export const createCart = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = CreateCartSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const validatedData = validation.data

    const userExists = await checkUserExists(validatedData.userId);

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const cart = await marketplaceService.createCart(validation.data);

    res.status(201).json({
      success: true,
      message: 'Cart created successfully',
      data: cart,
    });
  } catch (error) {
    console.error('Error in createCart controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create cart',
    });
  }
};

/**
 * Get cart by ID
 * @route GET /api/marketplace/carts/:id
 */
export const getCartById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart ID format',
      });
    }

    const cart = await marketplaceService.getCartById(id);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    res.json({
      success: true,
      message: 'Cart retrieved successfully',
      data: cart,
    });
  } catch (error) {
    console.error('Error in getCartById controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get cart',
    });
  }
};

/**
 * Get carts with filtering and pagination
 * @route GET /api/marketplace/carts
 */
export const getCarts = async (req: Request, res: Response) => {
  try {
    const validation = CartQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.issues,
      });
    }

    const result = await marketplaceService.getCarts(validation.data);

    res.json({
      success: true,
      message: 'Carts retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error in getCarts controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get carts',
    });
  }
};

/**
 * Update cart
 * @route PUT /api/marketplace/carts/:id
 */
export const updateCart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart ID format',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = UpdateCartSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const cart = await marketplaceService.updateCart(id, validation.data);

    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: cart,
    });
  } catch (error) {
    console.error('Error in updateCart controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update cart',
    });
  }
};

/**
 * Delete cart
 * @route DELETE /api/marketplace/carts/:id
 */
export const deleteCart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart ID format',
      });
    }

    await marketplaceService.deleteCart(id);

    res.json({
      success: true,
      message: 'Cart deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteCart controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete cart',
    });
  }
};

/**
 * Clear cart (remove all items)
 * @route DELETE /api/marketplace/carts/:id/clear
 */
export const clearCart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart ID format',
      });
    }

    await marketplaceService.clearCart(id);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Error in clearCart controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear cart',
    });
  }
};

// ============================================================================
// CART ITEM CONTROLLERS
// ============================================================================

/**
 * Create cart item
 * @route POST /api/marketplace/cart-items
 */
export const createCartItem = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = CreateCartItemSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const cartItem = await marketplaceService.createCartItem(validation.data);

    res.status(201).json({
      success: true,
      message: 'Cart item created successfully',
      data: cartItem,
    });
  } catch (error) {
    console.error('Error in createCartItem controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create cart item',
    });
  }
};

/**
 * Get cart item by ID
 * @route GET /api/marketplace/cart-items/:id
 */
export const getCartItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID format',
      });
    }

    const cartItem = await marketplaceService.getCartItemById(id);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    res.json({
      success: true,
      message: 'Cart item retrieved successfully',
      data: cartItem,
    });
  } catch (error) {
    console.error('Error in getCartItemById controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get cart item',
    });
  }
};

/**
 * Get cart items with filtering and pagination
 * @route GET /api/marketplace/cart-items
 */
export const getCartItems = async (req: Request, res: Response) => {
  try {
    const validation = CartItemQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.issues,
      });
    }

    const result = await marketplaceService.getCartItems(validation.data);

    res.json({
      success: true,
      message: 'Cart items retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error in getCartItems controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get cart items',
    });
  }
};

/**
 * Update cart item
 * @route PUT /api/marketplace/cart-items/:id
 */
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID format',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = UpdateCartItemSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const cartItem = await marketplaceService.updateCartItem(id, validation.data);

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cartItem,
    });
  } catch (error) {
    console.error('Error in updateCartItem controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update cart item',
    });
  }
};

/**
 * Delete cart item
 * @route DELETE /api/marketplace/cart-items/:id
 */
export const deleteCartItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID format',
      });
    }

    await marketplaceService.deleteCartItem(id);

    res.json({
      success: true,
      message: 'Cart item deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteCartItem controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete cart item',
    });
  }
};

/**
 * Add item to cart (with duplicate detection)
 * Auto-creates cart if it doesn't exist
 * @route POST /api/marketplace/cart-items/add
 */
export const addToCart = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = CreateCartItemSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    // Extract userId from request (from auth middleware or body)
    const userId = (req as any).user?.id || req.body.userId;
    const restaurantId = req.body.restaurantId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required to add items to cart',
      });
    }

    const cartItem = await marketplaceService.addToCart(validation.data, userId, restaurantId);

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartItem,
    });
  } catch (error) {
    console.error('Error in addToCart controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add item to cart',
    });
  }
};

// ============================================================================
// CART ITEM OPTION CONTROLLERS
// ============================================================================

/**
 * Create cart item option
 * @route POST /api/marketplace/cart-item-options
 */
export const createCartItemOption = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = CreateCartItemOptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const cartItemOption = await marketplaceService.createCartItemOption(validation.data);

    res.status(201).json({
      success: true,
      message: 'Cart item option created successfully',
      data: cartItemOption,
    });
  } catch (error) {
    console.error('Error in createCartItemOption controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create cart item option',
    });
  }
};

/**
 * Get cart item option by ID
 * @route GET /api/marketplace/cart-item-options/:id
 */
export const getCartItemOptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item option ID format',
      });
    }

    const cartItemOption = await marketplaceService.getCartItemOptionById(id);

    if (!cartItemOption) {
      return res.status(404).json({
        success: false,
        message: 'Cart item option not found',
      });
    }

    res.json({
      success: true,
      message: 'Cart item option retrieved successfully',
      data: cartItemOption,
    });
  } catch (error) {
    console.error('Error in getCartItemOptionById controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get cart item option',
    });
  }
};

/**
 * Get cart item options with filtering and pagination
 * @route GET /api/marketplace/cart-item-options
 */
export const getCartItemOptions = async (req: Request, res: Response) => {
  try {
    const validation = CartItemOptionQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.issues,
      });
    }

    const result = await marketplaceService.getCartItemOptions(validation.data);

    res.json({
      success: true,
      message: 'Cart item options retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error in getCartItemOptions controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get cart item options',
    });
  }
};

/**
 * Update cart item option
 * @route PUT /api/marketplace/cart-item-options/:id
 */
export const updateCartItemOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item option ID format',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const validation = UpdateCartItemOptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const cartItemOption = await marketplaceService.updateCartItemOption(id, validation.data);

    res.json({
      success: true,
      message: 'Cart item option updated successfully',
      data: cartItemOption,
    });
  } catch (error) {
    console.error('Error in updateCartItemOption controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update cart item option',
    });
  }
};

/**
 * Delete cart item option
 * @route DELETE /api/marketplace/cart-item-options/:id
 */
export const deleteCartItemOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item option ID format',
      });
    }

    await marketplaceService.deleteCartItemOption(id);

    res.json({
      success: true,
      message: 'Cart item option deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteCartItemOption controller:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete cart item option',
    });
  }
};
