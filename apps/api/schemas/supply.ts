import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const SupplierStatus = z.enum(['active', 'inactive', 'suspended', 'blacklisted']);
export const PurchaseOrderStatus = z.enum(['draft', 'sent', 'confirmed', 'partiallyReceived', 'received', 'cancelled']);
export const PriceAdjustmentType = z.enum(['percentage', 'fixed']);
export const PerformanceMetric = z.enum(['deliveryTime', 'quality', 'price', 'reliability']);
export const GroupByOption = z.enum(['supplier', 'month', 'week', 'day']);
export const GroupByStatus = z.enum(['supplier', 'status', 'month', 'week']);
export const PaymentMethodSupply = z.enum(['cash', 'credit', 'bank_transfer', 'check']);
export const SendMethod = z.enum(['email', 'fax', 'phone', 'portal']);

// =========================
// SUPPLIER SCHEMAS
// =========================

// Base Supplier schema
export const SupplierSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: z.string(),
  contactPerson: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  taxCode: z.string().nullable(),
  paymentTerms: z.string().nullable(),
  rating: z.number().min(0).max(5).nullable(),
  status: SupplierStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Supplier schema
export const CreateSupplierSchema = z.object({
  organizationId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: z.string().min(1, 'Supplier name is required').max(200, 'Supplier name too long'),
  contactPerson: z.string().max(100, 'Contact person name too long').optional(),
  email: z.string().email('Invalid email format').max(100, 'Email too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  taxCode: z.string().max(50, 'Tax code too long').optional(),
  paymentTerms: z.string().max(200, 'Payment terms too long').optional(),
  rating: z.number().min(0).max(5).optional(),
  status: SupplierStatus.default('active'),
});

// Supplier registration schema (self-register with new organization)
export const SupplierRegistrationSchema = z.object({
  restaurantId: z.string().uuid(),
  organization: z.object({
    name: z.string().min(1, 'Organization name is required').max(100, 'Organization name too long'),
    code: z.string()
      .min(1, 'Organization code is required')
      .max(50, 'Organization code too long')
      .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
    description: z.string().max(500, 'Description too long').optional(),
    logoUrl: z.string().url('Invalid logo URL').optional(),
  }),
  supplier: CreateSupplierSchema.omit({
    organizationId: true,
    restaurantId: true,
    status: true,
  }),
});

export type SupplierRegistration = z.infer<typeof SupplierRegistrationSchema>;

// Update Supplier schema
export const UpdateSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(200, 'Supplier name too long').optional(),
  contactPerson: z.string().max(100, 'Contact person name too long').optional(),
  email: z.string().email('Invalid email format').max(100, 'Email too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  taxCode: z.string().max(50, 'Tax code too long').optional(),
  paymentTerms: z.string().max(200, 'Payment terms too long').optional(),
  rating: z.number().min(0).max(5).optional(),
  status: SupplierStatus.optional(),
});

// Supplier Query schema
export const SupplierQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  status: SupplierStatus.optional(),
  rating: z.number().min(0).max(5).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'rating', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// SUPPLIER ITEM SCHEMAS
// =========================

// Base SupplierItem schema
export const SupplierItemSchema = z.object({
  id: z.string().uuid(),
  supplierId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  supplierSku: z.string().nullable(),
  unitPrice: z.number().min(0),
  minOrderQty: z.number().min(0).nullable(),
  leadTimeDays: z.number().int().min(0).nullable(),
  isPreferred: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create SupplierItem schema
export const CreateSupplierItemSchema = z.object({
  supplierId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  supplierSku: z.string().max(100, 'Supplier SKU too long').optional(),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  minOrderQty: z.number().min(0, 'Min order quantity cannot be negative').optional(),
  leadTimeDays: z.number().int().min(0, 'Lead time days cannot be negative').optional(),
  isPreferred: z.boolean().default(false),
});

// Update SupplierItem schema
export const UpdateSupplierItemSchema = z.object({
  supplierSku: z.string().max(100, 'Supplier SKU too long').optional(),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
  minOrderQty: z.number().min(0, 'Min order quantity cannot be negative').optional(),
  leadTimeDays: z.number().int().min(0, 'Lead time days cannot be negative').optional(),
  isPreferred: z.boolean().optional(),
});

// SupplierItem Query schema
export const SupplierItemQuerySchema = z.object({
  supplierId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  isPreferred: z.boolean().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['unitPrice', 'leadTimeDays', 'createdAt', 'updatedAt']).default('unitPrice'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// PURCHASE ORDER SCHEMAS
// =========================

// Base PurchaseOrder schema
export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  supplierId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  orderNumber: z.string(),
  status: PurchaseOrderStatus,
  orderDate: z.coerce.date(),
  expectedDate: z.coerce.date().nullable(),
  receivedDate: z.coerce.date().nullable(),
  totalAmount: z.number().min(0),
  notes: z.string().nullable(),
  createdById: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

const PurchaseOrderItemInputSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  totalPrice: z.number().min(0, 'Total price cannot be negative').optional(),
  receivedQty: z.number().min(0, 'Received quantity cannot be negative').default(0),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Create PurchaseOrder schema
export const CreatePurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  orderNumber: z.string().min(1, 'Order number is required').max(50, 'Order number too long'),
  status: PurchaseOrderStatus.default('draft'),
  orderDate: z.coerce.date(),
  expectedDate: z.coerce.date().optional(),
  receivedDate: z.coerce.date().optional(),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').default(0),
  notes: z.string().max(1000, 'Notes too long').optional(),
  createdById: z.string().uuid().optional(),
  items: z.array(PurchaseOrderItemInputSchema).min(1, 'At least one item is required').optional(),
});

// Update PurchaseOrder schema
export const UpdatePurchaseOrderSchema = z.object({
  status: PurchaseOrderStatus.optional(),
  orderDate: z.coerce.date().optional(),
  expectedDate: z.coerce.date().optional(),
  receivedDate: z.coerce.date().optional(),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

// PurchaseOrder Query schema
export const PurchaseOrderQuerySchema = z.object({
  supplierId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  status: PurchaseOrderStatus.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  createdById: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['orderDate', 'expectedDate', 'totalAmount', 'createdAt']).default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// PURCHASE ORDER ITEM SCHEMAS
// =========================

// Base PurchaseOrderItem schema
export const PurchaseOrderItemSchema = z.object({
  id: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  receivedQty: z.number().min(0).default(0),
  notes: z.string().nullable(),
});

// Create PurchaseOrderItem schema
export const CreatePurchaseOrderItemSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  totalPrice: z.number().min(0, 'Total price cannot be negative'),
  receivedQty: z.number().min(0, 'Received quantity cannot be negative').default(0),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Update PurchaseOrderItem schema
export const UpdatePurchaseOrderItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
  totalPrice: z.number().min(0, 'Total price cannot be negative').optional(),
  receivedQty: z.number().min(0, 'Received quantity cannot be negative').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// PurchaseOrderItem Query schema
export const PurchaseOrderItemQuerySchema = z.object({
  purchaseOrderId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  minQuantity: z.number().min(0).optional(),
  maxQuantity: z.number().min(0).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['quantity', 'unitPrice', 'totalPrice']).default('quantity'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// BULK OPERATION SCHEMAS
// =========================

// Bulk update supplier status schema
export const BulkUpdateSupplierStatusSchema = z.object({
  supplierIds: z.array(z.string().uuid()).min(1, 'At least one supplier is required'),
  status: SupplierStatus,
});

// Bulk update purchase order status schema
export const BulkUpdatePurchaseOrderStatusSchema = z.object({
  purchaseOrderIds: z.array(z.string().uuid()).min(1, 'At least one purchase order is required'),
  status: PurchaseOrderStatus,
});

// Bulk update supplier item prices schema
export const BulkUpdateSupplierItemPricesSchema = z.object({
  supplierItemIds: z.array(z.string().uuid()).min(1, 'At least one supplier item is required'),
  priceAdjustment: z.number(),
  adjustmentType: PriceAdjustmentType,
  notes: z.string().max(500, 'Notes too long').optional(),
});

// =========================
// SPECIAL QUERY SCHEMAS
// =========================

// Supplier performance query schema
export const SupplierPerformanceQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  supplierId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  metrics: z.array(PerformanceMetric).optional(),
});

// Purchase order summary query schema
export const PurchaseOrderSummaryQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  supplierId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  groupBy: GroupByOption.default('month'),
});

// Supplier comparison query schema
export const SupplierComparisonQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  includeInactive: z.boolean().default(false),
});

// Purchase order analytics query schema
export const PurchaseOrderAnalyticsQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date(),
  groupBy: GroupByStatus.default('month'),
  includeItems: z.boolean().default(false),
});

// Supplier rating update schema
export const SupplierRatingUpdateSchema = z.object({
  supplierId: z.string().uuid(),
  rating: z.number().min(0).max(5),
  review: z.string().max(1000, 'Review too long').optional(),
  orderId: z.string().uuid().optional(),
});

// =========================
// SUPPLIER RELATIONSHIP SCHEMAS
// =========================

// Supplier contact update schema
export const SupplierContactUpdateSchema = z.object({
  supplierId: z.string().uuid(),
  contactPerson: z.string().max(100, 'Contact person name too long').optional(),
  email: z.string().email('Invalid email format').max(100, 'Email too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
});

// Supplier payment terms update schema
export const SupplierPaymentTermsUpdateSchema = z.object({
  supplierId: z.string().uuid(),
  paymentTerms: z.string().max(200, 'Payment terms too long'),
  creditLimit: z.number().min(0, 'Credit limit cannot be negative').optional(),
  paymentMethod: PaymentMethodSupply.optional(),
});

// =========================
// PURCHASE ORDER WORKFLOW SCHEMAS
// =========================

// Send purchase order schema
export const SendPurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  sendMethod: SendMethod.default('email'),
  recipientEmail: z.string().email('Invalid email format').optional(),
  message: z.string().max(1000, 'Message too long').optional(),
});

// Confirm purchase order schema
export const ConfirmPurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  expectedDate: z.date(),
  confirmationNotes: z.string().max(1000, 'Confirmation notes too long').optional(),
});

// Receive purchase order schema
export const ReceivePurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  receivedDate: z.date(),
  receivedItems: z.array(z.object({
    itemId: z.string().uuid(),
    receivedQty: z.number().positive('Received quantity must be positive'),
    qualityNotes: z.string().max(500, 'Quality notes too long').optional(),
  })),
  receivingNotes: z.string().max(1000, 'Receiving notes too long').optional(),
});

// Cancel purchase order schema
export const CancelPurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  reason: z.string().min(1, 'Cancellation reason is required').max(500, 'Reason too long'),
  notifySupplier: z.boolean().default(true),
});

// =========================
// EXPORT TYPE DEFINITIONS
// =========================

export type Supplier = z.infer<typeof SupplierSchema>;
export type CreateSupplier = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplier = z.infer<typeof UpdateSupplierSchema>;
export type SupplierQuery = z.infer<typeof SupplierQuerySchema>;

export type SupplierItem = z.infer<typeof SupplierItemSchema>;
export type CreateSupplierItem = z.infer<typeof CreateSupplierItemSchema>;
export type UpdateSupplierItem = z.infer<typeof UpdateSupplierItemSchema>;
export type SupplierItemQuery = z.infer<typeof SupplierItemQuerySchema>;

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export type CreatePurchaseOrder = z.infer<typeof CreatePurchaseOrderSchema>;
export type UpdatePurchaseOrder = z.infer<typeof UpdatePurchaseOrderSchema>;
export type PurchaseOrderQuery = z.infer<typeof PurchaseOrderQuerySchema>;

export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;
export type CreatePurchaseOrderItem = z.infer<typeof CreatePurchaseOrderItemSchema>;
export type UpdatePurchaseOrderItem = z.infer<typeof UpdatePurchaseOrderItemSchema>;
export type PurchaseOrderItemQuery = z.infer<typeof PurchaseOrderItemQuerySchema>;

export type BulkUpdateSupplierStatus = z.infer<typeof BulkUpdateSupplierStatusSchema>;
export type BulkUpdatePurchaseOrderStatus = z.infer<typeof BulkUpdatePurchaseOrderStatusSchema>;
export type BulkUpdateSupplierItemPrices = z.infer<typeof BulkUpdateSupplierItemPricesSchema>;

export type SupplierPerformanceQuery = z.infer<typeof SupplierPerformanceQuerySchema>;
export type PurchaseOrderSummaryQuery = z.infer<typeof PurchaseOrderSummaryQuerySchema>;
export type SupplierComparisonQuery = z.infer<typeof SupplierComparisonQuerySchema>;
export type PurchaseOrderAnalyticsQuery = z.infer<typeof PurchaseOrderAnalyticsQuerySchema>;
export type SupplierRatingUpdate = z.infer<typeof SupplierRatingUpdateSchema>;

export type SupplierContactUpdate = z.infer<typeof SupplierContactUpdateSchema>;
export type SupplierPaymentTermsUpdate = z.infer<typeof SupplierPaymentTermsUpdateSchema>;

export type SendPurchaseOrder = z.infer<typeof SendPurchaseOrderSchema>;
export type ConfirmPurchaseOrder = z.infer<typeof ConfirmPurchaseOrderSchema>;
export type ReceivePurchaseOrder = z.infer<typeof ReceivePurchaseOrderSchema>;
export type CancelPurchaseOrder = z.infer<typeof CancelPurchaseOrderSchema>;
