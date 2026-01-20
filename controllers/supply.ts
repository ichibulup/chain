import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import { getUserIdFromRequest } from '@/lib/utils/auth';
import {
  CreateSupplierSchema,
  UpdateSupplierSchema,
  SupplierQuerySchema,
  CreateSupplierItemSchema,
  UpdateSupplierItemSchema,
  SupplierItemQuerySchema,
  CreatePurchaseOrderSchema,
  UpdatePurchaseOrderSchema,
  PurchaseOrderQuerySchema,
  CreatePurchaseOrderItemSchema,
  UpdatePurchaseOrderItemSchema,
  PurchaseOrderItemQuerySchema,
  BulkUpdateSupplierStatusSchema,
  BulkUpdatePurchaseOrderStatusSchema,
  BulkUpdateSupplierItemPricesSchema,
  SupplierPerformanceQuerySchema,
  PurchaseOrderSummaryQuerySchema,
  SupplierComparisonQuerySchema,
  PurchaseOrderAnalyticsQuerySchema,
  SupplierRatingUpdateSchema,
  SupplierContactUpdateSchema,
  SupplierPaymentTermsUpdateSchema,
  SendPurchaseOrderSchema,
  ConfirmPurchaseOrderSchema,
  ReceivePurchaseOrderSchema,
  CancelPurchaseOrderSchema,
  SupplierRegistrationSchema,
} from '@/schemas/supply';
import {
  createSupplier,
  registerSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
  createSupplierItem,
  getSupplierItemById,
  getSupplierItems,
  updateSupplierItem,
  deleteSupplierItem,
  createPurchaseOrder,
  getPurchaseOrderById,
  getPurchaseOrders,
  updatePurchaseOrder,
  deletePurchaseOrder,
  createPurchaseOrderItem,
  getPurchaseOrderItemById,
  getPurchaseOrderItems,
  updatePurchaseOrderItem,
  deletePurchaseOrderItem,
  bulkUpdateSupplierStatus,
  bulkUpdatePurchaseOrderStatus,
  bulkUpdateSupplierItemPrices,
  getSupplierPerformance,
  getPurchaseOrderSummary,
  getSupplierComparison,
  getPurchaseOrderAnalytics,
  sendPurchaseOrder,
  confirmPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from '@/services/supply';
import {
  checkRestaurantExists,
  checkUserExists,
  checkOrganizationExists,
  checkSupplierExists,
  checkInventoryItemExists,
} from '@/services/helper';

// =========================
// SUPPLIER CONTROLLERS
// =========================

/**
 * Create a new supplier
 */
export const createSupplierController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateSupplierSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
      });
    }

    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
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

    // Check if restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const userId = getUserIdFromRequest(req);
    const supplier = await createSupplier(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error: any) {
    console.error('Error in createSupplierController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create supplier',
    });
  }
};

/**
 * Register supplier with new organization (self-registration)
 */
export const registerSupplierController = async (req: Request, res: Response) => {
  try {
    const validatedData = SupplierRegistrationSchema.parse(req.body);

    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);
    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const userId = getUserIdFromRequest(req);
    const result = await registerSupplier(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Supplier registered successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error in registerSupplierController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to register supplier',
    });
  }
};

/**
 * Get supplier by ID
 */
export const getSupplierByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    const supplier = await getSupplierById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error: any) {
    console.error('Error in getSupplierByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get supplier',
    });
  }
};

/**
 * Get all suppliers with filtering and pagination
 */
export const getSuppliersController = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = SupplierQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.organizationId && !validate(query.organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
      });
    }

    if (query.restaurantId && !validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    const result = await getSuppliers(query);

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
    console.error('Error in getSuppliersController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get suppliers',
    });
  }
};

/**
 * Update supplier
 */
export const updateSupplierController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateSupplierSchema.parse(req.body);

    // Check if supplier exists
    const supplierExists = await checkSupplierExists(id);
    if (!supplierExists) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    const userId = getUserIdFromRequest(req);
    const supplier = await updateSupplier(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error: any) {
    console.error('Error in updateSupplierController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update supplier',
    });
  }
};

/**
 * Delete supplier
 */
export const deleteSupplierController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    // Check if supplier exists
    const supplierExists = await checkSupplierExists(id);
    if (!supplierExists) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    const userId = getUserIdFromRequest(req);
    const result = await deleteSupplier(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteSupplierController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete supplier',
    });
  }
};

// =========================
// SUPPLIER ITEM CONTROLLERS
// =========================

/**
 * Create a new supplier item
 */
export const createSupplierItemController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateSupplierItemSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    if (!validate(validatedData.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    // Check if supplier exists
    const supplierExists = await checkSupplierExists(validatedData.supplierId);
    if (!supplierExists) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
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

    const supplierItem = await createSupplierItem(validatedData);

    res.status(201).json({
      success: true,
      message: 'Supplier item created successfully',
      data: supplierItem,
    });
  } catch (error: any) {
    console.error('Error in createSupplierItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create supplier item',
    });
  }
};

/**
 * Get supplier item by ID
 */
export const getSupplierItemByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier item ID format',
      });
    }

    const supplierItem = await getSupplierItemById(id);

    if (!supplierItem) {
      return res.status(404).json({
        success: false,
        message: 'Supplier item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: supplierItem,
    });
  } catch (error: any) {
    console.error('Error in getSupplierItemByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get supplier item',
    });
  }
};

/**
 * Get all supplier items with filtering and pagination
 */
export const getSupplierItemsController = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = SupplierItemQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.supplierId && !validate(query.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    if (query.inventoryItemId && !validate(query.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    const result = await getSupplierItems(query);

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
    console.error('Error in getSupplierItemsController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get supplier items',
    });
  }
};

/**
 * Update supplier item
 */
export const updateSupplierItemController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier item ID format',
      });
    }

    // Validate request body
    const validatedData = UpdateSupplierItemSchema.parse(req.body);

    const userId = getUserIdFromRequest(req);
    const supplierItem = await updateSupplierItem(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Supplier item updated successfully',
      data: supplierItem,
    });
  } catch (error: any) {
    console.error('Error in updateSupplierItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update supplier item',
    });
  }
};

/**
 * Delete supplier item
 */
export const deleteSupplierItemController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier item ID format',
      });
    }

    const userId = getUserIdFromRequest(req);
    const result = await deleteSupplierItem(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteSupplierItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete supplier item',
    });
  }
};

// =========================
// PURCHASE ORDER CONTROLLERS
// =========================

/**
 * Create a new purchase order
 */
export const createPurchaseOrderController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreatePurchaseOrderSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    if (!validate(validatedData.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    // Check if supplier exists
    const supplierExists = await checkSupplierExists(validatedData.supplierId);
    if (!supplierExists) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
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

    const userId = getUserIdFromRequest(req);
    const createdById = validatedData.createdById || userId;

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

    const purchaseOrder = await createPurchaseOrder(
      {
        ...validatedData,
        createdById,
      },
      userId,
    );

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder,
    });
  } catch (error: any) {
    console.error('Error in createPurchaseOrderController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create purchase order',
    });
  }
};

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
      });
    }

    const purchaseOrder = await getPurchaseOrderById(id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error: any) {
    console.error('Error in getPurchaseOrderByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get purchase order',
    });
  }
};

/**
 * Get all purchase orders with filtering and pagination
 */
export const getPurchaseOrdersController = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = PurchaseOrderQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.supplierId && !validate(query.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    if (query.restaurantId && !validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.createdById && !validate(query.createdById)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const result = await getPurchaseOrders(query);

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
    console.error('Error in getPurchaseOrdersController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get purchase orders',
    });
  }
};

/**
 * Update purchase order
 */
export const updatePurchaseOrderController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
      });
    }

    // Validate request body
    const validatedData = UpdatePurchaseOrderSchema.parse(req.body);

    const purchaseOrder = await updatePurchaseOrder(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: purchaseOrder,
    });
  } catch (error: any) {
    console.error('Error in updatePurchaseOrderController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update purchase order',
    });
  }
};

/**
 * Delete purchase order
 */
export const deletePurchaseOrderController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
      });
    }

    const userId = getUserIdFromRequest(req);
    const result = await deletePurchaseOrder(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deletePurchaseOrderController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete purchase order',
    });
  }
};

// =========================
// PURCHASE ORDER ITEM CONTROLLERS
// =========================

/**
 * Create a new purchase order item
 */
export const createPurchaseOrderItemController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreatePurchaseOrderItemSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.purchaseOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
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

    const purchaseOrderItem = await createPurchaseOrderItem(validatedData);

    res.status(201).json({
      success: true,
      message: 'Purchase order item created successfully',
      data: purchaseOrderItem,
    });
  } catch (error: any) {
    console.error('Error in createPurchaseOrderItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create purchase order item',
    });
  }
};

/**
 * Get purchase order item by ID
 */
export const getPurchaseOrderItemByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order item ID format',
      });
    }

    const purchaseOrderItem = await getPurchaseOrderItemById(id);

    if (!purchaseOrderItem) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: purchaseOrderItem,
    });
  } catch (error: any) {
    console.error('Error in getPurchaseOrderItemByIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get purchase order item',
    });
  }
};

/**
 * Get all purchase order items with filtering and pagination
 */
export const getPurchaseOrderItemsController = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = PurchaseOrderItemQuerySchema.parse(req.query);

    // Validate UUIDs if provided
    if (query.purchaseOrderId && !validate(query.purchaseOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
      });
    }

    if (query.inventoryItemId && !validate(query.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    const result = await getPurchaseOrderItems(query);

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
    console.error('Error in getPurchaseOrderItemsController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get purchase order items',
    });
  }
};

/**
 * Update purchase order item
 */
export const updatePurchaseOrderItemController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order item ID format',
      });
    }

    // Validate request body
    const validatedData = UpdatePurchaseOrderItemSchema.parse(req.body);

    const purchaseOrderItem = await updatePurchaseOrderItem(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Purchase order item updated successfully',
      data: purchaseOrderItem,
    });
  } catch (error: any) {
    console.error('Error in updatePurchaseOrderItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update purchase order item',
    });
  }
};

/**
 * Delete purchase order item
 */
export const deletePurchaseOrderItemController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order item ID format',
      });
    }

    const result = await deletePurchaseOrderItem(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deletePurchaseOrderItemController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete purchase order item',
    });
  }
};

// =========================
// BULK OPERATION CONTROLLERS
// =========================

/**
 * Bulk update supplier status
 */
export const bulkUpdateSupplierStatusController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = BulkUpdateSupplierStatusSchema.parse(req.body);

    // Validate UUIDs
    for (const supplierId of validatedData.supplierIds) {
      if (!validate(supplierId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid supplier ID format: ${supplierId}`,
        });
      }
    }

    const result = await bulkUpdateSupplierStatus(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in bulkUpdateSupplierStatusController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to bulk update supplier status',
    });
  }
};

/**
 * Bulk update purchase order status
 */
export const bulkUpdatePurchaseOrderStatusController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = BulkUpdatePurchaseOrderStatusSchema.parse(req.body);

    // Validate UUIDs
    for (const purchaseOrderId of validatedData.purchaseOrderIds) {
      if (!validate(purchaseOrderId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid purchase order ID format: ${purchaseOrderId}`,
        });
      }
    }

    const result = await bulkUpdatePurchaseOrderStatus(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in bulkUpdatePurchaseOrderStatusController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to bulk update purchase order status',
    });
  }
};

/**
 * Bulk update supplier item prices
 */
export const bulkUpdateSupplierItemPricesController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = BulkUpdateSupplierItemPricesSchema.parse(req.body);

    // Validate UUIDs
    for (const supplierItemId of validatedData.supplierItemIds) {
      if (!validate(supplierItemId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid supplier item ID format: ${supplierItemId}`,
        });
      }
    }

    const result = await bulkUpdateSupplierItemPrices(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in bulkUpdateSupplierItemPricesController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to bulk update supplier item prices',
    });
  }
};

// =========================
// SPECIAL QUERY CONTROLLERS
// =========================

/**
 * Get supplier performance metrics
 */
export const getSupplierPerformanceController = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = SupplierPerformanceQuerySchema.parse(req.query);

    // Validate UUIDs
    if (!validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.supplierId && !validate(query.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    const performance = await getSupplierPerformance(query);

    res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error: any) {
    console.error('Error in getSupplierPerformanceController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get supplier performance',
    });
  }
};

/**
 * Get purchase order summary
 */
export const getPurchaseOrderSummaryController = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = PurchaseOrderSummaryQuerySchema.parse(req.query);

    // Validate UUIDs
    if (!validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (query.supplierId && !validate(query.supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format',
      });
    }

    const summary = await getPurchaseOrderSummary(query);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error in getPurchaseOrderSummaryController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get purchase order summary',
    });
  }
};

/**
 * Get supplier comparison for specific inventory item
 */
export const getSupplierComparisonController = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = SupplierComparisonQuerySchema.parse(req.query);

    // Validate UUIDs
    if (!validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (!validate(query.inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory item ID format',
      });
    }

    const comparison = await getSupplierComparison(query);

    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    console.error('Error in getSupplierComparisonController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get supplier comparison',
    });
  }
};

/**
 * Get purchase order analytics
 */
export const getPurchaseOrderAnalyticsController = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const query = PurchaseOrderAnalyticsQuerySchema.parse(req.query);

    // Validate UUIDs
    if (!validate(query.restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    const analytics = await getPurchaseOrderAnalytics(query);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('Error in getPurchaseOrderAnalyticsController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get purchase order analytics',
    });
  }
};

// =========================
// WORKFLOW CONTROLLERS
// =========================

/**
 * Send purchase order to supplier
 */
export const sendPurchaseOrderController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = SendPurchaseOrderSchema.parse(req.body);

    // Validate UUID
    if (!validate(validatedData.purchaseOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
      });
    }

    const result = await sendPurchaseOrder(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Error in sendPurchaseOrderController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send purchase order',
    });
  }
};

/**
 * Confirm purchase order with supplier
 */
export const confirmPurchaseOrderController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = ConfirmPurchaseOrderSchema.parse(req.body);

    // Validate UUID
    if (!validate(validatedData.purchaseOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
      });
    }

    const result = await confirmPurchaseOrder(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Error in confirmPurchaseOrderController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to confirm purchase order',
    });
  }
};

/**
 * Receive purchase order items
 */
export const receivePurchaseOrderController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = ReceivePurchaseOrderSchema.parse(req.body);

    // Validate UUIDs
    if (!validate(validatedData.purchaseOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
      });
    }

    for (const item of validatedData.receivedItems) {
      if (!validate(item.itemId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item ID format: ${item.itemId}`,
        });
      }
    }

    const result = await receivePurchaseOrder(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Error in receivePurchaseOrderController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to receive purchase order',
    });
  }
};

/**
 * Cancel purchase order
 */
export const cancelPurchaseOrderController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CancelPurchaseOrderSchema.parse(req.body);

    // Validate UUID
    if (!validate(validatedData.purchaseOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format',
      });
    }

    const result = await cancelPurchaseOrder(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Error in cancelPurchaseOrderController:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel purchase order',
    });
  }
};
