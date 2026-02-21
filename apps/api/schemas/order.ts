import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const OrderType = z.enum(['dineIn', 'takeaway', 'delivery']);
export const OrderStatus = z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']);
export const PaymentStatus = z.enum(['pending', 'completed', 'failed', 'processing', 'cancelled', 'refunded']);
export const CookingStatus = z.enum(['pending', 'preparing', 'cooking', 'ready', 'served', 'cancelled']);
export const PaymentMethod = z.enum(['cash', 'card', 'bankTransfer', 'momo', 'zalopay', 'viettelpay', 'vnpay', 'shopeepay', 'paypal']);
export const RefundStatus = z.enum(['processing', 'completed', 'failed', 'cancelled']);
export const PaymentIntentStatus = z.enum(['created', 'requiresAction', 'processing', 'succeeded', 'cancelled', 'failed']);
export const GroupByPeriod = z.enum(['day', 'week', 'month']);

// =========================
// ORDER SCHEMAS
// =========================

// Base Order schema
export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderCode: z.string(),
  restaurantId: z.string().uuid(),
  customerId: z.string().uuid(),
  addressId: z.string().uuid().nullable(),
  orderType: OrderType,
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  totalAmount: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  serviceCharge: z.number().min(0).default(0),
  tipAmount: z.number().min(0).default(0),
  deliveryFee: z.number().min(0).default(0),
  finalAmount: z.number().positive(),
  currency: z.string().default('VND'),
  estimatedTime: z.number().int().positive().nullable(),
  estimatedTimeReadyAt: z.date().nullable(),
  promisedAt: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  notes: z.string().nullable(),
  deliveryZoneId: z.string().uuid().nullable(),
  deliveryNotes: z.string().nullable(),
  deliveryRating: z.number().int().min(1).max(5).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Order schema
export const CreateOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  customerId: z.string().uuid(),
  addressId: z.string().uuid().optional(),
  orderType: OrderType.default('dineIn'),
  totalAmount: z.number().positive('Total amount must be positive'),
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').default(0),
  taxAmount: z.number().min(0, 'Tax amount cannot be negative').default(0),
  serviceCharge: z.number().min(0, 'Service charge cannot be negative').default(0),
  tipAmount: z.number().min(0, 'Tip amount cannot be negative').default(0),
  deliveryFee: z.number().min(0, 'Delivery fee cannot be negative').default(0),
  finalAmount: z.number().positive('Final amount must be positive'),
  currency: z.string().default('VND'),
  estimatedTime: z.number().int().positive('Estimated time must be positive').optional(),
  estimatedTimeReadyAt: z.date().optional(),
  promisedAt: z.date().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  deliveryZoneId: z.string().uuid().optional(),
  deliveryNotes: z.string().max(500, 'Delivery notes too long').optional(),
});

// Update Order schema
export const UpdateOrderSchema = z.object({
  status: OrderStatus.optional(),
  paymentStatus: PaymentStatus.optional(),
  totalAmount: z.number().positive('Total amount must be positive').optional(),
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional(),
  taxAmount: z.number().min(0, 'Tax amount cannot be negative').optional(),
  serviceCharge: z.number().min(0, 'Service charge cannot be negative').optional(),
  tipAmount: z.number().min(0, 'Tip amount cannot be negative').optional(),
  deliveryFee: z.number().min(0, 'Delivery fee cannot be negative').optional(),
  finalAmount: z.number().positive('Final amount must be positive').optional(),
  estimatedTime: z.number().int().positive('Estimated time must be positive').optional(),
  estimatedTimeReadyAt: z.date().optional(),
  promisedAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  deliveryNotes: z.string().max(500, 'Delivery notes too long').optional(),
  deliveryRating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
});

// Order Query schema
export const OrderQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  orderType: OrderType.optional(),
  status: OrderStatus.optional(),
  paymentStatus: PaymentStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'totalAmount', 'finalAmount', 'status', 'orderType']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// ORDER ITEM SCHEMAS
// =========================

// Base OrderItem schema
export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  cookingStatus: CookingStatus,
  preparedAt: z.date().nullable(),
  servedAt: z.date().nullable(),
  specialInstructions: z.string().nullable(),
  createdAt: z.date(),
});

// Create OrderItem schema
export const CreateOrderItemSchema = z.object({
  orderId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  totalPrice: z.number().positive('Total price must be positive'),
  cookingStatus: CookingStatus.default('pending'),
  specialInstructions: z.string().max(500, 'Special instructions too long').optional(),
});

// Update OrderItem schema
export const UpdateOrderItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive').optional(),
  unitPrice: z.number().positive('Unit price must be positive').optional(),
  totalPrice: z.number().positive('Total price must be positive').optional(),
  cookingStatus: CookingStatus.optional(),
  preparedAt: z.date().optional(),
  servedAt: z.date().optional(),
  specialInstructions: z.string().max(500, 'Special instructions too long').optional(),
});

// OrderItem Query schema
export const OrderItemQuerySchema = z.object({
  orderId: z.string().uuid().optional(),
  menuItemId: z.string().uuid().optional(),
  cookingStatus: CookingStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'cookingStatus', 'quantity', 'totalPrice']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// ORDER ITEM OPTION SCHEMAS
// =========================

// Base OrderItemOption schema
export const OrderItemOptionSchema = z.object({
  id: z.string().uuid(),
  orderItemId: z.string().uuid(),
  optionId: z.string().uuid(),
  priceDelta: z.number().default(0),
});

// Create OrderItemOption schema
export const CreateOrderItemOptionSchema = z.object({
  orderItemId: z.string().uuid(),
  optionId: z.string().uuid(),
  priceDelta: z.number().default(0),
});

// Update OrderItemOption schema
export const UpdateOrderItemOptionSchema = z.object({
  priceDelta: z.number().optional(),
});

// =========================
// ORDER STATUS HISTORY SCHEMAS
// =========================

// Base OrderStatusHistory schema
export const OrderStatusHistorySchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  status: OrderStatus,
  changedByUserId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});

// Create OrderStatusHistory schema
export const CreateOrderStatusHistorySchema = z.object({
  orderId: z.string().uuid(),
  status: OrderStatus,
  changedByUserId: z.string().uuid().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// OrderStatusHistory Query schema
export const OrderStatusHistoryQuerySchema = z.object({
  orderId: z.string().uuid().optional(),
  status: OrderStatus.optional(),
  changedByUserId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// PAYMENT SCHEMAS
// =========================

// Base Payment schema
export const PaymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('VND'),
  method: PaymentMethod,
  status: PaymentStatus,
  provider: z.string().nullable(),
  transactionId: z.string().nullable(),
  gatewayResponse: z.any().nullable(),
  processedAt: z.date().nullable(),
  processedById: z.string().uuid().nullable(),
  restaurantId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create Payment schema
export const CreatePaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('VND'),
  method: PaymentMethod,
  status: PaymentStatus.default('pending'),
  provider: z.string().max(100, 'Provider name too long').optional(),
  transactionId: z.string().max(100, 'Transaction ID too long').optional(),
  gatewayResponse: z.any().optional(),
  processedById: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
});

// Update Payment schema
export const UpdatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().optional(),
  method: PaymentMethod.optional(),
  status: PaymentStatus.optional(),
  provider: z.string().max(100, 'Provider name too long').optional(),
  transactionId: z.string().max(100, 'Transaction ID too long').optional(),
  gatewayResponse: z.any().optional(),
  processedAt: z.date().optional(),
  processedById: z.string().uuid().optional(),
});

// Payment Query schema
export const PaymentQuerySchema = z.object({
  orderId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  method: PaymentMethod.optional(),
  status: PaymentStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'processedAt', 'amount', 'status', 'method']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// REFUND SCHEMAS
// =========================

// Base Refund schema
export const RefundSchema = z.object({
  id: z.string().uuid(),
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().nullable(),
  status: RefundStatus,
  providerRef: z.string().nullable(),
  createdAt: z.date(),
  processedAt: z.date().nullable(),
});

// Create Refund schema
export const CreateRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().max(500, 'Reason too long').optional(),
  status: RefundStatus.default('processing'),
  providerRef: z.string().max(100, 'Provider reference too long').optional(),
});

// Update Refund schema
export const UpdateRefundSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  reason: z.string().max(500, 'Reason too long').optional(),
  status: z.enum(['processing', 'completed', 'failed', 'cancelled']).optional(),
  providerRef: z.string().max(100, 'Provider reference too long').optional(),
  processedAt: z.date().optional(),
});

// Refund Query schema
export const RefundQuerySchema = z.object({
  paymentId: z.string().uuid().optional(),
  status: z.enum(['processing', 'completed', 'failed', 'cancelled']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'processedAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// PAYMENT INTENT SCHEMAS
// =========================

// Base PaymentIntent schema
export const PaymentIntentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  provider: z.string(),
  clientSecret: z.string().nullable(),
  externalId: z.string().nullable(),
  status: PaymentIntentStatus,
  metadata: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create PaymentIntent schema
export const CreatePaymentIntentSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.string().min(1, 'Provider is required').max(50, 'Provider name too long'),
  clientSecret: z.string().max(200, 'Client secret too long').optional(),
  externalId: z.string().max(100, 'External ID too long').optional(),
  status: PaymentIntentStatus.default('created'),
  metadata: z.any().optional(),
});

// Update PaymentIntent schema
export const UpdatePaymentIntentSchema = z.object({
  clientSecret: z.string().max(200, 'Client secret too long').optional(),
  externalId: z.string().max(100, 'External ID too long').optional(),
  status: PaymentIntentStatus.optional(),
  metadata: z.any().optional(),
});

// PaymentIntent Query schema
export const PaymentIntentQuerySchema = z.object({
  orderId: z.string().uuid().optional(),
  provider: z.string().optional(),
  status: PaymentIntentStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// BULK OPERATION SCHEMAS
// =========================

// Bulk update order status schema
export const BulkUpdateOrderStatusSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, 'At least one order is required'),
  status: OrderStatus,
  notes: z.string().max(500, 'Notes too long').optional(),
  changedByUserId: z.string().uuid().optional(),
});

// Bulk update order item cooking status schema
export const BulkUpdateOrderItemCookingStatusSchema = z.object({
  orderItemIds: z.array(z.string().uuid()).min(1, 'At least one order item is required'),
  cookingStatus: CookingStatus,
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Bulk update payment status schema
export const BulkUpdatePaymentStatusSchema = z.object({
  paymentIds: z.array(z.string().uuid()).min(1, 'At least one payment is required'),
  status: PaymentStatus,
  processedById: z.string().uuid().optional(),
});

// =========================
// SPECIAL QUERY SCHEMAS
// =========================

// Order statistics query schema
export const OrderStatisticsQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  groupBy: GroupByPeriod.default('day'),
});

// Payment summary query schema
export const PaymentSummaryQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  method: PaymentMethod.optional(),
});

// Order revenue query schema
export const OrderRevenueQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  orderType: OrderType.optional(),
});

// =========================
// EXPORT TYPE DEFINITIONS
// =========================

export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;
export type OrderQuery = z.infer<typeof OrderQuerySchema>;

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>;
export type UpdateOrderItem = z.infer<typeof UpdateOrderItemSchema>;
export type OrderItemQuery = z.infer<typeof OrderItemQuerySchema>;

export type OrderItemOption = z.infer<typeof OrderItemOptionSchema>;
export type CreateOrderItemOption = z.infer<typeof CreateOrderItemOptionSchema>;
export type UpdateOrderItemOption = z.infer<typeof UpdateOrderItemOptionSchema>;

export type OrderStatusHistory = z.infer<typeof OrderStatusHistorySchema>;
export type CreateOrderStatusHistory = z.infer<typeof CreateOrderStatusHistorySchema>;
export type OrderStatusHistoryQuery = z.infer<typeof OrderStatusHistoryQuerySchema>;

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;
export type PaymentQuery = z.infer<typeof PaymentQuerySchema>;

export type Refund = z.infer<typeof RefundSchema>;
export type CreateRefund = z.infer<typeof CreateRefundSchema>;
export type UpdateRefund = z.infer<typeof UpdateRefundSchema>;
export type RefundQuery = z.infer<typeof RefundQuerySchema>;

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;
export type CreatePaymentIntent = z.infer<typeof CreatePaymentIntentSchema>;
export type UpdatePaymentIntent = z.infer<typeof UpdatePaymentIntentSchema>;
export type PaymentIntentQuery = z.infer<typeof PaymentIntentQuerySchema>;

export type BulkUpdateOrderStatus = z.infer<typeof BulkUpdateOrderStatusSchema>;
export type BulkUpdateOrderItemCookingStatus = z.infer<typeof BulkUpdateOrderItemCookingStatusSchema>;
export type BulkUpdatePaymentStatus = z.infer<typeof BulkUpdatePaymentStatusSchema>;

export type OrderStatisticsQuery = z.infer<typeof OrderStatisticsQuerySchema>;
export type PaymentSummaryQuery = z.infer<typeof PaymentSummaryQuerySchema>;
export type OrderRevenueQuery = z.infer<typeof OrderRevenueQuerySchema>;
