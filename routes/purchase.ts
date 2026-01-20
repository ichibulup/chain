import { Router } from 'express';
import {
  // Purchase Order controllers
  createPurchaseOrderController,
  getPurchaseOrderByIdController,
  getPurchaseOrdersController,
  updatePurchaseOrderController,
  deletePurchaseOrderController,
  
  // Purchase Order Item controllers
  createPurchaseOrderItemController,
  getPurchaseOrderItemByIdController,
  getPurchaseOrderItemsController,
  updatePurchaseOrderItemController,
  deletePurchaseOrderItemController,
  
  // Bulk operation controllers
  bulkUpdatePurchaseOrderStatusController,
  
  // Special query controllers
  getPurchaseOrderSummaryController,
  getPurchaseOrderAnalyticsController,
  
  // Workflow controllers
  sendPurchaseOrderController,
  confirmPurchaseOrderController,
  receivePurchaseOrderController,
  cancelPurchaseOrderController,
} from '@/controllers/supply';

const router = Router();

// =========================
// PURCHASE ORDER ITEM ROUTES
// =========================

// Create purchase order item
router.post('/order/item', createPurchaseOrderItemController);

// Get all purchase order items with filtering and pagination
router.get('/order/item', getPurchaseOrderItemsController);

// Get purchase order item by ID
router.get('/order/item/:id', getPurchaseOrderItemByIdController);

// Update purchase order item
router.put('/order/item/:id', updatePurchaseOrderItemController);

// Delete purchase order item
router.delete('/order/item/:id', deletePurchaseOrderItemController);

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update purchase order status
router.patch('/order/bulk-update-status', bulkUpdatePurchaseOrderStatusController);

// =========================
// SPECIAL QUERY ROUTES
// =========================

// Get purchase order summary
router.get('/order/summary', getPurchaseOrderSummaryController);

// Get purchase order analytics
router.get('/order/analytics', getPurchaseOrderAnalyticsController);

// =========================
// WORKFLOW ROUTES
// =========================

// Send purchase order to supplier
router.post('/order/send', sendPurchaseOrderController);

// Confirm purchase order with supplier
router.post('/order/confirm', confirmPurchaseOrderController);

// Receive purchase order items
router.post('/order/receive', receivePurchaseOrderController);

// Cancel purchase order
router.post('/order/cancel', cancelPurchaseOrderController);

// =========================
// PURCHASE ORDER ROUTES
// =========================

// Create purchase order
router.post('/order', createPurchaseOrderController);

// Get all purchase orders with filtering and pagination
router.get('/order', getPurchaseOrdersController);

// Get purchase order by ID
router.get('/order/:id', getPurchaseOrderByIdController);

// Update purchase order
router.put('/order/:id', updatePurchaseOrderController);

// Delete purchase order
router.delete('/order/:id', deletePurchaseOrderController);

export default router;
