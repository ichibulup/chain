import { Router } from 'express';
import {
  // Order controllers
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
  deleteOrder,
  
  // Order item controllers
  createOrderItem,
  getOrderItemById,
  getOrderItems,
  updateOrderItem,
  deleteOrderItem,
  
  // Order item option controllers
  createOrderItemOption,
  updateOrderItemOption,
  deleteOrderItemOption,
  
  // Order status history controllers
  createOrderStatusHistory,
  getOrderStatusHistory,
  
  // Bulk operation controllers
  bulkUpdateOrderStatus,
  bulkUpdateOrderItemCookingStatus,
  bulkUpdatePaymentStatus,
  
  // Special query controllers
  getOrderStatistics,
  getPaymentSummary,
  getOrderRevenue,
} from '@/controllers/order';

const router = Router();

// =========================
// ORDER ITEM OPTION ROUTES
// =========================

// Create a new order item option
router.post('/item/option', createOrderItemOption);

// Update order item option
router.put('/item/option/:id', updateOrderItemOption);

// Delete order item option
router.delete('/item/option/:id', deleteOrderItemOption);

// =========================
// ORDER STATUS HISTORY ROUTES
// =========================

// Create a new order status history
router.post('/status-history', createOrderStatusHistory);

// Get all order status history with filtering and pagination
router.get('/status-history', getOrderStatusHistory);

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update order status
router.patch('/bulk-update-status', bulkUpdateOrderStatus);

// Bulk update order item cooking status
router.patch('/item/bulk-update-cooking-status', bulkUpdateOrderItemCookingStatus);

// Bulk update payment status
router.patch('/payments/bulk-update-status', bulkUpdatePaymentStatus);

// =========================
// SPECIAL QUERY ROUTES
// =========================

// Get order statistics
router.get('/statistics', getOrderStatistics);

// Get payment summary
// router.get('/payments/summary', getPaymentSummary);

// Get order revenue
router.get('/revenue', getOrderRevenue);

// =========================
// ORDER ITEM ROUTES
// =========================

// Create a new order item
router.post('/item', createOrderItem);

// Get all order items with filtering and pagination
router.get('/item', getOrderItems);

// Get order item by ID
router.get('/item/:id', getOrderItemById);

// Update order item
router.put('/item/:id', updateOrderItem);

// Delete order item
router.delete('/item/:id', deleteOrderItem);

// =========================
// ORDER ROUTES
// =========================

// Create a new order
router.post('/', createOrder);

// Get all orders with filtering and pagination
router.get('/', getOrders);

// Get order by ID
router.get('/:id', getOrderById);

// Update order
router.put('/:id', updateOrder);

// Delete order
router.delete('/:id', deleteOrder);

// =========================

export default router;
