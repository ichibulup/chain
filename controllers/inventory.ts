import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import {
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
  WarehouseQuerySchema,
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  InventoryItemQuerySchema,
  CreateInventoryTransactionSchema,
  UpdateInventoryTransactionSchema,
  InventoryTransactionQuerySchema,
  CreateInventoryBalanceSchema,
  UpdateInventoryBalanceSchema,
  InventoryBalanceQuerySchema,
  CreateWarehouseTransferSchema,
  UpdateWarehouseTransferSchema,
  WarehouseTransferQuerySchema,
  CreateWarehouseTransferItemSchema,
  UpdateWarehouseTransferItemSchema,
  CreateWarehouseReceiptSchema,
  UpdateWarehouseReceiptSchema,
  WarehouseReceiptQuerySchema,
  CreateWarehouseReceiptItemSchema,
  UpdateWarehouseReceiptItemSchema,
  CreateWarehouseIssueSchema,
  UpdateWarehouseIssueSchema,
  WarehouseIssueQuerySchema,
  CreateWarehouseIssueItemSchema,
  UpdateWarehouseIssueItemSchema,
  BulkUpdateInventoryQuantitiesSchema,
  BulkUpdateWarehouseStatusSchema,
  InventoryLowStockQuerySchema,
  InventoryExpiryQuerySchema,
  InventoryValuationQuerySchema,
  InventoryMovementQuerySchema,
} from '@/schemas/inventory';
import {
  createWarehouse as createWarehouseService,
  getWarehouseById as getWarehouseByIdService,
  getWarehouses as getWarehousesService,
  updateWarehouse as updateWarehouseService,
  deleteWarehouse as deleteWarehouseService,

  getAllInventoryItems as getAllInventoryItemsService,
  createInventoryItem as createInventoryItemService,
  getInventoryItemById as getInventoryItemByIdService,
  getInventoryItems as getInventoryItemsService,
  updateInventoryItem as updateInventoryItemService,
  deleteInventoryItem as deleteInventoryItemService,

  createInventoryTransaction as createInventoryTransactionService,
  getInventoryTransactionById as getInventoryTransactionByIdService,
  getInventoryTransactions as getInventoryTransactionsService,
  updateInventoryTransaction as updateInventoryTransactionService,
  deleteInventoryTransaction as deleteInventoryTransactionService,

  createInventoryBalance as createInventoryBalanceService,
  getInventoryBalanceById as getInventoryBalanceByIdService,
  getInventoryBalances as getInventoryBalancesService,
  updateInventoryBalance as updateInventoryBalanceService,
  deleteInventoryBalance as deleteInventoryBalanceService,

  createWarehouseTransfer as createWarehouseTransferService,
  getWarehouseTransferById as getWarehouseTransferByIdService,
  getWarehouseTransfers as getWarehouseTransfersService,
  updateWarehouseTransfer as updateWarehouseTransferService,
  deleteWarehouseTransfer as deleteWarehouseTransferService,

  createWarehouseTransferItem as createWarehouseTransferItemService,
  updateWarehouseTransferItem as updateWarehouseTransferItemService,
  deleteWarehouseTransferItem as deleteWarehouseTransferItemService,

  createWarehouseReceipt as createWarehouseReceiptService,
  getWarehouseReceiptById as getWarehouseReceiptByIdService,
  getWarehouseReceipts as getWarehouseReceiptsService,
  updateWarehouseReceipt as updateWarehouseReceiptService,
  deleteWarehouseReceipt as deleteWarehouseReceiptService,

  createWarehouseReceiptItem as createWarehouseReceiptItemService,
  updateWarehouseReceiptItem as updateWarehouseReceiptItemService,
  deleteWarehouseReceiptItem as deleteWarehouseReceiptItemService,

  createWarehouseIssue as createWarehouseIssueService,
  getWarehouseIssueById as getWarehouseIssueByIdService,
  getWarehouseIssues as getWarehouseIssuesService,
  updateWarehouseIssue as updateWarehouseIssueService,
  deleteWarehouseIssue as deleteWarehouseIssueService,

  createWarehouseIssueItem as createWarehouseIssueItemService,
  updateWarehouseIssueItem as updateWarehouseIssueItemService,
  deleteWarehouseIssueItem as deleteWarehouseIssueItemService,

  bulkUpdateInventoryQuantities as bulkUpdateInventoryQuantitiesService,
  bulkUpdateWarehouseStatus as bulkUpdateWarehouseStatusService,
  getInventoryLowStock as getInventoryLowStockService,
  getInventoryExpiry as getInventoryExpiryService,
  getInventoryValuation as getInventoryValuationService,
  getInventoryMovement as getInventoryMovementService,
} from '@/services/inventory';
import {
  checkOrganizationExists,
  checkRestaurantExists,
  checkWarehouseExists,
  checkUserExists,
  checkSupplierExists,
  checkInventoryItemExists,
} from '@/services/helper'
import { getUserIdFromRequest } from '@/lib/utils/auth';

// =========================
// WAREHOUSE CONTROLLERS
// =========================

/**
 * Create a new warehouse
 */
export const createWarehouse = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateWarehouseSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    // Check if restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const warehouse = await createWarehouseService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse,
    });
  } catch (error: any) {
    console.error('Error in createWarehouseController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create warehouse',
    });
  }
};

/**
 * Get warehouse by ID
 */
export const getWarehouseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    const warehouse = await getWarehouseByIdService(id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error: any) {
    console.error('Error in getWarehouseByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get warehouse',
    });
  }
};

/**
 * Get all warehouses with filtering and pagination
 */
export const getWarehouses = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = WarehouseQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.restaurantId && !validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    const result = await getWarehousesService(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in getWarehousesController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get warehouses',
    });
  }
};

/**
 * Update warehouse
 */
export const updateWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateWarehouseSchema.parse(req.body);

    // Check if warehouse exists
    const warehouseExists = await checkWarehouseExists(id);
    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    const warehouse = await updateWarehouseService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse,
    });
  } catch (error: any) {
    console.error('Error in updateWarehouseController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update warehouse',
    });
  }
};

/**
 * Delete warehouse
 */
export const deleteWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    // Check if warehouse exists
    const warehouseExists = await checkWarehouseExists(id);
    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    const result = await deleteWarehouseService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteWarehouseController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete warehouse',
    });
  }
};

// =========================
// INVENTORY ITEM CONTROLLERS
// =========================

export async function getAllInventoryItems(
  req: Request,
  res: Response,
) {
  try {
    // Validate query parameters
    const inventoryItems = await getAllInventoryItemsService();

    res.status(200).json({
      success: true,
      message: 'Inventory Items retrieved successfully',
      data: inventoryItems.data,
      total: inventoryItems.total
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get Inventory Items';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateInventoryItemSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
      });
    }

    // Check if organization exists
    const organizationExists = await checkOrganizationExists(validatedData.organizationId);
    if (!organizationExists) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const inventoryItem = await createInventoryItemService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventoryItem,
    });
  } catch (error: any) {
    console.error('Error in createInventoryItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create inventory item',
    });
  }
};

/**
 * Get inventory item by ID
 */
export const getInventoryItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    const inventoryItem = await getInventoryItemByIdService(id);

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: inventoryItem,
    });
  } catch (error: any) {
    console.error('Error in getInventoryItemByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get inventory item',
    });
  }
};

/**
 * Get all inventory items with filtering and pagination
 */
export const getInventoryItems = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = InventoryItemQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.organizationId && !validate(query.organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
      });
    }

    const result = await getInventoryItemsService(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in getInventoryItemsController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get inventory items',
    });
  }
};

/**
 * Update inventory item
 */
export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateInventoryItemSchema.parse(req.body);

    // Check if inventory item exists
    const itemExists = await checkInventoryItemExists(id);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const inventoryItem = await updateInventoryItemService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: inventoryItem,
    });
  } catch (error: any) {
    console.error('Error in updateInventoryItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update inventory item',
    });
  }
};

/**
 * Delete inventory item
 */
export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    // Check if inventory item exists
    const itemExists = await checkInventoryItemExists(id);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const result = await deleteInventoryItemService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteInventoryItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete inventory item',
    });
  }
};

// =========================
// INVENTORY TRANSACTION CONTROLLERS
// =========================

/**
 * Create a new inventory transaction
 */
export const createInventoryTransaction = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateInventoryTransactionSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (!validate(validatedData.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    // Check if restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Check if inventory item exists
    const itemExists = await checkInventoryItemExists(validatedData.inventoryItemId);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const inventoryTransaction = await createInventoryTransactionService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Inventory transaction created successfully',
      data: inventoryTransaction,
    });
  } catch (error: any) {
    console.error('Error in createInventoryTransactionController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create inventory transaction',
    });
  }
};

/**
 * Get inventory transaction by ID
 */
export const getInventoryTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory transaction ID format',
      });
    }

    const inventoryTransaction = await getInventoryTransactionByIdService(id);

    if (!inventoryTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Inventory transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: inventoryTransaction,
    });
  } catch (error: any) {
    console.error('Error in getInventoryTransactionByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get inventory transaction',
    });
  }
};

/**
 * Get all inventory transactions with filtering and pagination
 */
export const getInventoryTransactions = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = InventoryTransactionQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.restaurantId && !validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.inventoryItemId && !validate(query.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    const result = await getInventoryTransactionsService(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in getInventoryTransactionsController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get inventory transactions',
    });
  }
};

/**
 * Update inventory transaction
 */
export const updateInventoryTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory transaction ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateInventoryTransactionSchema.parse(req.body);

    const inventoryTransaction = await updateInventoryTransactionService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Inventory transaction updated successfully',
      data: inventoryTransaction,
    });
  } catch (error: any) {
    console.error('Error in updateInventoryTransactionController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update inventory transaction',
    });
  }
};

/**
 * Delete inventory transaction
 */
export const deleteInventoryTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory transaction ID format',
      });
    }

    const result = await deleteInventoryTransactionService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteInventoryTransactionController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete inventory transaction',
    });
  }
};

// =========================
// INVENTORY BALANCE CONTROLLERS
// =========================

/**
 * Create a new inventory balance
 */
export const createInventoryBalance = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateInventoryBalanceSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (!validate(validatedData.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    if (!validate(validatedData.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    // Check if restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Check if warehouse exists
    const warehouseExists = await checkWarehouseExists(validatedData.warehouseId);
    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    // Check if inventory item exists
    const itemExists = await checkInventoryItemExists(validatedData.inventoryItemId);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const inventoryBalance = await createInventoryBalanceService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Inventory balance created successfully',
      data: inventoryBalance,
    });
  } catch (error: any) {
    console.error('Error in createInventoryBalanceController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create inventory balance',
    });
  }
};

/**
 * Get inventory balance by ID
 */
export const getInventoryBalanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory balance ID format',
      });
    }

    const inventoryBalance = await getInventoryBalanceByIdService(id);

    if (!inventoryBalance) {
      return res.status(404).json({
        success: false,
        message: 'Inventory balance not found',
      });
    }

    res.status(200).json({
      success: true,
      data: inventoryBalance,
    });
  } catch (error: any) {
    console.error('Error in getInventoryBalanceByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get inventory balance',
    });
  }
};

/**
 * Get all inventory balances with filtering and pagination
 */
export const getInventoryBalances = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = InventoryBalanceQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.restaurantId && !validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.warehouseId && !validate(query.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    if (query.inventoryItemId && !validate(query.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    const result = await getInventoryBalancesService(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in getInventoryBalancesController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get inventory balances',
    });
  }
};

/**
 * Update inventory balance
 */
export const updateInventoryBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory balance ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateInventoryBalanceSchema.parse(req.body);

    const inventoryBalance = await updateInventoryBalanceService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Inventory balance updated successfully',
      data: inventoryBalance,
    });
  } catch (error: any) {
    console.error('Error in updateInventoryBalanceController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update inventory balance',
    });
  }
};

/**
 * Delete inventory balance
 */
export const deleteInventoryBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory balance ID format',
      });
    }

    const result = await deleteInventoryBalanceService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteInventoryBalanceController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete inventory balance',
    });
  }
};

// =========================
// WAREHOUSE TRANSFER CONTROLLERS
// =========================

/**
 * Create a new warehouse transfer
 */
export const createWarehouseTransfer = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateWarehouseTransferSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (!validate(validatedData.fromWarehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid from warehouse ID format',
      });
    }

    if (!validate(validatedData.toWarehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid to warehouse ID format',
      });
    }

    // Check if restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Check if from warehouse exists
    const fromWarehouseExists = await checkWarehouseExists(validatedData.fromWarehouseId);
    if (!fromWarehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'From warehouse not found',
      });
    }

    // Check if to warehouse exists
    const toWarehouseExists = await checkWarehouseExists(validatedData.toWarehouseId);
    if (!toWarehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'To warehouse not found',
      });
    }

    const warehouseTransfer = await createWarehouseTransferService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Warehouse transfer created successfully',
      data: warehouseTransfer,
    });
  } catch (error: any) {
    console.error('Error in createWarehouseTransferController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create warehouse transfer',
    });
  }
};

/**
 * Get warehouse transfer by ID
 */
export const getWarehouseTransferById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse transfer ID format',
      });
    }

    const warehouseTransfer = await getWarehouseTransferByIdService(id);

    if (!warehouseTransfer) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse transfer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: warehouseTransfer,
    });
  } catch (error: any) {
    console.error('Error in getWarehouseTransferByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get warehouse transfer',
    });
  }
};

/**
 * Get all warehouse transfers with filtering and pagination
 */
export const getWarehouseTransfers = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = WarehouseTransferQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.restaurantId && !validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.fromWarehouseId && !validate(query.fromWarehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid from warehouse ID format',
      });
    }

    if (query.toWarehouseId && !validate(query.toWarehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid to warehouse ID format',
      });
    }

    const result = await getWarehouseTransfersService(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in getWarehouseTransfersController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get warehouse transfers',
    });
  }
};

/**
 * Update warehouse transfer
 */
export const updateWarehouseTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse transfer ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateWarehouseTransferSchema.parse(req.body);

    const warehouseTransfer = await updateWarehouseTransferService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Warehouse transfer updated successfully',
      data: warehouseTransfer,
    });
  } catch (error: any) {
    console.error('Error in updateWarehouseTransferController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update warehouse transfer',
    });
  }
};

/**
 * Delete warehouse transfer
 */
export const deleteWarehouseTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse transfer ID format',
      });
    }

    const result = await deleteWarehouseTransferService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteWarehouseTransferController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete warehouse transfer',
    });
  }
};

// =========================
// WAREHOUSE TRANSFER ITEM CONTROLLERS
// =========================

/**
 * Create a new warehouse transfer item
 */
export const createWarehouseTransferItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateWarehouseTransferItemSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.transferId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer ID format',
      });
    }

    if (!validate(validatedData.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    // Check if inventory item exists
    const itemExists = await checkInventoryItemExists(validatedData.inventoryItemId);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const warehouseTransferItem = await createWarehouseTransferItemService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Warehouse transfer item created successfully',
      data: warehouseTransferItem,
    });
  } catch (error: any) {
    console.error('Error in createWarehouseTransferItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create warehouse transfer item',
    });
  }
};

/**
 * Update warehouse transfer item
 */
export const updateWarehouseTransferItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse transfer item ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateWarehouseTransferItemSchema.parse(req.body);

    const warehouseTransferItem = await updateWarehouseTransferItemService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Warehouse transfer item updated successfully',
      data: warehouseTransferItem,
    });
  } catch (error: any) {
    console.error('Error in updateWarehouseTransferItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update warehouse transfer item',
    });
  }
};

/**
 * Delete warehouse transfer item
 */
export const deleteWarehouseTransferItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse transfer item ID format',
      });
    }

    const result = await deleteWarehouseTransferItemService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteWarehouseTransferItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete warehouse transfer item',
    });
  }
};

// =========================
// WAREHOUSE RECEIPT CONTROLLERS
// =========================

/**
 * Create a new warehouse receipt
 */
export const createWarehouseReceipt = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateWarehouseReceiptSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (!validate(validatedData.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    if (validatedData.supplierId && !validate(validatedData.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    // Check if restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Check if warehouse exists
    const warehouseExists = await checkWarehouseExists(validatedData.warehouseId);
    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    const authUserId = getUserIdFromRequest(req);
    const createdById = validatedData.createdById || authUserId;

    if (!createdById) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!validate(createdById)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Check if user exists
    const userExists = await checkUserExists(createdById);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if supplier exists (if provided)
    if (validatedData.supplierId) {
      const supplierExists = await checkSupplierExists(validatedData.supplierId);
      if (!supplierExists) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }
    }

    const warehouseReceipt = await createWarehouseReceiptService({
      ...validatedData,
      createdById,
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse receipt created successfully',
      data: warehouseReceipt,
    });
  } catch (error: any) {
    console.error('Error in createWarehouseReceiptController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create warehouse receipt',
    });
  }
};

/**
 * Get warehouse receipt by ID
 */
export const getWarehouseReceiptById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse receipt ID format',
      });
    }

    const warehouseReceipt = await getWarehouseReceiptByIdService(id);

    if (!warehouseReceipt) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse receipt not found',
      });
    }

    res.status(200).json({
      success: true,
      data: warehouseReceipt,
    });
  } catch (error: any) {
    console.error('Error in getWarehouseReceiptByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get warehouse receipt',
    });
  }
};

/**
 * Get all warehouse receipts with filtering and pagination
 */
export const getWarehouseReceipts = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = WarehouseReceiptQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.restaurantId && !validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.warehouseId && !validate(query.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    if (query.supplierId && !validate(query.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    const result = await getWarehouseReceiptsService(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in getWarehouseReceiptsController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get warehouse receipts',
    });
  }
};

/**
 * Update warehouse receipt
 */
export const updateWarehouseReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse receipt ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateWarehouseReceiptSchema.parse(req.body);

    // Validate UUIDs if provided
    if (validatedData.supplierId && !validate(validatedData.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    if (validatedData.approvedById && !validate(validatedData.approvedById)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approved by user ID format',
      });
    }

    // Check if supplier exists (if provided)
    if (validatedData.supplierId) {
      const supplierExists = await checkSupplierExists(validatedData.supplierId);
      if (!supplierExists) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }
    }

    // Check if user exists (if provided)
    if (validatedData.approvedById) {
      const userExists = await checkUserExists(validatedData.approvedById);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
    }

    const warehouseReceipt = await updateWarehouseReceiptService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Warehouse receipt updated successfully',
      data: warehouseReceipt,
    });
  } catch (error: any) {
    console.error('Error in updateWarehouseReceiptController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update warehouse receipt',
    });
  }
};

/**
 * Delete warehouse receipt
 */
export const deleteWarehouseReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse receipt ID format',
      });
    }

    const result = await deleteWarehouseReceiptService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteWarehouseReceiptController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete warehouse receipt',
    });
  }
};

// =========================
// WAREHOUSE RECEIPT ITEM CONTROLLERS
// =========================

/**
 * Create a new warehouse receipt item
 */
export const createWarehouseReceiptItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateWarehouseReceiptItemSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.receiptId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid receipt ID format',
      });
    }

    if (!validate(validatedData.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    // Check if inventory item exists
    const itemExists = await checkInventoryItemExists(validatedData.inventoryItemId);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const warehouseReceiptItem = await createWarehouseReceiptItemService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Warehouse receipt item created successfully',
      data: warehouseReceiptItem,
    });
  } catch (error: any) {
    console.error('Error in createWarehouseReceiptItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create warehouse receipt item',
    });
  }
};

/**
 * Update warehouse receipt item
 */
export const updateWarehouseReceiptItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse receipt item ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateWarehouseReceiptItemSchema.parse(req.body);

    const warehouseReceiptItem = await updateWarehouseReceiptItemService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Warehouse receipt item updated successfully',
      data: warehouseReceiptItem,
    });
  } catch (error: any) {
    console.error('Error in updateWarehouseReceiptItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update warehouse receipt item',
    });
  }
};

/**
 * Delete warehouse receipt item
 */
export const deleteWarehouseReceiptItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse receipt item ID format',
      });
    }

    const result = await deleteWarehouseReceiptItemService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteWarehouseReceiptItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete warehouse receipt item',
    });
  }
};

// =========================
// WAREHOUSE ISSUE CONTROLLERS
// =========================

/**
 * Create a new warehouse issue
 */
export const createWarehouseIssue = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateWarehouseIssueSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (!validate(validatedData.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    // Check if restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Check if warehouse exists
    const warehouseExists = await checkWarehouseExists(validatedData.warehouseId);
    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    const authUserId = getUserIdFromRequest(req);
    const createdById = validatedData.createdById || authUserId;

    if (!createdById) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!validate(createdById)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Check if user exists
    const userExists = await checkUserExists(createdById);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const warehouseIssue = await createWarehouseIssueService({
      ...validatedData,
      createdById,
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse issue created successfully',
      data: warehouseIssue,
    });
  } catch (error: any) {
    console.error('Error in createWarehouseIssueController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create warehouse issue',
    });
  }
};

/**
 * Get warehouse issue by ID
 */
export const getWarehouseIssueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse issue ID format',
      });
    }

    const warehouseIssue = await getWarehouseIssueByIdService(id);

    if (!warehouseIssue) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse issue not found',
      });
    }

    res.status(200).json({
      success: true,
      data: warehouseIssue,
    });
  } catch (error: any) {
    console.error('Error in getWarehouseIssueByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get warehouse issue',
    });
  }
};

/**
 * Get all warehouse issues with filtering and pagination
 */
export const getWarehouseIssues = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = WarehouseIssueQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.restaurantId && !validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.warehouseId && !validate(query.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    const result = await getWarehouseIssuesService(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in getWarehouseIssuesController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get warehouse issues',
    });
  }
};

/**
 * Update warehouse issue
 */
export const updateWarehouseIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse issue ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateWarehouseIssueSchema.parse(req.body);

    // Validate UUIDs if provided
    if (validatedData.approvedById && !validate(validatedData.approvedById)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approved by user ID format',
      });
    }

    // Check if user exists (if provided)
    if (validatedData.approvedById) {
      const userExists = await checkUserExists(validatedData.approvedById);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
    }

    const warehouseIssue = await updateWarehouseIssueService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Warehouse issue updated successfully',
      data: warehouseIssue,
    });
  } catch (error: any) {
    console.error('Error in updateWarehouseIssueController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update warehouse issue',
    });
  }
};

/**
 * Delete warehouse issue
 */
export const deleteWarehouseIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse issue ID format',
      });
    }

    const result = await deleteWarehouseIssueService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteWarehouseIssueController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete warehouse issue',
    });
  }
};

// =========================
// WAREHOUSE ISSUE ITEM CONTROLLERS
// =========================

/**
 * Create a new warehouse issue item
 */
export const createWarehouseIssueItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateWarehouseIssueItemSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID format',
      });
    }

    if (!validate(validatedData.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    // Check if inventory item exists
    const itemExists = await checkInventoryItemExists(validatedData.inventoryItemId);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const warehouseIssueItem = await createWarehouseIssueItemService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Warehouse issue item created successfully',
      data: warehouseIssueItem,
    });
  } catch (error: any) {
    console.error('Error in createWarehouseIssueItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create warehouse issue item',
    });
  }
};

/**
 * Update warehouse issue item
 */
export const updateWarehouseIssueItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse issue item ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateWarehouseIssueItemSchema.parse(req.body);

    const warehouseIssueItem = await updateWarehouseIssueItemService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Warehouse issue item updated successfully',
      data: warehouseIssueItem,
    });
  } catch (error: any) {
    console.error('Error in updateWarehouseIssueItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update warehouse issue item',
    });
  }
};

/**
 * Delete warehouse issue item
 */
export const deleteWarehouseIssueItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse issue item ID format',
      });
    }

    const result = await deleteWarehouseIssueItemService(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteWarehouseIssueItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete warehouse issue item',
    });
  }
};

// =========================
// BULK OPERATION CONTROLLERS
// =========================

/**
 * Bulk update inventory quantities
 */
export const bulkUpdateInventoryQuantities = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = BulkUpdateInventoryQuantitiesSchema.parse(req.body);

    // Validate UUIDs
    for (const itemId of validatedData.itemIds) {
      if (!validate(itemId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid inventory item ID format: ${itemId}`,
        });
      }
    }

    const result = await bulkUpdateInventoryQuantitiesService(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in bulkUpdateInventoryQuantitiesController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to bulk update inventory quantities',
    });
  }
};

/**
 * Bulk update warehouse status
 */
export const bulkUpdateWarehouseStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = BulkUpdateWarehouseStatusSchema.parse(req.body);

    // Validate UUIDs
    for (const warehouseId of validatedData.warehouseIds) {
      if (!validate(warehouseId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid warehouse ID format: ${warehouseId}`,
        });
      }
    }

    const result = await bulkUpdateWarehouseStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in bulkUpdateWarehouseStatusController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to bulk update warehouse status',
    });
  }
};

// =========================
// SPECIAL QUERY CONTROLLERS
// =========================

/**
 * Get inventory low stock items
 */
export const getInventoryLowStock = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = InventoryLowStockQuerySchema.parse(req.query);

    // Validate UUIDs
    if (!validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.warehouseId && !validate(query.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    const lowStockItems = await getInventoryLowStockService(query);

    res.status(200).json({
      success: true,
      data: lowStockItems,
    });
  } catch (error: any) {
    console.error('Error in getInventoryLowStockController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get inventory low stock',
    });
  }
};

/**
 * Get inventory items expiring soon
 */
export const getInventoryExpiry = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = InventoryExpiryQuerySchema.parse(req.query);

    // Validate UUIDs
    if (!validate(query.organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
      });
    }

    if (query.warehouseId && !validate(query.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    const expiringItems = await getInventoryExpiryService(query);

    res.status(200).json({
      success: true,
      data: expiringItems,
    });
  } catch (error: any) {
    console.error('Error in getInventoryExpiryController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get inventory expiry',
    });
  }
};

/**
 * Get inventory valuation
 */
export const getInventoryValuation = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = InventoryValuationQuerySchema.parse(req.query);

    // Validate UUIDs
    if (!validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.warehouseId && !validate(query.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    const valuation = await getInventoryValuationService(query);

    res.status(200).json({
      success: true,
      data: valuation,
    });
  } catch (error: any) {
    console.error('Error in getInventoryValuationController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get inventory valuation',
    });
  }
};

/**
 * Get inventory movement report
 */
export const getInventoryMovement = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = InventoryMovementQuerySchema.parse(req.query);

    // Validate UUIDs
    if (!validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.inventoryItemId && !validate(query.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    if (query.warehouseId && !validate(query.warehouseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    const movement = await getInventoryMovementService(query);

    res.status(200).json({
      success: true,
      data: movement,
    });
  } catch (error: any) {
    console.error('Error in getInventoryMovementController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get inventory movement',
    });
  }
};
