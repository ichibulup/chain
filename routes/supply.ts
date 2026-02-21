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
  getSupplierPerformanceController,
  getSupplierComparisonController,
} from '@/controllers/supply';

const router = Router();

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update supplier status
router.patch('/bulk-update-status', bulkUpdateSupplierStatusController);

// Bulk update supplier item prices
router.patch('/item/bulk-update-prices', bulkUpdateSupplierItemPricesController);

// =========================
// SPECIAL QUERY ROUTES
// =========================

// Get supplier performance metrics
router.get('/performance', getSupplierPerformanceController);

// Get supplier comparison for specific inventory item
router.get('/comparison', getSupplierComparisonController);

// =========================
// SUPPLIER ITEM ROUTES
// =========================

// Create supplier item
router.post('/item', createSupplierItemController);

// Get all supplier items with filtering and pagination
router.get('/item', getSupplierItemsController);

// Get supplier item by ID
router.get('/item/:id', getSupplierItemByIdController);

// Update supplier item
router.put('/item/:id', updateSupplierItemController);

// Delete supplier item
router.delete('/item/:id', deleteSupplierItemController);

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
