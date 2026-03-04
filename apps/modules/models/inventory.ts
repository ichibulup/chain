import { prisma } from '@/lib/prisma';

export const Warehouse = prisma.warehouse
export const InventoryItem = prisma.inventoryItem
export const InventoryTransaction = prisma.inventoryTransaction
export const InventoryBalance = prisma.inventoryBalance
export const WarehouseTransfer = prisma.warehouseTransfer
export const WarehouseTransferItem = prisma.warehouseTransferItem
export const WarehouseReceipt = prisma.warehouseReceipt
export const WarehouseReceiptItem = prisma.warehouseReceiptItem
export const WarehouseIssue = prisma.warehouseIssue
export const WarehouseIssueItem = prisma.warehouseIssueItem
