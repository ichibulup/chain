import { Router } from 'express';
import {
  // Supplier controllers
  createSupplierController,
  registerSupplierController,
  getSupplierByIdController,
  getSuppliersController,
  updateSupplierController,
  deleteSupplierController,
  
  // Supplier Item controllers
  createSupplierItemController,
  getSupplierItemByIdController,
  getSupplierItemsController,
  updateSupplierItemController,
  deleteSupplierItemController,
  
  // Bulk operation controllers
  bulkUpdateSupplierStatusController,
  bulkUpdateSupplierItemPricesController,
  
  // Special query controllers
  getPurchaseOrderSummaryController,
  getPurchaseOrderAnalyticsController,
  getSupplierPerformanceController,
  getSupplierComparisonController,

  // Purchase order controllers
  createPurchaseOrderController,
  getPurchaseOrderByIdController,
  getPurchaseOrdersController,
  updatePurchaseOrderController,
  deletePurchaseOrderController,

  // Purchase order item controllers
  createPurchaseOrderItemController,
  getPurchaseOrderItemByIdController,
  getPurchaseOrderItemsController,
  updatePurchaseOrderItemController,
  deletePurchaseOrderItemController,

  // Bulk operation controllers
  bulkUpdatePurchaseOrderStatusController,

  // Workflow controllers
  sendPurchaseOrderController,
  confirmPurchaseOrderController,
  receivePurchaseOrderController,
  cancelPurchaseOrderController,
} from '@/controllers/supply';
import { requireAuth } from '@/middlewares/auth';

const router = Router();

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update supplier status
router.patch('/bulk-update-status', bulkUpdateSupplierStatusController);

// Bulk update supplier item prices
router.patch('/item/bulk-update-prices', bulkUpdateSupplierItemPricesController);

// Bulk update purchase order status
router.patch('/order/bulk-update-status', bulkUpdatePurchaseOrderStatusController);

// =========================
// SPECIAL QUERY ROUTES
// =========================

// Get supplier performance metrics
router.get('/performance', getSupplierPerformanceController);

// Get supplier comparison for specific inventory item
router.get('/comparison', getSupplierComparisonController);

// Get purchase order summary
router.get('/order/summary', getPurchaseOrderSummaryController);

// Get purchase order analytics
router.get('/order/analytics', getPurchaseOrderAnalyticsController);

// Send purchase order to supplier
router.post('/order/send', sendPurchaseOrderController);

// Confirm purchase order by supplier
router.post('/order/confirm', confirmPurchaseOrderController);

// Receive purchase order at warehouse
router.post('/order/receive', receivePurchaseOrderController);

// Cancel purchase order
router.post('/order/cancel', cancelPurchaseOrderController);

// Create purchase order item
router.post('/order/item', requireAuth(), createPurchaseOrderItemController);

// Get all purchase order items
router.get('/order/item', requireAuth(), getPurchaseOrderItemsController);

// Get purchase order item by ID
router.get('/order/item/:id', requireAuth(), getPurchaseOrderItemByIdController);

// Update purchase order item
router.put('/order/item/:id', requireAuth(), updatePurchaseOrderItemController);

// Delete purchase order item
router.delete('/order/item/:id', requireAuth(), deletePurchaseOrderItemController);

// Create purchase order
router.post('/order', requireAuth(), createPurchaseOrderController);

// Get all purchase orders
router.get('/order', requireAuth(), getPurchaseOrdersController);

// Get purchase order by ID
router.get('/order/:id', requireAuth(), getPurchaseOrderByIdController);

// Update purchase order
router.put('/order/:id', requireAuth(), updatePurchaseOrderController);

// Delete purchase order
router.delete('/order/:id', requireAuth(), deletePurchaseOrderController);

// =========================
// SUPPLIER ITEM ROUTES
// =========================

// Create supplier item
router.post('/item', requireAuth(), createSupplierItemController);

// Get all supplier items with filtering and pagination
router.get('/item', requireAuth(), getSupplierItemsController);

// Get supplier item by ID
router.get('/item/:id', requireAuth(), getSupplierItemByIdController);

// Update supplier item
router.put('/item/:id', requireAuth(), updateSupplierItemController);

// Delete supplier item
router.delete('/item/:id', requireAuth(), deleteSupplierItemController);

// =========================
// SUPPLIER ROUTES
// =========================

// Register supplier (self-registration)
router.post('/register', registerSupplierController);

// Create supplier
router.post('/', createSupplierController);

// Get all suppliers with filtering and pagination
router.get('/', getSuppliersController);

// Get supplier by ID
router.get('/:id', getSupplierByIdController);

// Update supplier
router.put('/:id', updateSupplierController);

// Delete supplier
router.delete('/:id', deleteSupplierController);

export default router;
