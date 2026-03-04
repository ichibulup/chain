import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import { getUserIdFromRequest } from '@/lib/utils/auth';
import {
  // Order services
  createOrder as createOrderService,
  getOrderById as getOrderByIdService,
  getOrders as getOrdersService,
  updateOrder as updateOrderService,
  deleteOrder as deleteOrderService,
  
  // Order item services
  createOrderItem as createOrderItemService,
  getOrderItemById as getOrderItemByIdService,
  getOrderItems as getOrderItemsService,
  updateOrderItem as updateOrderItemService,
  deleteOrderItem as deleteOrderItemService,
  
  // Order item option services
  createOrderItemOption as createOrderItemOptionService,
  updateOrderItemOption as updateOrderItemOptionService,
  deleteOrderItemOption as deleteOrderItemOptionService,
  
  // Order status history services
  createOrderStatusHistory as createOrderStatusHistoryService,
  getOrderStatusHistory as getOrderStatusHistoryService,
  
  // Payment services
  createPayment as createPaymentService,
  getPaymentById as getPaymentByIdService,
  getPayments as getPaymentsService,
  updatePayment as updatePaymentService,
  deletePayment as deletePaymentService,
  
  // Refund services
  createRefund as createRefundService,
  getRefundById as getRefundByIdService,
  getRefunds as getRefundsService,
  updateRefund as updateRefundService,
  deleteRefund as deleteRefundService,
  
  // Payment intent services
  createPaymentIntent as createPaymentIntentService,
  getPaymentIntentById as getPaymentIntentByIdService,
  getPaymentIntents as getPaymentIntentsService,
  updatePaymentIntent as updatePaymentIntentService,
  deletePaymentIntent as deletePaymentIntentService,
  
  // Bulk operation services
  bulkUpdateOrderStatus as bulkUpdateOrderStatusService,
  bulkUpdateOrderItemCookingStatus as bulkUpdateOrderItemCookingStatusService,
  bulkUpdatePaymentStatus as bulkUpdatePaymentStatusService,
  
  // Special query services
  getOrderStatistics as getOrderStatisticsService,
  getPaymentSummary as getPaymentSummaryService,
  getOrderRevenue as getOrderRevenueService,
  
  // Existence check services
  checkAddressExists,
  checkMenuItemExists,
  checkOptionExists,
  checkOrderExists,
  checkOrderItemExists,
  checkPaymentExists,
  checkPaymentIntentExists,
} from '@/services/order';
import {
  checkRestaurantExists,
  checkUserExists,
} from '@/services/helper';
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderQuerySchema,
  CreateOrderItemSchema,
  UpdateOrderItemSchema,
  OrderItemQuerySchema,
  CreateOrderItemOptionSchema,
  UpdateOrderItemOptionSchema,
  CreateOrderStatusHistorySchema,
  OrderStatusHistoryQuerySchema,
  CreatePaymentSchema,
  UpdatePaymentSchema,
  PaymentQuerySchema,
  CreateRefundSchema,
  UpdateRefundSchema,
  RefundQuerySchema,
  CreatePaymentIntentSchema,
  UpdatePaymentIntentSchema,
  PaymentIntentQuerySchema,
  BulkUpdateOrderStatusSchema,
  BulkUpdateOrderItemCookingStatusSchema,
  BulkUpdatePaymentStatusSchema,
  OrderStatisticsQuerySchema,
  PaymentSummaryQuerySchema,
  OrderRevenueQuerySchema,
} from '@/schemas/order';

// =========================
// ORDER CONTROLLERS
// =========================

/**
 * Create a new order
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateOrderSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);

    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Validate customer exists
    const customerExists = await checkUserExists(validatedData.customerId);

    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate address exists if provided
    if (validatedData.addressId) {
      const addressExists = await checkAddressExists(validatedData.addressId);

      if (!addressExists) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const order = await createOrderService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is not valid'
      });
    }

    const order = await getOrderByIdService(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order found',
      data: order,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get order';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all orders with filtering and pagination
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await OrderQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getOrdersService(result.data);

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get orders';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update order
 */
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateOrderSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate order exists
    const orderExists = await checkOrderExists(id);

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const order = await updateOrderService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete order
 */
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is not valid'
      });
    }

    // Validate order exists
    const orderExists = await checkOrderExists(id);

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteOrderService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete order';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// ORDER ITEM CONTROLLERS
// =========================

/**
 * Create a new order item
 */
export const createOrderItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateOrderItemSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate order exists
    const orderExists = await checkOrderExists(validatedData.orderId);

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate menu item exists
    const menuItemExists = await checkMenuItemExists(validatedData.menuItemId);

    if (!menuItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const orderItem = await createOrderItemService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Order item created successfully',
      data: orderItem
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get order item by ID
 */
export const getOrderItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order item ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Order item ID is not valid'
      });
    }

    const orderItem = await getOrderItemByIdService(id);

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order item found',
      data: orderItem,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get order item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all order items with filtering and pagination
 */
export const getOrderItems = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await OrderItemQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getOrderItemsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Order items retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get order items';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update order item
 */
export const updateOrderItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order item ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Order item ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateOrderItemSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate order item exists
    const orderItemExists = await checkOrderItemExists(id);

    if (!orderItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const orderItem = await updateOrderItemService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Order item updated successfully',
      data: orderItem
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete order item
 */
export const deleteOrderItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order item ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Order item ID is not valid'
      });
    }

    // Validate order item exists
    const orderItemExists = await checkOrderItemExists(id);

    if (!orderItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteOrderItemService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Order item deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete order item';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// ORDER ITEM OPTION CONTROLLERS
// =========================

/**
 * Create a new order item option
 */
export const createOrderItemOption = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateOrderItemOptionSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate order item exists
    const orderItemExists = await checkOrderItemExists(validatedData.orderItemId);

    if (!orderItemExists) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    // Validate option exists
    const optionExists = await checkOptionExists(validatedData.optionId);

    if (!optionExists) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    const orderItemOption = await createOrderItemOptionService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Order item option created successfully',
      data: orderItemOption
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order item option';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update order item option
 */
export const updateOrderItemOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order item option ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Order item option ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateOrderItemOptionSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const orderItemOption = await updateOrderItemOptionService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Order item option updated successfully',
      data: orderItemOption
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order item option';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete order item option
 */
export const deleteOrderItemOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order item option ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Order item option ID is not valid'
      });
    }

    await deleteOrderItemOptionService(id);

    res.status(200).json({
      success: true,
      message: 'Order item option deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete order item option';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// ORDER STATUS HISTORY CONTROLLERS
// =========================

/**
 * Create a new order status history
 */
export const createOrderStatusHistory = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateOrderStatusHistorySchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate order exists
    const orderExists = await checkOrderExists(validatedData.orderId);

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate user exists if provided
    if (validatedData.changedByUserId) {
      const userExists = await checkUserExists(validatedData.changedByUserId);

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const orderStatusHistory = await createOrderStatusHistoryService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Order status history created successfully',
      data: orderStatusHistory
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order status history';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all order status history with filtering and pagination
 */
export const getOrderStatusHistory = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await OrderStatusHistoryQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getOrderStatusHistoryService(result.data);

    res.status(200).json({
      success: true,
      message: 'Order status history retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get order status history';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// PAYMENT CONTROLLERS
// =========================

/**
 * Create a new payment
 */
export const createPayment = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreatePaymentSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate order exists
    const orderExists = await checkOrderExists(validatedData.orderId);

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate user exists if provided
    if (validatedData.processedById) {
      const userExists = await checkUserExists(validatedData.processedById);

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const payment = await createPaymentService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is not valid'
      });
    }

    const payment = await getPaymentByIdService(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment found',
      data: payment,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get payment';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all payments with filtering and pagination
 */
export const getPayments = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await PaymentQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getPaymentsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get payments';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update payment
 */
export const updatePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdatePaymentSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate payment exists
    const paymentExists = await checkPaymentExists(id);

    if (!paymentExists) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const payment = await updatePaymentService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update payment';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete payment
 */
export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is not valid'
      });
    }

    // Validate payment exists
    const paymentExists = await checkPaymentExists(id);

    if (!paymentExists) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deletePaymentService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// REFUND CONTROLLERS
// =========================

/**
 * Create a new refund
 */
export const createRefund = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateRefundSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate payment exists
    const paymentExists = await checkPaymentExists(validatedData.paymentId);

    if (!paymentExists) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const refund = await createRefundService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Refund created successfully',
      data: refund
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create refund';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get refund by ID
 */
export const getRefundById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Refund ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Refund ID is not valid'
      });
    }

    const refund = await getRefundByIdService(id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Refund found',
      data: refund,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get refund';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all refunds with filtering and pagination
 */
export const getRefunds = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await RefundQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getRefundsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Refunds retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get refunds';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update refund
 */
export const updateRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Refund ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Refund ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateRefundSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const userId = getUserIdFromRequest(req);
    const refund = await updateRefundService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Refund updated successfully',
      data: refund
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update refund';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete refund
 */
export const deleteRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Refund ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Refund ID is not valid'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteRefundService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Refund deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete refund';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// PAYMENT INTENT CONTROLLERS
// =========================

/**
 * Create a new payment intent
 */
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreatePaymentIntentSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate order exists
    const orderExists = await checkOrderExists(validatedData.orderId);

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const paymentIntent = await createPaymentIntentService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      data: paymentIntent
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get payment intent by ID
 */
export const getPaymentIntentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is not valid'
      });
    }

    const paymentIntent = await getPaymentIntentByIdService(id);

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment intent found',
      data: paymentIntent,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get payment intent';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all payment intents with filtering and pagination
 */
export const getPaymentIntents = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await PaymentIntentQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getPaymentIntentsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Payment intents retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get payment intents';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update payment intent
 */
export const updatePaymentIntent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdatePaymentIntentSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate payment intent exists
    const paymentIntentExists = await checkPaymentIntentExists(id);

    if (!paymentIntentExists) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const paymentIntent = await updatePaymentIntentService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Payment intent updated successfully',
      data: paymentIntent
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update payment intent';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete payment intent
 */
export const deletePaymentIntent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is not valid'
      });
    }

    // Validate payment intent exists
    const paymentIntentExists = await checkPaymentIntentExists(id);

    if (!paymentIntentExists) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deletePaymentIntentService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Payment intent deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment intent';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// BULK OPERATION CONTROLLERS
// =========================

/**
 * Bulk update order status
 */
export const bulkUpdateOrderStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdateOrderStatusSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate user exists if provided
    if (validatedData.changedByUserId) {
      const userExists = await checkUserExists(validatedData.changedByUserId);

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const response = await bulkUpdateOrderStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update order status';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Bulk update order item cooking status
 */
export const bulkUpdateOrderItemCookingStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdateOrderItemCookingStatusSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const response = await bulkUpdateOrderItemCookingStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update order item cooking status';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Bulk update payment status
 */
export const bulkUpdatePaymentStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdatePaymentStatusSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate user exists if provided
    if (validatedData.processedById) {
      const userExists = await checkUserExists(validatedData.processedById);

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const response = await bulkUpdatePaymentStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update payment status';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// SPECIAL QUERY CONTROLLERS
// =========================

/**
 * Get order statistics
 */
export const getOrderStatistics = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await OrderStatisticsQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const statistics = await getOrderStatisticsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: statistics
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get order statistics';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get payment summary
 */
export const getPaymentSummary = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await PaymentSummaryQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const summary = await getPaymentSummaryService(result.data);

    res.status(200).json({
      success: true,
      message: 'Payment summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get payment summary';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get order revenue
 */
export const getOrderRevenue = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await OrderRevenueQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const revenue = await getOrderRevenueService(result.data);

    res.status(200).json({
      success: true,
      message: 'Order revenue retrieved successfully',
      data: revenue
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get order revenue';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};
