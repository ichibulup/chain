import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client/index';
import {
  CreateOrder,
  UpdateOrder,
  OrderQuery,
  CreateOrderItem,
  UpdateOrderItem,
  OrderItemQuery,
  CreateOrderItemOption,
  UpdateOrderItemOption,
  CreateOrderStatusHistory,
  OrderStatusHistoryQuery,
  CreatePayment,
  UpdatePayment,
  PaymentQuery,
  CreateRefund,
  UpdateRefund,
  RefundQuery,
  CreatePaymentIntent,
  UpdatePaymentIntent,
  PaymentIntentQuery,
  BulkUpdateOrderStatus,
  BulkUpdateOrderItemCookingStatus,
  BulkUpdatePaymentStatus,
  OrderStatisticsQuery,
  PaymentSummaryQuery,
  OrderRevenueQuery,
} from '@/schemas/order';
import {
  Order,
  OrderItem,
  OrderItemOption,
  OrderStatusHistory,
  Payment,
  PaymentIntent,
  Refund,
} from '@/models/order';
import { Address } from '@/models/customer';
import { DeliveryZone } from '@/models/delivery';
import { MenuItem, Option } from '@/models/menu';
import { Restaurant, User } from '@/models/organization';
import { Database } from '@/models/database';
import {
  AddressShortly,
  DeliveryFully,
  DeliveryShortly,
  DeliveryStaffShortly,
  MenuItemShortly,
  OrderItemShortly,
  PaymentShortly,
  RestaurantShortly,
  UserShortly
} from "lib/interfaces";

// =========================
// ORDER SERVICES
// =========================

const ORDER_CODE_PREFIX = 'GORTH';
const ORDER_CODE_RANDOM_LENGTH = 8;
const ORDER_TYPE_SUFFIX: Record<string, string> = {
  dineIn: 'T',
  takeaway: 'A',
  delivery: 'D',
};

const formatOrderCodeDate = (date: Date) => {
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const generateOrderCode = (orderType: string) => {
  const suffix = ORDER_TYPE_SUFFIX[orderType];
  if (!suffix) {
    throw new Error(`Unsupported order type: ${orderType}`);
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from(randomBytes(ORDER_CODE_RANDOM_LENGTH), (byte) => {
    return alphabet[byte % alphabet.length];
  }).join('');

  return `${ORDER_CODE_PREFIX}${formatOrderCodeDate(new Date())}${random}${suffix}`;
};

/**
 * Create a new order
 */
export const createOrder = async (data: CreateOrder, userId?: string | null) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if customer exists
    const customer = await User.findUnique({
      where: { id: data.customerId }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if address exists (if provided)
    if (data.addressId) {
      const address = await Address.findUnique({
        where: { id: data.addressId }
      });

      if (!address) {
        throw new Error('Address not found');
      }
    }

    // Check if delivery zone exists (if provided)
    if (data.deliveryZoneId) {
      const deliveryZone = await DeliveryZone.findUnique({
        where: { id: data.deliveryZoneId }
      });

      if (!deliveryZone) {
        throw new Error('Delivery zone not found');
      }
    }

    // Generate unique order code
    let orderCode = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateOrderCode(data.orderType);
      const existing = await Order.findUnique({
        where: { orderCode: candidate },
        select: { id: true },
      });

      if (!existing) {
        orderCode = candidate;
        break;
      }
    }

    if (!orderCode) {
      throw new Error('Failed to generate unique order code');
    }

    const order = await Order.create({
      data: {
        orderCode,
        restaurantId: data.restaurantId,
        customerId: data.customerId,
        addressId: data.addressId,
        orderType: data.orderType,
        totalAmount: data.totalAmount,
        discountAmount: data.discountAmount,
        taxAmount: data.taxAmount,
        serviceCharge: data.serviceCharge,
        tipAmount: data.tipAmount,
        deliveryFee: data.deliveryFee,
        finalAmount: data.finalAmount,
        currency: data.currency,
        estimatedTime: data.estimatedTime,
        estimatedTimeReadyAt: data.estimatedTimeReadyAt,
        promisedAt: data.promisedAt,
        notes: data.notes,
        deliveryZoneId: data.deliveryZoneId,
        deliveryNotes: data.deliveryNotes,
        createdById: userId || null,
      },
      include: {
        restaurant: true,
        customer: true,
        address: true,
        items: {
          include: {
            menuItem: true,
            options: {
              include: {
                option: true,
              },
            },
          },
        },
        history: true,
        payments: true,
        deliveryZone: true,
        tableOrders: true,
        voucherUsages: true,
        delivery: true,
        taxes: true,
        paymentIntent: true,
      },
    });

    // Create initial status history
    await OrderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'pending',
        notes: 'Order created',
      },
    });

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (id: string) => {
  try {
    const order = await Order.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: RestaurantShortly
        },
        customer: {
          select: UserShortly
        },
        address: {
          select: AddressShortly
        },
        items: {
          select: {
            ...OrderItemShortly,
            menuItem: {
              select: MenuItemShortly
            },
            options: {
              include: {
                option: true,
              },
            },
          },
        },
        history: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        payments: {
          select: {
            ...PaymentShortly,
            refunds: true,
          },
        },
        deliveryZone: true,
        tableOrders: true,
        voucherUsages: {
          include: {
            voucher: true,
          },
        },
        delivery: {
          select: {
            ...DeliveryFully,
            deliveryStaff: {
              select: {
                ...DeliveryStaffShortly,
                user: {
                  select: UserShortly
                }
              }
            }
          }
        },
        taxes: true,
        paymentIntent: true,
      },
    });

    return order;
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw new Error('Failed to get order');
  }
};

/**
 * Get all orders with filtering and pagination
 */
export const getOrders = async (query: OrderQuery) => {
  try {
    const {
      restaurantId,
      customerId,
      orderType,
      status,
      paymentStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.finalAmount = {};
      if (minAmount !== undefined) {
        where.finalAmount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.finalAmount.lte = maxAmount;
      }
    }

    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.findMany({
        where,
        include: {
          restaurant: {
            select: RestaurantShortly
          },
          customer: {
            select: UserShortly
          },
          address: true,
          items: {
            include: {
              menuItem: true,
            },
          },
          payments: true,
          deliveryZone: true,
          tableOrders: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting orders:', error);
    throw new Error('Failed to get orders');
  }
};

/**
 * Update order
 */
export const updateOrder = async (id: string, data: UpdateOrder, userId?: string | null) => {
  try {
    const order = await Order.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        restaurant: true,
        customer: true,
        address: true,
        items: {
          include: {
            menuItem: true,
            options: {
              include: {
                option: true,
              },
            },
          },
        },
        history: true,
        payments: true,
        deliveryZone: true,
        tableOrders: true,
        voucherUsages: true,
        delivery: true,
        taxes: true,
        paymentIntent: true,
      },
    });

    return order;
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
};

/**
 * Delete order (soft delete)
 */
export const deleteOrder = async (id: string, userId?: string | null) => {
  try {
    // Check if order has payments
    const payments = await Payment.count({
      where: { orderId: id }
    });

    if (payments > 0) {
      throw new Error('Cannot delete order with existing payments');
    }

    // Soft delete by setting deletedAt and deletedById
    const order = await Order.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Order deleted successfully', data: order };
  } catch (error) {
    console.error('Error deleting order:', error);
    throw new Error('Failed to delete order');
  }
};

// =========================
// ORDER ITEM SERVICES
// =========================

/**
 * Create a new order item
 */
export const createOrderItem = async (data: CreateOrderItem, userId?: string | null) => {
  try {
    // Check if order exists
    const order = await Order.findUnique({
      where: { id: data.orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if menu item exists
    const menuItem = await MenuItem.findUnique({
      where: { id: data.menuItemId }
    });

    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    const orderItem = await OrderItem.create({
      data: {
        orderId: data.orderId,
        menuItemId: data.menuItemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
        cookingStatus: data.cookingStatus,
        specialInstructions: data.specialInstructions,
        createdById: userId || null,
      },
      include: {
        order: true,
        menuItem: true,
        options: {
          include: {
            option: true,
          },
        },
      },
    });

    return orderItem;
  } catch (error) {
    console.error('Error creating order item:', error);
    throw new Error('Failed to create order item');
  }
};

/**
 * Get order item by ID
 */
export const getOrderItemById = async (id: string) => {
  try {
    const orderItem = await OrderItem.findUnique({
      where: { id },
      include: {
        order: true,
        menuItem: true,
        options: {
          include: {
            option: true,
          },
        },
      },
    });

    return orderItem;
  } catch (error) {
    console.error('Error getting order item by ID:', error);
    throw new Error('Failed to get order item');
  }
};

/**
 * Get all order items with filtering and pagination
 */
export const getOrderItems = async (query: OrderItemQuery) => {
  try {
    const {
      orderId,
      menuItemId,
      cookingStatus,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (menuItemId) {
      where.menuItemId = menuItemId;
    }

    if (cookingStatus) {
      where.cookingStatus = cookingStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [orderItems, total] = await Promise.all([
      OrderItem.findMany({
        where,
        include: {
          order: true,
          menuItem: true,
          options: {
            include: {
              option: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      OrderItem.count({ where }),
    ]);

    return {
      data: orderItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting order items:', error);
    throw new Error('Failed to get order items');
  }
};

/**
 * Update order item
 */
export const updateOrderItem = async (id: string, data: UpdateOrderItem, userId?: string | null) => {
  try {
    const orderItem = await OrderItem.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
      },
      include: {
        order: true,
        menuItem: true,
        options: {
          include: {
            option: true,
          },
        },
      },
    });

    return orderItem;
  } catch (error) {
    console.error('Error updating order item:', error);
    throw new Error('Failed to update order item');
  }
};

/**
 * Delete order item (soft delete)
 */
export const deleteOrderItem = async (id: string, userId?: string | null) => {
  try {
    const orderItem = await OrderItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Order item deleted successfully' };
  } catch (error) {
    console.error('Error deleting order item:', error);
    throw new Error('Failed to delete order item');
  }
};

// =========================
// ORDER ITEM OPTION SERVICES
// =========================

/**
 * Create a new order item option
 */
export const createOrderItemOption = async (data: CreateOrderItemOption) => {
  try {
    // Check if order item exists
    const orderItem = await OrderItem.findUnique({
      where: { id: data.orderItemId }
    });

    if (!orderItem) {
      throw new Error('Order item not found');
    }

    // Check if option exists
    const option = await Option.findUnique({
      where: { id: data.optionId }
    });

    if (!option) {
      throw new Error('Option not found');
    }

    const orderItemOption = await OrderItemOption.create({
      data: {
        orderItemId: data.orderItemId,
        optionId: data.optionId,
        priceDelta: data.priceDelta,
      },
      include: {
        orderItem: true,
        option: true,
      },
    });

    return orderItemOption;
  } catch (error) {
    console.error('Error creating order item option:', error);
    throw new Error('Failed to create order item option');
  }
};

/**
 * Update order item option
 */
export const updateOrderItemOption = async (id: string, data: UpdateOrderItemOption) => {
  try {
    const orderItemOption = await OrderItemOption.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        orderItem: true,
        option: true,
      },
    });

    return orderItemOption;
  } catch (error) {
    console.error('Error updating order item option:', error);
    throw new Error('Failed to update order item option');
  }
};

/**
 * Delete order item option
 */
export const deleteOrderItemOption = async (id: string) => {
  try {
    await OrderItemOption.delete({
      where: { id },
    });

    return { message: 'Order item option deleted successfully' };
  } catch (error) {
    console.error('Error deleting order item option:', error);
    throw new Error('Failed to delete order item option');
  }
};

// =========================
// ORDER STATUS HISTORY SERVICES
// =========================

/**
 * Create a new order status history
 */
export const createOrderStatusHistory = async (data: CreateOrderStatusHistory) => {
  try {
    // Check if order exists
    const order = await Order.findUnique({
      where: { id: data.orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if user exists (if provided)
    if (data.changedByUserId) {
      const user = await User.findUnique({
        where: { id: data.changedByUserId }
      });

      if (!user) {
        throw new Error('User not found');
      }
    }

    const orderStatusHistory = await OrderStatusHistory.create({
      data: {
        orderId: data.orderId,
        status: data.status,
        changedByUserId: data.changedByUserId,
        notes: data.notes,
      },
      include: {
        order: true,
        user: true,
      },
    });

    return orderStatusHistory;
  } catch (error) {
    console.error('Error creating order status history:', error);
    throw new Error('Failed to create order status history');
  }
};

/**
 * Get all order status history with filtering and pagination
 */
export const getOrderStatusHistory = async (query: OrderStatusHistoryQuery) => {
  try {
    const {
      orderId,
      status,
      changedByUserId,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (status) {
      where.status = status;
    }

    if (changedByUserId) {
      where.changedByUserId = changedByUserId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [orderStatusHistory, total] = await Promise.all([
      OrderStatusHistory.findMany({
        where,
        include: {
          order: true,
          user: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      OrderStatusHistory.count({ where }),
    ]);

    return {
      data: orderStatusHistory,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting order status history:', error);
    throw new Error('Failed to get order status history');
  }
};

// =========================
// PAYMENT SERVICES
// =========================

/**
 * Create a new payment
 */
export const createPayment = async (data: CreatePayment, userId?: string | null) => {
  try {
    // Check if order exists
    const order = await Order.findUnique({
      where: { id: data.orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if processed by user exists (if provided)
    if (data.processedById) {
      const user = await User.findUnique({
        where: { id: data.processedById }
      });

      if (!user) {
        throw new Error('User not found');
      }
    }

    const processedAt =
      data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled'
        ? new Date()
        : undefined;

    const shouldFinalizeDineIn =
      data.status === 'completed' && order.orderType === 'dineIn';

    const payment = await Database.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: data.method,
          status: data.status,
          provider: data.provider,
          transactionId: data.transactionId,
          gatewayResponse: data.gatewayResponse,
          processedById: data.processedById,
          restaurantId: data.restaurantId || order.restaurantId,
          processedAt,
          createdById: userId || null,
        },
        include: {
          order: true,
          processedBy: true,
          refunds: true,
          restaurant: true,
        },
      });

      const orderUpdateData: Prisma.OrderUpdateInput = {
        paymentStatus: data.status,
        ...(shouldFinalizeDineIn && { status: 'completed' }),
      };

      await tx.order.update({
        where: { id: data.orderId },
        data: orderUpdateData,
      });

      if (shouldFinalizeDineIn) {
        const reservation = await tx.reservation.findFirst({
          where: {
            customerId: order.customerId,
            restaurantId: order.restaurantId,
            status: { in: ['seated', 'confirmed'] },
          },
          orderBy: { reservationDate: 'desc' },
        });

        if (reservation) {
          await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: 'completed' },
          });
        }
      }

      return created;
    });

    return payment;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw new Error('Failed to create payment');
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (id: string) => {
  try {
    const payment = await Payment.findUnique({
      where: { id },
      include: {
        order: true,
        processedBy: true,
        refunds: true,
        restaurant: true,
      },
    });

    return payment;
  } catch (error) {
    console.error('Error getting payment by ID:', error);
    throw new Error('Failed to get payment');
  }
};

/**
 * Get all payments with filtering and pagination
 */
export const getPayments = async (query: PaymentQuery) => {
  try {
    const {
      orderId,
      restaurantId,
      method,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (method) {
      where.method = method;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [payments, total] = await Promise.all([
      Payment.findMany({
        where,
        include: {
          order: true,
          processedBy: true,
          refunds: true,
          restaurant: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Payment.count({ where }),
    ]);

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting payments:', error);
    throw new Error('Failed to get payments');
  }
};

/**
 * Update payment
 */
export const updatePayment = async (id: string, data: UpdatePayment, userId?: string | null) => {
  try {
    const processedAt =
      data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled'
        ? new Date()
        : data.processedAt;

    const payment = await Database.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          ...data,
          processedAt,
          updatedById: userId || undefined,
          updatedAt: new Date(),
        },
        include: {
          order: true,
          processedBy: true,
          refunds: true,
          restaurant: true,
        },
      });

      if (data.status) {
        const shouldFinalizeDineIn =
          data.status === 'completed' && updated.order?.orderType === 'dineIn';
        const orderUpdateData: Prisma.OrderUpdateInput = {
          paymentStatus: data.status,
          ...(shouldFinalizeDineIn && { status: 'completed' }),
        };

        await tx.order.update({
          where: { id: updated.orderId },
          data: orderUpdateData,
        });

        if (shouldFinalizeDineIn && updated.order?.customerId && updated.order?.restaurantId) {
          const reservation = await tx.reservation.findFirst({
            where: {
              customerId: updated.order.customerId,
              restaurantId: updated.order.restaurantId,
              status: { in: ['seated', 'confirmed'] },
            },
            orderBy: { reservationDate: 'desc' },
          });

          if (reservation) {
            await tx.reservation.update({
              where: { id: reservation.id },
              data: { status: 'completed' },
            });
          }
        }
      }

      return updated;
    });

    return payment;
  } catch (error) {
    console.error('Error updating payment:', error);
    throw new Error('Failed to update payment');
  }
};

/**
 * Delete payment
 */
export const deletePayment = async (id: string, userId?: string | null) => {
  try {
    // Check if payment has refunds
    const refunds = await Refund.count({
      where: { paymentId: id }
    });

    if (refunds > 0) {
      throw new Error('Cannot delete payment with existing refunds');
    }

    const payment = await Payment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Payment deleted successfully', data: payment };
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw new Error('Failed to delete payment');
  }
};

// =========================
// REFUND SERVICES
// =========================

/**
 * Create a new refund
 */
export const createRefund = async (data: CreateRefund, userId?: string | null) => {
  try {
    // Check if payment exists
    const payment = await Payment.findUnique({
      where: { id: data.paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if refund amount is valid
    if (data.amount > Number(payment.amount)) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    const refund = await Refund.create({
      data: {
        paymentId: data.paymentId,
        amount: data.amount,
        reason: data.reason,
        status: data.status,
        providerRef: data.providerRef,
        createdById: userId || null,
      },
      include: {
        payment: true,
      },
    });

    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Failed to create refund');
  }
};

/**
 * Get refund by ID
 */
export const getRefundById = async (id: string) => {
  try {
    const refund = await Refund.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    return refund;
  } catch (error) {
    console.error('Error getting refund by ID:', error);
    throw new Error('Failed to get refund');
  }
};

/**
 * Get all refunds with filtering and pagination
 */
export const getRefunds = async (query: RefundQuery) => {
  try {
    const {
      paymentId,
      status,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (paymentId) {
      where.paymentId = paymentId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [refunds, total] = await Promise.all([
      Refund.findMany({
        where,
        include: {
          payment: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Refund.count({ where }),
    ]);

    return {
      data: refunds,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting refunds:', error);
    throw new Error('Failed to get refunds');
  }
};

/**
 * Update refund
 */
export const updateRefund = async (id: string, data: UpdateRefund, userId?: string | null) => {
  try {
    const refund = await Refund.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
      },
      include: {
        payment: true,
      },
    });

    return refund;
  } catch (error) {
    console.error('Error updating refund:', error);
    throw new Error('Failed to update refund');
  }
};

/**
 * Delete refund
 */
export const deleteRefund = async (id: string, userId?: string | null) => {
  try {
    const refund = await Refund.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Refund deleted successfully', data: refund };
  } catch (error) {
    console.error('Error deleting refund:', error);
    throw new Error('Failed to delete refund');
  }
};

// =========================
// PAYMENT INTENT SERVICES
// =========================

/**
 * Create a new payment intent
 */
export const createPaymentIntent = async (data: CreatePaymentIntent, userId?: string | null) => {
  try {
    // Check if order exists
    const order = await Order.findUnique({
      where: { id: data.orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if payment intent already exists for this order
    const existingPaymentIntent = await PaymentIntent.findUnique({
      where: { orderId: data.orderId }
    });

    if (existingPaymentIntent) {
      throw new Error('Payment intent already exists for this order');
    }

    const paymentIntent = await PaymentIntent.create({
      data: {
        orderId: data.orderId,
        provider: data.provider,
        clientSecret: data.clientSecret,
        externalId: data.externalId,
        status: data.status,
        metadata: data.metadata,
        createdById: userId || null,
      },
      include: {
        order: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

/**
 * Get payment intent by ID
 */
export const getPaymentIntentById = async (id: string) => {
  try {
    const paymentIntent = await PaymentIntent.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error getting payment intent by ID:', error);
    throw new Error('Failed to get payment intent');
  }
};

/**
 * Get all payment intents with filtering and pagination
 */
export const getPaymentIntents = async (query: PaymentIntentQuery) => {
  try {
    const {
      orderId,
      provider,
      status,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (provider) {
      where.provider = provider;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [paymentIntents, total] = await Promise.all([
      PaymentIntent.findMany({
        where,
        include: {
          order: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      PaymentIntent.count({ where }),
    ]);

    return {
      data: paymentIntents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting payment intents:', error);
    throw new Error('Failed to get payment intents');
  }
};

/**
 * Update payment intent
 */
export const updatePaymentIntent = async (id: string, data: UpdatePaymentIntent, userId?: string | null) => {
  try {
    const paymentIntent = await PaymentIntent.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        order: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error updating payment intent:', error);
    throw new Error('Failed to update payment intent');
  }
};

/**
 * Delete payment intent
 */
export const deletePaymentIntent = async (id: string, userId?: string | null) => {
  try {
    const paymentIntent = await PaymentIntent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Payment intent deleted successfully', data: paymentIntent };
  } catch (error) {
    console.error('Error deleting payment intent:', error);
    throw new Error('Failed to delete payment intent');
  }
};

// =========================
// BULK OPERATION SERVICES
// =========================

/**
 * Bulk update order status
 */
export const bulkUpdateOrderStatus = async (data: BulkUpdateOrderStatus) => {
  try {
    const { orderIds, status, notes, changedByUserId } = data;

    // Validate all orders exist
    const orders = await Order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true },
    });

    if (orders.length !== orderIds.length) {
      throw new Error('One or more orders not found');
    }

    // Update orders
    await Order.updateMany({
      where: { id: { in: orderIds } },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Create status history for each order
    const historyData = orderIds.map(orderId => ({
      orderId,
      status,
      changedByUserId,
      notes,
    }));

    await OrderStatusHistory.createMany({
      data: historyData,
    });

    return { message: `${orderIds.length} orders status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating order status:', error);
    throw new Error('Failed to bulk update order status');
  }
};

/**
 * Bulk update order item cooking status
 */
export const bulkUpdateOrderItemCookingStatus = async (data: BulkUpdateOrderItemCookingStatus) => {
  try {
    const { orderItemIds, cookingStatus, notes } = data;

    // Validate all order items exist
    const orderItems = await OrderItem.findMany({
      where: { id: { in: orderItemIds } },
      select: { id: true },
    });

    if (orderItems.length !== orderItemIds.length) {
      throw new Error('One or more order items not found');
    }

    // Update order items
    await OrderItem.updateMany({
      where: { id: { in: orderItemIds } },
      data: {
        cookingStatus,
        ...(cookingStatus === 'ready' && { preparedAt: new Date() }),
        ...(cookingStatus === 'served' && { servedAt: new Date() }),
      },
    });

    return { message: `${orderItemIds.length} order items cooking status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating order item cooking status:', error);
    throw new Error('Failed to bulk update order item cooking status');
  }
};

/**
 * Bulk update payment status
 */
export const bulkUpdatePaymentStatus = async (data: BulkUpdatePaymentStatus) => {
  try {
    const { paymentIds, status, processedById } = data;

    // Validate all payments exist
    const payments = await Payment.findMany({
      where: { id: { in: paymentIds } },
      select: { id: true },
    });

    if (payments.length !== paymentIds.length) {
      throw new Error('One or more payments not found');
    }

    // Update payments
    await Payment.updateMany({
      where: { id: { in: paymentIds } },
      data: {
        status,
        processedById,
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { message: `${paymentIds.length} payments status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating payment status:', error);
    throw new Error('Failed to bulk update payment status');
  }
};

// =========================
// SPECIAL QUERY SERVICES
// =========================

/**
 * Get order statistics
 */
export const getOrderStatistics = async (query: OrderStatisticsQuery) => {
  try {
    const { restaurantId, startDate, endDate, groupBy } = query;

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const orders = await Order.findMany({
      where,
      select: {
        id: true,
        status: true,
        orderType: true,
        totalAmount: true,
        finalAmount: true,
        createdAt: true,
      },
    });

    // Group by date
    const groupedData: { [key: string]: any } = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      let dateKey: string = '';

      switch (groupBy) {
        case 'day':
          dateKey = date.toISOString().split('T')[0] || '';
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          dateKey = weekStart.toISOString().split('T')[0] || '';
          break;
        case 'month':
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          dateKey = date.toISOString().split('T')[0] || '';
      }

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          totalOrders: 0,
          totalRevenue: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          ordersByType: {
            dineIn: 0,
            takeaway: 0,
            delivery: 0,
          },
        };
      }

      groupedData[dateKey].totalOrders++;
      groupedData[dateKey].totalRevenue += Number(order.finalAmount);

      if (order.status === 'completed') {
        groupedData[dateKey].completedOrders++;
      } else if (order.status === 'cancelled') {
        groupedData[dateKey].cancelledOrders++;
      }

      groupedData[dateKey].ordersByType[order.orderType]++;
    });

    return Object.values(groupedData);
  } catch (error) {
    console.error('Error getting order statistics:', error);
    throw new Error('Failed to get order statistics');
  }
};

/**
 * Get payment summary
 */
export const getPaymentSummary = async (query: PaymentSummaryQuery) => {
  try {
    const { restaurantId, startDate, endDate, method } = query;

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (method) {
      where.method = method;
    }

    const payments = await Payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        createdAt: true,
      },
    });

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      successfulPayments: payments.filter(p => p.status === 'completed').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      paymentsByMethod: {} as { [key: string]: number },
      paymentsByStatus: {} as { [key: string]: number },
    };

    payments.forEach(payment => {
      // Count by method
      if (!summary.paymentsByMethod[payment.method]) {
        summary.paymentsByMethod[payment.method] = 0;
      }
      summary.paymentsByMethod[payment.method] = (summary.paymentsByMethod[payment.method] || 0) + 1;

      // Count by status
      if (!summary.paymentsByStatus[payment.status]) {
        summary.paymentsByStatus[payment.status] = 0;
      }
      summary.paymentsByStatus[payment.status] = (summary.paymentsByStatus[payment.status] || 0) + 1;
    });

    return summary;
  } catch (error) {
    console.error('Error getting payment summary:', error);
    throw new Error('Failed to get payment summary');
  }
};

/**
 * Get order revenue
 */
export const getOrderRevenue = async (query: OrderRevenueQuery) => {
  try {
    const { restaurantId, startDate, endDate, orderType } = query;

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'completed',
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    const orders = await Order.findMany({
      where,
      select: {
        id: true,
        orderType: true,
        totalAmount: true,
        finalAmount: true,
        discountAmount: true,
        taxAmount: true,
        serviceCharge: true,
        tipAmount: true,
        deliveryFee: true,
        createdAt: true,
      },
    });

    const revenue = {
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.finalAmount), 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + Number(order.finalAmount), 0) / orders.length : 0,
      totalDiscount: orders.reduce((sum, order) => sum + Number(order.discountAmount), 0),
      totalTax: orders.reduce((sum, order) => sum + Number(order.taxAmount), 0),
      totalServiceCharge: orders.reduce((sum, order) => sum + Number(order.serviceCharge), 0),
      totalTip: orders.reduce((sum, order) => sum + Number(order.tipAmount), 0),
      totalDeliveryFee: orders.reduce((sum, order) => sum + Number(order.deliveryFee), 0),
      revenueByType: {
        dineIn: 0,
        takeaway: 0,
        delivery: 0,
      },
    };

    orders.forEach(order => {
      revenue.revenueByType[order.orderType] += Number(order.finalAmount);
    });

    return revenue;
  } catch (error) {
    console.error('Error getting order revenue:', error);
    throw new Error('Failed to get order revenue');
  }
};

// =========================
// EXISTENCE CHECK SERVICES
// =========================

/**
 * Check if address exists
 */
export const checkAddressExists = async (addressId: string): Promise<boolean> => {
  try {
    const address = await Address.findUnique({
      where: { id: addressId },
      select: { id: true },
    });
    return !!address;
  } catch (error) {
    console.error('Error checking address existence:', error);
    return false;
  }
};

/**
 * Check if menu item exists
 */
export const checkMenuItemExists = async (menuItemId: string): Promise<boolean> => {
  try {
    const menuItem = await MenuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true },
    });
    return !!menuItem;
  } catch (error) {
    console.error('Error checking menu item existence:', error);
    return false;
  }
};

/**
 * Check if option exists
 */
export const checkOptionExists = async (optionId: string): Promise<boolean> => {
  try {
    const option = await Option.findUnique({
      where: { id: optionId },
      select: { id: true },
    });
    return !!option;
  } catch (error) {
    console.error('Error checking option existence:', error);
    return false;
  }
};

/**
 * Check if order exists
 */
export const checkOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    const order = await Order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    return !!order;
  } catch (error) {
    console.error('Error checking order existence:', error);
    return false;
  }
};

/**
 * Check if order item exists
 */
export const checkOrderItemExists = async (orderItemId: string): Promise<boolean> => {
  try {
    const orderItem = await OrderItem.findUnique({
      where: { id: orderItemId },
      select: { id: true },
    });
    return !!orderItem;
  } catch (error) {
    console.error('Error checking order item existence:', error);
    return false;
  }
};

/**
 * Check if payment exists
 */
export const checkPaymentExists = async (paymentId: string): Promise<boolean> => {
  try {
    const payment = await Payment.findUnique({
      where: { id: paymentId },
      select: { id: true },
    });
    return !!payment;
  } catch (error) {
    console.error('Error checking payment existence:', error);
    return false;
  }
};

/**
 * Check if payment intent exists
 */
export const checkPaymentIntentExists = async (paymentIntentId: string): Promise<boolean> => {
  try {
    const paymentIntent = await PaymentIntent.findUnique({
      where: { id: paymentIntentId },
      select: { id: true },
    });
    return !!paymentIntent;
  } catch (error) {
    console.error('Error checking payment intent existence:', error);
    return false;
  }
};
