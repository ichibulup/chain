import { Router } from 'express';
import {
  // Retail Product Controllers
  createRetailProduct,
  getRetailProductById,
  getRetailProducts,
  updateRetailProduct,
  deleteRetailProduct,
  // Cart Controllers
  createCart,
  getCartById,
  getCarts,
  updateCart,
  deleteCart,
  clearCart,
  // Cart Item Controllers
  createCartItem,
  getCartItemById,
  getCartItems,
  updateCartItem,
  deleteCartItem,
  addToCart,
  // Cart Item Option Controllers
  createCartItemOption,
  getCartItemOptionById,
  getCartItemOptions,
  updateCartItemOption,
  deleteCartItemOption,
} from '@/controllers/marketplace';

const router = Router();

// =========================
// RETAIL PRODUCT ROUTES
// =========================

/**
 * @route   GET /api/marketplace/retail-products
 * @desc    Get all retail products with filtering and pagination
 * @access  Public
 */
router.get('/product/retail', getRetailProducts);

/**
 * @route   GET /api/marketplace/retail-products/:id
 * @desc    Get retail product by ID
 * @access  Public
 */
router.get('/product/retail/:id', getRetailProductById);

/**
 * @route   POST /api/marketplace/retail-products
 * @desc    Create new retail product
 * @access  Private/Admin
 */
router.post('/product/retail', createRetailProduct);

/**
 * @route   PUT /api/marketplace/retail-products/:id
 * @desc    Update retail product by ID
 * @access  Private/Admin
 */
router.put('/product/retail/:id', updateRetailProduct);

/**
 * @route   DELETE /api/marketplace/retail-products/:id
 * @desc    Delete retail product by ID
 * @access  Private/Admin
 */
router.delete('/product/retail/:id', deleteRetailProduct);

// =========================
// CART ITEM OPTION ROUTES
// =========================

/**
 * @route   GET /api/marketplace/cart-item-options
 * @desc    Get all cart item options with filtering and pagination
 * @access  Private
 */
router.get('/cart/item/option', getCartItemOptions);

/**
 * @route   GET /api/marketplace/cart-item-options/:id
 * @desc    Get cart item option by ID
 * @access  Private
 */
router.get('/cart/item/option/:id', getCartItemOptionById);

/**
 * @route   POST /api/marketplace/cart-item-options
 * @desc    Create new cart item option
 * @access  Private
 */
router.post('/cart/item/option', createCartItemOption);

/**
 * @route   PUT /api/marketplace/cart-item-options/:id
 * @desc    Update cart item option by ID
 * @access  Private
 */
router.put('/cart/item/option/:id', updateCartItemOption);

/**
 * @route   DELETE /api/marketplace/cart-item-options/:id
 * @desc    Delete cart item option by ID
 * @access  Private
 */
router.delete('/cart/item/option/:id', deleteCartItemOption);

// =========================
// CART ITEM ROUTES
// =========================

/**
 * @route   GET /api/marketplace/cart-items
 * @desc    Get all cart items with filtering and pagination
 * @access  Private
 */
router.get('/cart/item', getCartItems);

/**
 * @route   GET /api/marketplace/cart-items/:id
 * @desc    Get cart item by ID
 * @access  Private
 */
router.get('/cart/item/:id', getCartItemById);

/**
 * @route   POST /api/marketplace/cart-items
 * @desc    Create new cart item
 * @access  Private
 */
router.post('/cart/item', createCartItem);

/**
 * @route   POST /api/marketplace/cart-items/add
 * @desc    Add item to cart with duplicate detection
 * @access  Private
 */
router.post('/cart/item/add', addToCart);

/**
 * @route   PUT /api/marketplace/cart-items/:id
 * @desc    Update cart item by ID
 * @access  Private
 */
router.put('/cart/item/:id', updateCartItem);

/**
 * @route   DELETE /api/marketplace/cart-items/:id
 * @desc    Delete cart item by ID
 * @access  Private
 */
router.delete('/cart/item/:id', deleteCartItem);

// =========================
// CART ROUTES
// =========================

/**
 * @route   GET /api/marketplace/carts
 * @desc    Get all carts with filtering and pagination
 * @access  Private
 */
router.get('/cart', getCarts);

/**
 * @route   GET /api/marketplace/carts/:id
 * @desc    Get cart by ID with items
 * @access  Private
 */
router.get('/cart/:id', getCartById);

/**
 * @route   POST /api/marketplace/carts
 * @desc    Create new cart
 * @access  Private
 */
router.post('/cart', createCart);

/**
 * @route   PUT /api/marketplace/carts/:id
 * @desc    Update cart by ID
 * @access  Private
 */
router.put('/cart/:id', updateCart);

/**
 * @route   DELETE /api/marketplace/carts/:id
 * @desc    Delete cart by ID
 * @access  Private
 */
router.delete('/cart/:id', deleteCart);

/**
 * @route   DELETE /api/marketplace/carts/:id/clear
 * @desc    Clear all items from cart
 * @access  Private
 */
router.delete('/cart/:id/clear', clearCart);

export default router;
