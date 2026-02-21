import { Router } from 'express';
import {
  // Inventory Item controllers
  getAllInventoryItems,
  createInventoryItem,
  getInventoryItemById,
  getInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
  
  // Inventory Transaction controllers
  createInventoryTransaction,
  getInventoryTransactionById,
  getInventoryTransactions,
  updateInventoryTransaction,
  deleteInventoryTransaction,
  
  // Inventory Balance controllers
  createInventoryBalance,
  getInventoryBalanceById,
  getInventoryBalances,
  updateInventoryBalance,
  deleteInventoryBalance,
  
  // Bulk operation controllers
  bulkUpdateInventoryQuantities,
  
  // Special query controllers
  getInventoryLowStock,
  getInventoryExpiry,
  getInventoryValuation,
  getInventoryMovement,
} from '@/controllers/inventory';

const router = Router();

// =========================
// INVENTORY TRANSACTION ROUTES
// =========================

// Create inventory transaction
router.post('/transaction', createInventoryTransaction);

// Get all inventory transactions with filtering and pagination
router.get('/transaction', getInventoryTransactions);

// Get inventory transaction by ID
router.get('/transaction/:id', getInventoryTransactionById);

// Update inventory transaction
router.put('/transaction/:id', updateInventoryTransaction);

// Delete inventory transaction
router.delete('/transaction/:id', deleteInventoryTransaction);

// =========================
// INVENTORY BALANCE ROUTES
// =========================

// Create inventory balance
router.post('/balance', createInventoryBalance);

// Get all inventory balances with filtering and pagination
router.get('/balance', getInventoryBalances);

// Get inventory balance by ID
router.get('/balance/:id', getInventoryBalanceById);

// Update inventory balance
router.put('/balance/:id', updateInventoryBalance);

// Delete inventory balance
router.delete('/balance/:id', deleteInventoryBalance);

// =========================
// WAREHOUSE TRANSFER ITEM ROUTES
// =========================

// Create warehouse transfer item
// router.post('/warehouse/transfer/item', createWarehouseTransferItem);

// Update warehouse transfer item
// router.put('/warehouse/transfer/item/:id', updateWarehouseTransferItem);

// Delete warehouse transfer item
// router.delete('/warehouse/transfer/item/:id', deleteWarehouseTransferItem);

// =========================
// WAREHOUSE TRANSFER ROUTES
// =========================

// Create warehouse transfer
// router.post('/warehouse/transfer', createWarehouseTransfer);

// Get all warehouse transfers with filtering and pagination
// router.get('/warehouse/transfer', getWarehouseTransfers);

// Get warehouse transfer by ID
// router.get('/warehouse/transfer/:id', getWarehouseTransferById);

// Update warehouse transfer
// router.put('/warehouse/transfer/:id', updateWarehouseTransfer);

// Delete warehouse transfer
// router.delete('/warehouse/transfer/:id', deleteWarehouseTransfer);

// =========================
// WAREHOUSE RECEIPT ITEM ROUTES
// =========================

// Create warehouse receipt item
// router.post('/warehouse/receipt/item', createWarehouseReceiptItem);

// Update warehouse receipt item
// router.put('/warehouse/receipt/item/:id', updateWarehouseReceiptItem);

// Delete warehouse receipt item
// router.delete('/warehouse/receipt/item/:id', deleteWarehouseReceiptItem);

// =========================
// WAREHOUSE ISSUE ITEM ROUTES
// =========================

// Create warehouse issue item
// router.post('/warehouse/issue/item', createWarehouseIssueItem);

// Update warehouse issue item
// router.put('/warehouse/issue/item/:id', updateWarehouseIssueItem);

// Delete warehouse issue item
// router.delete('/warehouse/issue/item/:id', deleteWarehouseIssueItem);

// =========================
// WAREHOUSE ISSUE ROUTES
// =========================

// Create warehouse issue
// router.post('/warehouse/issue', createWarehouseIssue);

// Get all warehouse issues with filtering and pagination
// router.get('/warehouse/issue', getWarehouseIssues);

// Get warehouse issue by ID
// router.get('/warehouse/issue/:id', getWarehouseIssueById);

// Update warehouse issue
// router.put('/warehouse/issue/:id', updateWarehouseIssue);

// Delete warehouse issue
// router.delete('/warehouse/issue/:id', deleteWarehouseIssue);

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update inventory quantities
router.patch('/item/bulk-update-quantities', bulkUpdateInventoryQuantities);

// Bulk update warehouse status
// router.patch('/warehouse/bulk-update-status', bulkUpdateWarehouseStatus);

// =========================
// WAREHOUSE ROUTES
// =========================

// Create warehouse
// router.post('/warehouse', createWarehouse);

// Get all warehouses with filtering and pagination
// router.get('/warehouse', getWarehouses);

// Get warehouse by ID
// router.get('/warehouse/:id', getWarehouseById);

// Update warehouse
// router.put('/warehouse/:id', updateWarehouse);

// Delete warehouse
// router.delete('/warehouse/:id', deleteWarehouse);

// =========================
// SPECIAL QUERY ROUTES
// =========================

// Get inventory low stock items
router.get('/item/low-stock', getInventoryLowStock);

// Get inventory items expiring soon
router.get('/item/expiry', getInventoryExpiry);

// Get inventory valuation
router.get('/valuation', getInventoryValuation);

// Get inventory movement report
router.get('/movement', getInventoryMovement);

// =========================
// INVENTORY ITEM ROUTES
// =========================

// Create inventory item
router.post('/item', createInventoryItem);

// Get all inventory items with filtering and pagination
router.get('/item', getAllInventoryItems);
// router.get('/item', getInventoryItems);

// Get inventory item by ID
router.get('/item/:id', getInventoryItemById);

// Update inventory item
router.put('/item/:id', updateInventoryItem);

// Delete inventory item
router.delete('/item/:id', deleteInventoryItem);

export default router;
