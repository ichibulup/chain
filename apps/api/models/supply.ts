import { prisma } from '@/lib/prisma';

export const Supplier = prisma.supplier
export const SupplierItem = prisma.supplierItem
export const PurchaseOrder = prisma.purchaseOrder
export const PurchaseOrderItem = prisma.purchaseOrderItem
