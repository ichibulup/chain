import { Router } from 'express';
import {
  // Warehouse controllers
  createWarehouse,
  getWarehouseById,
  getWarehouses,
  updateWarehouse,
  deleteWarehouse,
  
  // Warehouse Transfer controllers
  createWarehouseTransfer,
  getWarehouseTransferById,
  getWarehouseTransfers,
  updateWarehouseTransfer,
  deleteWarehouseTransfer,
  
  // Warehouse Transfer Item controllers
  createWarehouseTransferItem,
  updateWarehouseTransferItem,
  deleteWarehouseTransferItem,
  
  // Warehouse Receipt Item controllers
  createWarehouseReceiptItem,
  updateWarehouseReceiptItem,
  deleteWarehouseReceiptItem,
  createWarehouseReceipt,
  getWarehouseReceiptById,
  getWarehouseReceipts,
  updateWarehouseReceipt,
  deleteWarehouseReceipt,
  
  // Warehouse Issue controllers
  createWarehouseIssue,
  getWarehouseIssueById,
  getWarehouseIssues,
  updateWarehouseIssue,
  deleteWarehouseIssue,
  
  // Warehouse Issue Item controllers
  createWarehouseIssueItem,
  updateWarehouseIssueItem,
  deleteWarehouseIssueItem,
  
  // Bulk operation controllers
  bulkUpdateWarehouseStatus,
} from '@/controllers/inventory';

const router = Router();

// =========================
// WAREHOUSE TRANSFER ITEM ROUTES
// =========================

// Create warehouse transfer item
router.post('/transfer/item', createWarehouseTransferItem);

// Update warehouse transfer item
router.put('/transfer/item/:id', updateWarehouseTransferItem);

// Delete warehouse transfer item
router.delete('/transfer/item/:id', deleteWarehouseTransferItem);

// =========================
// WAREHOUSE TRANSFER ROUTES
// =========================

// Create warehouse transfer
router.post('/transfer', createWarehouseTransfer);

// Get all warehouse transfers with filtering and pagination
router.get('/transfer', getWarehouseTransfers);

// Get warehouse transfer by ID
router.get('/transfer/:id', getWarehouseTransferById);

// Update warehouse transfer
router.put('/transfer/:id', updateWarehouseTransfer);

// Delete warehouse transfer
router.delete('/transfer/:id', deleteWarehouseTransfer);

// =========================
// WAREHOUSE RECEIPT ITEM ROUTES
// =========================

// Create warehouse receipt item
router.post('/receipt/item', createWarehouseReceiptItem);

// Update warehouse receipt item
router.put('/receipt/item/:id', updateWarehouseReceiptItem);

// Delete warehouse receipt item
router.delete('/receipt/item/:id', deleteWarehouseReceiptItem);

// =========================
// WAREHOUSE RECEIPT ROUTES
// =========================

// Create warehouse receipt
router.post('/receipt', createWarehouseReceipt);

// Get all warehouse receipts with filtering and pagination
router.get('/receipt', getWarehouseReceipts);

// Get warehouse receipt by ID
router.get('/receipt/:id', getWarehouseReceiptById);

// Update warehouse receipt
router.put('/receipt/:id', updateWarehouseReceipt);

// Delete warehouse receipt
router.delete('/receipt/:id', deleteWarehouseReceipt);

// =========================
// WAREHOUSE ISSUE ITEM ROUTES
// =========================

// Create warehouse issue item
router.post('/issue/item', createWarehouseIssueItem);

// Update warehouse issue item
router.put('/issue/item/:id', updateWarehouseIssueItem);

// Delete warehouse issue item
router.delete('/issue/item/:id', deleteWarehouseIssueItem);

// =========================
// WAREHOUSE ISSUE ROUTES
// =========================

// Create warehouse issue
router.post('/issue', createWarehouseIssue);

// Get all warehouse issues with filtering and pagination
router.get('/issue', getWarehouseIssues);

// Get warehouse issue by ID
router.get('/issue/:id', getWarehouseIssueById);

// Update warehouse issue
router.put('/issue/:id', updateWarehouseIssue);

// Delete warehouse issue
router.delete('/issue/:id', deleteWarehouseIssue);

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update warehouse status
router.patch('/bulk-update-status', bulkUpdateWarehouseStatus);

// =========================
// WAREHOUSE ROUTES
// =========================

// Create warehouse
router.post('/', createWarehouse);

// Get all warehouses with filtering and pagination
router.get('/', getWarehouses);

// Get warehouse by ID
router.get('/:id', getWarehouseById);

// Update warehouse
router.put('/:id', updateWarehouse);

// Delete warehouse
router.delete('/:id', deleteWarehouse);

export default router;
