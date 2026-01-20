import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const InventoryUnit = z.enum(['kg', 'gram', 'liter', 'ml', 'piece', 'box', 'bag', 'bottle', 'can', 'pack', 'dozen', 'case', 'carton', 'pallet', 'meter', 'cm', 'inch', 'foot', 'yard', 'gallon', 'quart', 'pint', 'cup', 'tablespoon', 'teaspoon', 'ounce', 'pound', 'ton', 'other']);
export const InventoryTransactionType = z.enum(['purchase', 'usage', 'adjustment', 'waste', 'return', 'transfer']);
export const WarehouseTransferStatus = z.enum(['draft', 'pending', 'approved', 'completed', 'cancelled']);
export const WarehouseReceiptStatus = z.enum(['draft', 'pending', 'approved', 'received', 'cancelled']);
export const WarehouseIssueStatus = z.enum(['draft', 'pending', 'approved', 'issued', 'cancelled']);
export const WarehouseIssuePurpose = z.enum(['cooking', 'waste', 'transfer', 'adjustment', 'sample', 'maintenance', 'other']);
export const AdjustmentType = z.enum(['adjustment', 'waste', 'return']);

// =========================
// WAREHOUSE SCHEMAS
// =========================

// Base Warehouse schema
export const WarehouseSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable(),
  contactName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Warehouse schema
export const CreateWarehouseSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1, 'Warehouse name is required').max(100, 'Warehouse name too long'),
  address: z.string().max(500, 'Address too long').optional(),
  contactName: z.string().max(100, 'Contact name too long').optional(),
  contactPhone: z.string().max(20, 'Contact phone too long').optional(),
  isActive: z.boolean().default(true),
});

// Update Warehouse schema
export const UpdateWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(100, 'Warehouse name too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  contactName: z.string().max(100, 'Contact name too long').optional(),
  contactPhone: z.string().max(20, 'Contact phone too long').optional(),
  isActive: z.boolean().optional(),
});

// Warehouse Query schema
export const WarehouseQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// INVENTORY ITEM SCHEMAS
// =========================

// Base InventoryItem schema
export const InventoryItemSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  unit: InventoryUnit,
  supplierName: z.string().nullable(),
  unitCost: z.number().min(0).nullable(),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  isActive: z.boolean().default(true),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create InventoryItem schema
export const CreateInventoryItemSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Item name is required').max(200, 'Item name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  unit: InventoryUnit.default('kg'),
  supplierName: z.string().max(200, 'Supplier name too long').optional(),
  unitCost: z.number().min(0, 'Unit cost cannot be negative').optional(),
  sku: z.string().max(100, 'SKU too long').optional(),
  barcode: z.string().max(100, 'Barcode too long').optional(),
  isActive: z.boolean().default(true),
});

// Update InventoryItem schema
export const UpdateInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200, 'Item name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  unit: InventoryUnit.optional(),
  supplierName: z.string().max(200, 'Supplier name too long').optional(),
  unitCost: z.number().min(0, 'Unit cost cannot be negative').optional(),
  sku: z.string().max(100, 'SKU too long').optional(),
  barcode: z.string().max(100, 'Barcode too long').optional(),
  isActive: z.boolean().optional(),
});

// InventoryItem Query schema
export const InventoryItemQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  category: z.string().optional(),
  unit: InventoryUnit.optional(),
  // minQuantity: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'category', 'unit', 'unitCost', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// INVENTORY TRANSACTION SCHEMAS
// =========================

// Base InventoryTransaction schema
export const InventoryTransactionSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  type: InventoryTransactionType,
  quantity: z.number(),
  totalCost: z.number().min(0).nullable(),
  unitCost: z.number().min(0).nullable(),
  invoiceNumber: z.string().nullable(),
  supplierName: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create InventoryTransaction schema
export const CreateInventoryTransactionSchema = z.object({
  restaurantId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  type: InventoryTransactionType,
  quantity: z.number(),
  totalCost: z.number().min(0, 'Total cost cannot be negative').optional(),
  unitCost: z.number().min(0, 'Unit cost cannot be negative').optional(),
  invoiceNumber: z.string().max(100, 'Invoice number too long').optional(),
  supplierName: z.string().max(200, 'Supplier name too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

// Update InventoryTransaction schema
export const UpdateInventoryTransactionSchema = z.object({
  type: InventoryTransactionType.optional(),
  quantity: z.number().optional(),
  totalCost: z.number().min(0, 'Total cost cannot be negative').optional(),
  unitCost: z.number().min(0, 'Unit cost cannot be negative').optional(),
  invoiceNumber: z.string().max(100, 'Invoice number too long').optional(),
  supplierName: z.string().max(200, 'Supplier name too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

// InventoryTransaction Query schema
export const InventoryTransactionQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  type: InventoryTransactionType.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  supplierName: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'type', 'quantity', 'totalCost']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// INVENTORY BALANCE SCHEMAS
// =========================

// Base InventoryBalance schema
export const InventoryBalanceSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  balanceDate: z.date(),
  openingBalance: z.number(),
  receivedQty: z.number().default(0),
  issuedQty: z.number().default(0),
  adjustedQty: z.number().default(0),
  closingBalance: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create InventoryBalance schema
export const CreateInventoryBalanceSchema = z.object({
  restaurantId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  balanceDate: z.date(),
  openingBalance: z.number(),
  receivedQty: z.number().min(0, 'Received quantity cannot be negative').default(0),
  issuedQty: z.number().min(0, 'Issued quantity cannot be negative').default(0),
  adjustedQty: z.number().min(0, 'Adjusted quantity cannot be negative').default(0),
  closingBalance: z.number(),
});

// Update InventoryBalance schema
export const UpdateInventoryBalanceSchema = z.object({
  openingBalance: z.number().optional(),
  receivedQty: z.number().min(0, 'Received quantity cannot be negative').optional(),
  issuedQty: z.number().min(0, 'Issued quantity cannot be negative').optional(),
  adjustedQty: z.number().min(0, 'Adjusted quantity cannot be negative').optional(),
  closingBalance: z.number().optional(),
});

// InventoryBalance Query schema
export const InventoryBalanceQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['balanceDate', 'closingBalance', 'createdAt']).default('balanceDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// WAREHOUSE TRANSFER SCHEMAS
// =========================

// Base WarehouseTransfer schema
export const WarehouseTransferSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  fromWarehouseId: z.string().uuid().min(1, "Vui lòng chọn kho xuất"),
  toWarehouseId: z.string().uuid().min(1, "Vui lòng chọn kho nhập"),
  transferNumber: z.string(),
  status: WarehouseTransferStatus.default('draft'),
  transferDate: z.date(),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),

  items: z.array(z.object({
    inventoryItemId: z.string().min(1, "Vui lòng chọn hàng hóa"),
    quantity: z.coerce.number().min(0.0001, "Số lượng phải lớn hơn 0"),
    notes: z.string().optional(),
  })).min(1, "Vui lòng thêm ít nhất một mặt hàng")
// }).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
//   message: "Kho nhập và kho xuất không được trùng nhau",
//   path: ["toWarehouseId"],
});

// Create WarehouseTransfer schema
export const CreateWarehouseTransferSchema = z.object({
  restaurantId: z.string().uuid(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  transferNumber: z.string().min(1, 'Transfer number is required').max(50, 'Transfer number too long'),
  status: WarehouseTransferStatus.default('draft'),
  transferDate: z.date(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

// Update WarehouseTransfer schema
export const UpdateWarehouseTransferSchema = z.object({
  status: WarehouseTransferStatus.default('draft'),
  transferDate: z.date().optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

// WarehouseTransfer Query schema
export const WarehouseTransferQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['transferDate', 'createdAt', 'updatedAt']).default('transferDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// WAREHOUSE TRANSFER ITEM SCHEMAS
// =========================

// Base WarehouseTransferItem schema
export const WarehouseTransferItemSchema = z.object({
  id: z.string().uuid(),
  transferId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number(),
  notes: z.string().nullable(),
});

// Create WarehouseTransferItem schema
export const CreateWarehouseTransferItemSchema = z.object({
  transferId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Update WarehouseTransferItem schema
export const UpdateWarehouseTransferItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// =========================
// WAREHOUSE RECEIPT SCHEMAS
// =========================

// Base WarehouseReceipt schema
export const WarehouseReceiptSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  warehouseId: z.string().uuid().min(1, "Vui lòng chọn kho"),
  receiptNumber: z.string(),
  supplierId: z.string().uuid().nullable().optional(),
  receiptDate: z.coerce.date(),
  status: WarehouseReceiptStatus,
  totalAmount: z.number().min(0),
  notes: z.string().nullable().optional(),
  createdById: z.string().uuid(),
  approvedById: z.string().uuid().nullable(),
  approvedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.coerce.date().nullable(),

  items: z.array(z.object({
    inventoryItemId: z.string().min(1, "Vui lòng chọn hàng hóa"),
    quantity: z.coerce.number().min(0.0001, "Số lượng phải lớn hơn 0"),
    unitPrice: z.coerce.number().min(0, "Đơn giá không được âm"),
    expiryDate: z.date().optional(),
    batchNumber: z.string().optional(),
    notes: z.string().optional(),
  })).min(1, "Vui lòng thêm ít nhất một mặt hàng")
});

const WarehouseReceiptItemInputSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').default(0),
  totalPrice: z.number().min(0, 'Total price cannot be negative').optional(),
  expiryDate: z.coerce.date().optional(),
  batchNumber: z.string().max(100, 'Batch number too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Create WarehouseReceipt schema
export const CreateWarehouseReceiptSchema = z.object({
  restaurantId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  receiptNumber: z.string().min(1, 'Receipt number is required').max(50, 'Receipt number too long').optional(),
  supplierId: z.string().uuid().optional(),
  receiptDate: z.coerce.date(),
  status: WarehouseReceiptStatus.default('draft'),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').default(0),
  notes: z.string().max(1000, 'Notes too long').optional(),
  createdById: z.string().uuid().optional(),
  items: z.array(WarehouseReceiptItemInputSchema).min(1, 'At least one item is required').optional(),
});

// Update WarehouseReceipt schema
export const UpdateWarehouseReceiptSchema = z.object({
  supplierId: z.string().uuid().optional(),
  receiptDate: z.coerce.date().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'received', 'cancelled']).optional(),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  approvedById: z.string().uuid().optional(),
  approvedAt: z.coerce.date().optional(),
});

// WarehouseReceipt Query schema
export const WarehouseReceiptQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'received', 'cancelled']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['receiptDate', 'createdAt', 'totalAmount']).default('receiptDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// WAREHOUSE RECEIPT ITEM SCHEMAS
// =========================

// Base WarehouseReceiptItem schema
export const WarehouseReceiptItemSchema = z.object({
  id: z.string().uuid(),
  receiptId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number(),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  expiryDate: z.coerce.date().nullable(),
  batchNumber: z.string().nullable(),
  notes: z.string().nullable(),
});

// Create WarehouseReceiptItem schema
export const CreateWarehouseReceiptItemSchema = z.object({
  receiptId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').default(0),
  totalPrice: z.number().min(0, 'Total price cannot be negative').optional(),
  expiryDate: z.coerce.date().optional(),
  batchNumber: z.string().max(100, 'Batch number too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Update WarehouseReceiptItem schema
export const UpdateWarehouseReceiptItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
  totalPrice: z.number().min(0, 'Total price cannot be negative').optional(),
  expiryDate: z.coerce.date().optional(),
  batchNumber: z.string().max(100, 'Batch number too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// =========================
// WAREHOUSE ISSUE SCHEMAS
// =========================

// Base WarehouseIssue schema
export const WarehouseIssueSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  warehouseId: z.string().uuid().min(1, "Vui lòng chọn kho"),
  issueNumber: z.string(),
  issueDate: z.coerce.date(),
  status: WarehouseIssueStatus,
  purpose: WarehouseIssuePurpose,
  totalAmount: z.number().min(0),
  notes: z.string().nullable().optional(),
  createdById: z.string().uuid(),
  approvedById: z.string().uuid().nullable(),
  approvedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.coerce.date().nullable(),

  items: z.array(z.object({
    inventoryItemId: z.string().min(1, "Vui lòng chọn hàng hóa"),
    quantity: z.coerce.number().min(0.0001, "Số lượng phải lớn hơn 0"),
    notes: z.string().optional(),
  })).min(1, "Vui lòng thêm ít nhất một mặt hàng")
});

const WarehouseIssueItemInputSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').default(0),
  totalPrice: z.number().min(0, 'Total price cannot be negative').optional(),
  batchNumber: z.string().max(100, 'Batch number too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Create WarehouseIssue schema
export const CreateWarehouseIssueSchema = z.object({
  restaurantId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  issueNumber: z.string().min(1, 'Issue number is required').max(50, 'Issue number too long').optional(),
  issueDate: z.coerce.date(),
  status: z.enum(['draft', 'pending', 'approved', 'issued', 'cancelled']).default('draft'),
  purpose: z.enum(['cooking', 'waste', 'transfer', 'adjustment', 'sample', 'maintenance', 'other']),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').default(0),
  notes: z.string().max(1000, 'Notes too long').optional(),
  createdById: z.string().uuid().optional(),
  items: z.array(WarehouseIssueItemInputSchema).min(1, 'At least one item is required').optional(),
});

// Update WarehouseIssue schema
export const UpdateWarehouseIssueSchema = z.object({
  issueDate: z.coerce.date().optional(),
  status: WarehouseIssueStatus.optional(),
  purpose: WarehouseIssuePurpose.optional(),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  approvedById: z.string().uuid().optional(),
  approvedAt: z.coerce.date().optional(),
});

// WarehouseIssue Query schema
export const WarehouseIssueQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  status: WarehouseIssueStatus.optional(),
  purpose: WarehouseIssuePurpose.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['issueDate', 'createdAt', 'totalAmount']).default('issueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// WAREHOUSE ISSUE ITEM SCHEMAS
// =========================

// Base WarehouseIssueItem schema
export const WarehouseIssueItemSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number(),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  batchNumber: z.string().nullable(),
  notes: z.string().nullable(),
});

// Create WarehouseIssueItem schema
export const CreateWarehouseIssueItemSchema = z.object({
  issueId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').default(0),
  totalPrice: z.number().min(0, 'Total price cannot be negative').optional(),
  batchNumber: z.string().max(100, 'Batch number too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Update WarehouseIssueItem schema
export const UpdateWarehouseIssueItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
  totalPrice: z.number().min(0, 'Total price cannot be negative').optional(),
  batchNumber: z.string().max(100, 'Batch number too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// =========================
// BULK OPERATION SCHEMAS
// =========================

// Bulk update inventory item quantities schema
export const BulkUpdateInventoryQuantitiesSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1, 'At least one item is required'),
  quantity: z.number(),
  type: z.enum(['adjustment', 'waste', 'return']),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Bulk update warehouse status schema
export const BulkUpdateWarehouseStatusSchema = z.object({
  warehouseIds: z.array(z.string().uuid()).min(1, 'At least one warehouse is required'),
  isActive: z.boolean(),
});

// =========================
// SPECIAL QUERY SCHEMAS
// =========================

// Inventory low stock query schema
export const InventoryLowStockQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  threshold: z.number().min(0).default(10),
});

// Inventory expiry query schema
export const InventoryExpiryQuerySchema = z.object({
  organizationId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  daysAhead: z.number().int().min(1).default(30),
});

// Inventory valuation query schema
export const InventoryValuationQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  asOfDate: z.date().optional(),
});

// Inventory movement query schema
export const InventoryMovementQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  inventoryItemId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.enum(['purchase', 'usage', 'adjustment', 'waste', 'return', 'transfer']).optional(),
});

// =========================
// EXPORT TYPE DEFINITIONS
// =========================

export type Warehouse = z.infer<typeof WarehouseSchema>;
export type CreateWarehouse = z.infer<typeof CreateWarehouseSchema>;
export type UpdateWarehouse = z.infer<typeof UpdateWarehouseSchema>;
export type WarehouseQuery = z.infer<typeof WarehouseQuerySchema>;

export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type CreateInventoryItem = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItem = z.infer<typeof UpdateInventoryItemSchema>;
export type InventoryItemQuery = z.infer<typeof InventoryItemQuerySchema>;

export type InventoryTransaction = z.infer<typeof InventoryTransactionSchema>;
export type CreateInventoryTransaction = z.infer<typeof CreateInventoryTransactionSchema>;
export type UpdateInventoryTransaction = z.infer<typeof UpdateInventoryTransactionSchema>;
export type InventoryTransactionQuery = z.infer<typeof InventoryTransactionQuerySchema>;

export type InventoryBalance = z.infer<typeof InventoryBalanceSchema>;
export type CreateInventoryBalance = z.infer<typeof CreateInventoryBalanceSchema>;
export type UpdateInventoryBalance = z.infer<typeof UpdateInventoryBalanceSchema>;
export type InventoryBalanceQuery = z.infer<typeof InventoryBalanceQuerySchema>;

export type WarehouseTransfer = z.infer<typeof WarehouseTransferSchema>;
export type CreateWarehouseTransfer = z.infer<typeof CreateWarehouseTransferSchema>;
export type UpdateWarehouseTransfer = z.infer<typeof UpdateWarehouseTransferSchema>;
export type WarehouseTransferQuery = z.infer<typeof WarehouseTransferQuerySchema>;

export type WarehouseTransferItem = z.infer<typeof WarehouseTransferItemSchema>;
export type CreateWarehouseTransferItem = z.infer<typeof CreateWarehouseTransferItemSchema>;
export type UpdateWarehouseTransferItem = z.infer<typeof UpdateWarehouseTransferItemSchema>;

export type WarehouseReceipt = z.infer<typeof WarehouseReceiptSchema>;
export type CreateWarehouseReceipt = z.infer<typeof CreateWarehouseReceiptSchema>;
export type UpdateWarehouseReceipt = z.infer<typeof UpdateWarehouseReceiptSchema>;
export type WarehouseReceiptQuery = z.infer<typeof WarehouseReceiptQuerySchema>;

export type WarehouseReceiptItem = z.infer<typeof WarehouseReceiptItemSchema>;
export type CreateWarehouseReceiptItem = z.infer<typeof CreateWarehouseReceiptItemSchema>;
export type UpdateWarehouseReceiptItem = z.infer<typeof UpdateWarehouseReceiptItemSchema>;

export type WarehouseIssue = z.infer<typeof WarehouseIssueSchema>;
export type CreateWarehouseIssue = z.infer<typeof CreateWarehouseIssueSchema>;
export type UpdateWarehouseIssue = z.infer<typeof UpdateWarehouseIssueSchema>;
export type WarehouseIssueQuery = z.infer<typeof WarehouseIssueQuerySchema>;

export type WarehouseIssueItem = z.infer<typeof WarehouseIssueItemSchema>;
export type CreateWarehouseIssueItem = z.infer<typeof CreateWarehouseIssueItemSchema>;
export type UpdateWarehouseIssueItem = z.infer<typeof UpdateWarehouseIssueItemSchema>;

export type BulkUpdateInventoryQuantities = z.infer<typeof BulkUpdateInventoryQuantitiesSchema>;
export type BulkUpdateWarehouseStatus = z.infer<typeof BulkUpdateWarehouseStatusSchema>;

export type InventoryLowStockQuery = z.infer<typeof InventoryLowStockQuerySchema>;
export type InventoryExpiryQuery = z.infer<typeof InventoryExpiryQuerySchema>;
export type InventoryValuationQuery = z.infer<typeof InventoryValuationQuerySchema>;
export type InventoryMovementQuery = z.infer<typeof InventoryMovementQuerySchema>;
