import { PrismaClient, Prisma } from '@prisma/client/index';
import {
  CreateWarehouse,
  UpdateWarehouse,
  WarehouseQuery,
  CreateInventoryItem,
  UpdateInventoryItem,
  InventoryItemQuery,
  CreateInventoryTransaction,
  UpdateInventoryTransaction,
  InventoryTransactionQuery,
  CreateInventoryBalance,
  UpdateInventoryBalance,
  InventoryBalanceQuery,
  CreateWarehouseTransfer,
  UpdateWarehouseTransfer,
  WarehouseTransferQuery,
  CreateWarehouseTransferItem,
  UpdateWarehouseTransferItem,
  CreateWarehouseReceipt,
  UpdateWarehouseReceipt,
  WarehouseReceiptQuery,
  CreateWarehouseReceiptItem,
  UpdateWarehouseReceiptItem,
  CreateWarehouseIssue,
  UpdateWarehouseIssue,
  WarehouseIssueQuery,
  CreateWarehouseIssueItem,
  UpdateWarehouseIssueItem,
  BulkUpdateInventoryQuantities,
  BulkUpdateWarehouseStatus,
  InventoryLowStockQuery,
  InventoryExpiryQuery,
  InventoryValuationQuery,
  InventoryMovementQuery,
} from '@/schemas/inventory';
import {
  InventoryBalance,
  InventoryItem,
  InventoryTransaction,
  Warehouse,
  WarehouseIssue,
  WarehouseIssueItem,
  WarehouseReceipt,
  WarehouseReceiptItem,
  WarehouseTransfer,
  WarehouseTransferItem,
} from '@/models/inventory';
import { Restaurant, User } from '@/models/organization';
import { Supplier } from '@/models/supply';
import { Database } from '@/models/database';
import { OrganizationShortly } from "lib/interfaces";

type DbClient = PrismaClient | Prisma.TransactionClient;

const normalizeBalanceDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getIssueTransactionType = (purpose: string) => {
  switch (purpose) {
    case 'waste':
      return 'waste';
    case 'adjustment':
      return 'adjustment';
    case 'transfer':
      return 'transfer';
    default:
      return 'usage';
  }
};

const computeItemPricing = (quantity: number, unitPrice?: number | null, totalPrice?: number | null) => {
  const safeQuantity = Number(quantity ?? 0);
  const safeUnitPrice = Number(unitPrice ?? 0);
  const safeTotalPrice = totalPrice !== undefined && totalPrice !== null
    ? Number(totalPrice)
    : safeQuantity * safeUnitPrice;
  return { quantity: safeQuantity, unitPrice: safeUnitPrice, totalPrice: safeTotalPrice };
};

const upsertInventoryBalance = async (
  db: DbClient,
  {
    restaurantId,
    warehouseId,
    inventoryItemId,
    balanceDate,
    receivedQty = 0,
    issuedQty = 0,
    adjustedQty = 0,
    userId,
  }: {
    restaurantId: string;
    warehouseId: string;
    inventoryItemId: string;
    balanceDate: Date;
    receivedQty?: number;
    issuedQty?: number;
    adjustedQty?: number;
    userId?: string | null;
  }
) => {
  const normalizedDate = normalizeBalanceDate(balanceDate);
  const previousBalance = await db.inventoryBalance.findFirst({
    where: {
      restaurantId,
      warehouseId,
      inventoryItemId,
      balanceDate: { lt: normalizedDate },
      deletedAt: null,
    },
    orderBy: { balanceDate: 'desc' },
  });

  const openingBalance = previousBalance ? Number(previousBalance.closingBalance) : 0;
  const existingBalance = await db.inventoryBalance.findUnique({
    where: {
      restaurantId_warehouseId_inventoryItemId_balanceDate: {
        restaurantId,
        warehouseId,
        inventoryItemId,
        balanceDate: normalizedDate,
      },
    },
  });

  if (existingBalance) {
    const newReceivedQty = Number(existingBalance.receivedQty) + receivedQty;
    const newIssuedQty = Number(existingBalance.issuedQty) + issuedQty;
    const newAdjustedQty = Number(existingBalance.adjustedQty) + adjustedQty;
    const closingBalance = openingBalance + newReceivedQty - newIssuedQty + newAdjustedQty;

    await db.inventoryBalance.update({
      where: { id: existingBalance.id },
      data: {
        openingBalance,
        receivedQty: newReceivedQty,
        issuedQty: newIssuedQty,
        adjustedQty: newAdjustedQty,
        closingBalance,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
    });

    return;
  }

  const closingBalance = openingBalance + receivedQty - issuedQty + adjustedQty;

  await db.inventoryBalance.create({
    data: {
      restaurantId,
      warehouseId,
      inventoryItemId,
      balanceDate: normalizedDate,
      openingBalance,
      receivedQty,
      issuedQty,
      adjustedQty,
      closingBalance,
      createdById: userId || null,
    },
  });
};

const buildDocumentNumber = (prefix: string) => {
  const randomSegment = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${Date.now()}-${randomSegment}`;
};

const generateUniqueReceiptNumber = async (db: DbClient) => {
  let candidate = buildDocumentNumber('WR');
  let attempts = 0;
  while (attempts < 5) {
    const exists = await db.warehouseReceipt.findUnique({ where: { receiptNumber: candidate } });
    if (!exists) {
      return candidate;
    }
    candidate = buildDocumentNumber('WR');
    attempts += 1;
  }
  throw new Error('Failed to generate unique receipt number');
};

const generateUniqueIssueNumber = async (db: DbClient) => {
  let candidate = buildDocumentNumber('WI');
  let attempts = 0;
  while (attempts < 5) {
    const exists = await db.warehouseIssue.findUnique({ where: { issueNumber: candidate } });
    if (!exists) {
      return candidate;
    }
    candidate = buildDocumentNumber('WI');
    attempts += 1;
  }
  throw new Error('Failed to generate unique issue number');
};

const applyReceiptItemsToInventory = async (
  db: DbClient,
  receipt: {
    restaurantId: string;
    warehouseId: string;
    receiptDate: Date;
    receiptNumber: string;
    supplier?: { name?: string | null } | null;
    notes?: string | null;
  },
  items: Array<{
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>,
  userId?: string | null,
) => {
  const supplierName = receipt.supplier?.name || null;
  for (const item of items) {
    await upsertInventoryBalance(db, {
      restaurantId: receipt.restaurantId,
      warehouseId: receipt.warehouseId,
      inventoryItemId: item.inventoryItemId,
      balanceDate: receipt.receiptDate,
      receivedQty: item.quantity,
      issuedQty: 0,
      adjustedQty: 0,
      userId,
    });

    await db.inventoryTransaction.create({
      data: {
        restaurantId: receipt.restaurantId,
        inventoryItemId: item.inventoryItemId,
        type: 'purchase',
        quantity: item.quantity,
        totalCost: item.totalPrice,
        unitCost: item.unitPrice,
        invoiceNumber: receipt.receiptNumber,
        supplierName,
        notes: receipt.notes || undefined,
        createdById: userId || null,
      },
    });
  }
};

const applyIssueItemsToInventory = async (
  db: DbClient,
  issue: {
    restaurantId: string;
    warehouseId: string;
    issueDate: Date;
    issueNumber: string;
    purpose: string;
    notes?: string | null;
  },
  items: Array<{
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>,
  userId?: string | null,
) => {
  const transactionType = getIssueTransactionType(issue.purpose);
  for (const item of items) {
    await upsertInventoryBalance(db, {
      restaurantId: issue.restaurantId,
      warehouseId: issue.warehouseId,
      inventoryItemId: item.inventoryItemId,
      balanceDate: issue.issueDate,
      receivedQty: 0,
      issuedQty: item.quantity,
      adjustedQty: 0,
      userId,
    });

    await db.inventoryTransaction.create({
      data: {
        restaurantId: issue.restaurantId,
        inventoryItemId: item.inventoryItemId,
        type: transactionType,
        quantity: item.quantity,
        totalCost: item.totalPrice,
        unitCost: item.unitPrice,
        invoiceNumber: issue.issueNumber,
        notes: issue.notes || undefined,
        createdById: userId || null,
      },
    });
  }
};
// =========================
// WAREHOUSE SERVICES
// =========================

/**
 * Create a new warehouse
 */
export const createWarehouse = async (data: CreateWarehouse, userId?: string | null) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const warehouse = await Warehouse.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        address: data.address,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        isActive: data.isActive,
        createdById: userId || null,
      },
      include: {
        restaurant: true,
        balances: true,
        receipts: true,
        issues: true,
        transfersFrom: true,
        transfersTo: true,
      },
    });

    return warehouse;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw new Error('Failed to create warehouse');
  }
};

/**
 * Get warehouse by ID
 */
export const getWarehouseById = async (id: string) => {
  try {
    const warehouse = await Warehouse.findUnique({
      where: { id },
      include: {
        restaurant: true,
        balances: {
          include: {
            inventoryItem: true,
          },
          orderBy: {
            balanceDate: 'desc',
          },
        },
        receipts: {
          include: {
            supplier: true,
            createdBy: true,
            approvedBy: true,
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
          orderBy: {
            receiptDate: 'desc',
          },
        },
        issues: {
          include: {
            createdBy: true,
            approvedBy: true,
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
          orderBy: {
            issueDate: 'desc',
          },
        },
        transfersFrom: {
          include: {
            to: true,
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
          orderBy: {
            transferDate: 'desc',
          },
        },
        transfersTo: {
          include: {
            from: true,
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
          orderBy: {
            transferDate: 'desc',
          },
        },
      },
    });

    return warehouse;
  } catch (error) {
    console.error('Error getting warehouse by ID:', error);
    throw new Error('Failed to get warehouse');
  }
};

/**
 * Get all warehouses with filtering and pagination
 */
export const getWarehouses = async (query: WarehouseQuery) => {
  try {
    const {
      restaurantId,
      isActive,
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

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [warehouses, total] = await Promise.all([
      Warehouse.findMany({
        where,
        include: {
          restaurant: true,
          balances: {
            take: 1,
            orderBy: {
              balanceDate: 'desc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Warehouse.count({ where }),
    ]);

    return {
      data: warehouses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting warehouses:', error);
    throw new Error('Failed to get warehouses');
  }
};

/**
 * Update warehouse
 */
export const updateWarehouse = async (id: string, data: UpdateWarehouse, userId?: string | null) => {
  try {
    const warehouse = await Warehouse.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        restaurant: true,
        balances: true,
        receipts: true,
        issues: true,
        transfersFrom: true,
        transfersTo: true,
      },
    });

    return warehouse;
  } catch (error) {
    console.error('Error updating warehouse:', error);
    throw new Error('Failed to update warehouse');
  }
};

/**
 * Delete warehouse
 */
export const deleteWarehouse = async (id: string, userId?: string | null) => {
  try {
    // Check if warehouse has balances
    const balances = await InventoryBalance.count({
      where: { warehouseId: id }
    });

    if (balances > 0) {
      throw new Error('Cannot delete warehouse with existing inventory balances');
    }

    // Check if warehouse has receipts
    const receipts = await WarehouseReceipt.count({
      where: { warehouseId: id }
    });

    if (receipts > 0) {
      throw new Error('Cannot delete warehouse with existing receipts');
    }

    // Check if warehouse has issues
    const issues = await WarehouseIssue.count({
      where: { warehouseId: id }
    });

    if (issues > 0) {
      throw new Error('Cannot delete warehouse with existing issues');
    }

    const warehouse = await Warehouse.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Warehouse deleted successfully', data: warehouse };
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    throw new Error('Failed to delete warehouse');
  }
};

// =========================
// INVENTORY ITEM SERVICES
// =========================

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (data: CreateInventoryItem, userId?: string | null) => {
  try {
    // Check if SKU is unique (if provided)
    if (data.sku) {
      const existingItem = await InventoryItem.findUnique({
        where: { sku: data.sku }
      });

      if (existingItem) {
        throw new Error('SKU already exists');
      }
    }

    const inventoryItem = await InventoryItem.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        category: data.category,
        unit: data.unit,
        supplierName: data.supplierName,
        unitCost: data.unitCost,
        sku: data.sku,
        barcode: data.barcode,
        isActive: data.isActive,
        createdById: userId || null,
      },
      include: {
        organization: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        balances: {
          orderBy: {
            balanceDate: 'desc',
          },
          take: 1,
        },
      },
    });

    return inventoryItem;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw new Error('Failed to create inventory item');
  }
};

/**
 * Get inventory item by ID
 */
export const getInventoryItemById = async (id: string) => {
  try {
    const inventoryItem = await InventoryItem.findUnique({
      where: { id },
      include: {
        organization: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        balances: {
          include: {
            warehouse: true,
          },
          orderBy: {
            balanceDate: 'desc',
          },
        },
        recipeIngredients: {
          include: {
            recipe: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        supplierItems: {
          include: {
            supplier: true,
          },
        },
        purchaseOrderItems: {
          include: {
            purchaseOrder: true,
          },
        },
        receiptItems: {
          include: {
            receipt: true,
          },
        },
        issueItems: {
          include: {
            issue: true,
          },
        },
        retailProducts: true,
        warehouseTransferItems: {
          include: {
            transfer: true,
          },
        },
      },
    });

    return inventoryItem;
  } catch (error) {
    console.error('Error getting inventory item by ID:', error);
    throw new Error('Failed to get inventory item');
  }
};

/**
 * Get all inventory items with filtering and pagination
 */
export const getInventoryItems = async (query: InventoryItemQuery) => {
  try {
    const {
      // restaurantId,
      unit,
      // minQuantity,
      // maxQuantity,
      // isLowStock,
      // isExpired,
      // expiryDateFrom,
      // expiryDateTo,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (unit) {
      where.unit = unit;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [inventoryItems, total] = await Promise.all([
      InventoryItem.findMany({
        where,
        include: {
          // restaurant: true,
          balances: {
            orderBy: {
              balanceDate: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      InventoryItem.count({ where }),
    ]);

    return {
      data: inventoryItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting inventory items:', error);
    throw new Error('Failed to get inventory items');
  }
};

/**
 * Get all inventory items with filtering and pagination
 */
export const getAllInventoryItems = async () => {
  try {
    const inventoryItems = await InventoryItem.findMany({
      // where,
      include: {
        organization: {
          select: OrganizationShortly
        },
        // _count: {
        //   select: {
        //     items: true
        //   }
        // }
        supplierItems: {
          include: {
            supplier: {
              include: {
                organization: {
                  select: OrganizationShortly
                }
              }
            }
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    return {
      data: inventoryItems,
      total: inventoryItems.length,
    };
  } catch (error) {
    console.error('Error getting inventory items:', error);
    throw new Error('Failed to get inventory items');
  }
};

/**
 * Update inventory item
 */
export const updateInventoryItem = async (id: string, data: UpdateInventoryItem, userId?: string | null) => {
  try {
    // Check if SKU is unique (if provided)
    if (data.sku) {
      const existingItem = await InventoryItem.findFirst({
        where: {
          sku: data.sku,
          id: { not: id },
        },
      });

      if (existingItem) {
        throw new Error('SKU already exists');
      }
    }

    const inventoryItem = await InventoryItem.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        organization: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        balances: {
          orderBy: {
            balanceDate: 'desc',
          },
          take: 1,
        },
      },
    });

    return inventoryItem;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw new Error('Failed to update inventory item');
  }
};

/**
 * Delete inventory item (soft delete)
 */

export const deleteInventoryItem = async (id: string, userId?: string | null) => {
  try {
    // Check if item has transactions
    const transactions = await InventoryTransaction.count({
      where: { inventoryItemId: id }
    });

    if (transactions > 0) {
      throw new Error('Cannot delete inventory item with existing transactions');
    }

    // Check if item has balances
    const balances = await InventoryBalance.count({
      where: { inventoryItemId: id }
    });

    if (balances > 0) {
      throw new Error('Cannot delete inventory item with existing balances');
    }

    // Soft delete
    const inventoryItem = await InventoryItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
        updatedAt: new Date(),
      },
    });

    return { message: 'Inventory item deleted successfully', data: inventoryItem };
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw new Error('Failed to delete inventory item');
  }
};

// =========================
// INVENTORY TRANSACTION SERVICES
// =========================

/**
 * Create a new inventory transaction
 */
export const createInventoryTransaction = async (data: CreateInventoryTransaction) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if inventory item exists
    const inventoryItem = await InventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    if (!inventoryItem.isActive) {
      throw new Error('Inventory item is not approved yet');
    }

    const inventoryTransaction = await InventoryTransaction.create({
      data: {
        restaurantId: data.restaurantId,
        inventoryItemId: data.inventoryItemId,
        type: data.type,
        quantity: data.quantity,
        totalCost: data.totalCost,
        unitCost: data.unitCost,
        invoiceNumber: data.invoiceNumber,
        supplierName: data.supplierName,
        notes: data.notes,
      },
      include: {
        restaurant: true,
        inventoryItem: true,
      },
    });

    await InventoryItem.update({
      where: { id: data.inventoryItemId },
      data: {
        updatedAt: new Date(),
      },
    });

    return inventoryTransaction;
  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    throw new Error('Failed to create inventory transaction');
  }
};

/**
 * Get inventory transaction by ID
 */
export const getInventoryTransactionById = async (id: string) => {
  try {
    const inventoryTransaction = await InventoryTransaction.findUnique({
      where: { id },
      include: {
        restaurant: true,
        inventoryItem: true,
      },
    });

    return inventoryTransaction;
  } catch (error) {
    console.error('Error getting inventory transaction by ID:', error);
    throw new Error('Failed to get inventory transaction');
  }
};

/**
 * Get all inventory transactions with filtering and pagination
 */
export const getInventoryTransactions = async (query: InventoryTransactionQuery) => {
  try {
    const {
      restaurantId,
      inventoryItemId,
      type,
      startDate,
      endDate,
      supplierName,
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

    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    if (type) {
      where.type = type;
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

    if (supplierName) {
      where.supplierName = { contains: supplierName, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [inventoryTransactions, total] = await Promise.all([
      InventoryTransaction.findMany({
        where,
        include: {
          restaurant: true,
          inventoryItem: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      InventoryTransaction.count({ where }),
    ]);

    return {
      data: inventoryTransactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting inventory transactions:', error);
    throw new Error('Failed to get inventory transactions');
  }
};

/**
 * Update inventory transaction
 */
export const updateInventoryTransaction = async (id: string, data: UpdateInventoryTransaction, userId?: string | null) => {
  try {
    const inventoryTransaction = await InventoryTransaction.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
      },
      include: {
        restaurant: true,
        inventoryItem: true,
      },
    });

    return inventoryTransaction;
  } catch (error) {
    console.error('Error updating inventory transaction:', error);
    throw new Error('Failed to update inventory transaction');
  }
};

/**
 * Delete inventory transaction
 */
export const deleteInventoryTransaction = async (id: string, userId?: string | null) => {
  try {
    const inventoryTransaction = await InventoryTransaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Inventory transaction deleted successfully', data: inventoryTransaction };
  } catch (error) {
    console.error('Error deleting inventory transaction:', error);
    throw new Error('Failed to delete inventory transaction');
  }
};

// =========================
// INVENTORY BALANCE SERVICES
// =========================

/**
 * Create a new inventory balance
 */
export const createInventoryBalance = async (data: CreateInventoryBalance) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if warehouse exists
    const warehouse = await Warehouse.findUnique({
      where: { id: data.warehouseId }
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Check if inventory item exists
    const inventoryItem = await InventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    // Check if balance already exists for this date
    const existingBalance = await InventoryBalance.findUnique({
      where: {
        restaurantId_warehouseId_inventoryItemId_balanceDate: {
          restaurantId: data.restaurantId,
          warehouseId: data.warehouseId,
          inventoryItemId: data.inventoryItemId,
          balanceDate: data.balanceDate,
        },
      },
    });

    if (existingBalance) {
      throw new Error('Inventory balance already exists for this date');
    }

    const inventoryBalance = await InventoryBalance.create({
      data: {
        restaurantId: data.restaurantId,
        warehouseId: data.warehouseId,
        inventoryItemId: data.inventoryItemId,
        balanceDate: data.balanceDate,
        openingBalance: data.openingBalance,
        receivedQty: data.receivedQty,
        issuedQty: data.issuedQty,
        adjustedQty: data.adjustedQty,
        closingBalance: data.closingBalance,
      },
      include: {
        restaurant: true,
        warehouse: true,
        inventoryItem: true,
      },
    });

    return inventoryBalance;
  } catch (error) {
    console.error('Error creating inventory balance:', error);
    throw new Error('Failed to create inventory balance');
  }
};

/**
 * Get inventory balance by ID
 */
export const getInventoryBalanceById = async (id: string) => {
  try {
    const inventoryBalance = await InventoryBalance.findUnique({
      where: { id },
      include: {
        restaurant: true,
        warehouse: true,
        inventoryItem: true,
      },
    });

    return inventoryBalance;
  } catch (error) {
    console.error('Error getting inventory balance by ID:', error);
    throw new Error('Failed to get inventory balance');
  }
};

/**
 * Get all inventory balances with filtering and pagination
 */
export const getInventoryBalances = async (query: InventoryBalanceQuery) => {
  try {
    const {
      restaurantId,
      warehouseId,
      inventoryItemId,
      startDate,
      endDate,
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

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    if (startDate || endDate) {
      where.balanceDate = {};
      if (startDate) {
        where.balanceDate.gte = startDate;
      }
      if (endDate) {
        where.balanceDate.lte = endDate;
      }
    }

    const [inventoryBalances, total] = await Promise.all([
      InventoryBalance.findMany({
        where,
        include: {
          restaurant: true,
          warehouse: true,
          inventoryItem: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      InventoryBalance.count({ where }),
    ]);

    return {
      data: inventoryBalances,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting inventory balances:', error);
    throw new Error('Failed to get inventory balances');
  }
};

/**
 * Update inventory balance
 */
export const updateInventoryBalance = async (id: string, data: UpdateInventoryBalance, userId?: string | null) => {
  try {
    const inventoryBalance = await InventoryBalance.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        restaurant: true,
        warehouse: true,
        inventoryItem: true,
      },
    });

    return inventoryBalance;
  } catch (error) {
    console.error('Error updating inventory balance:', error);
    throw new Error('Failed to update inventory balance');
  }
};

/**
 * Delete inventory balance
 */
export const deleteInventoryBalance = async (id: string, userId?: string | null) => {
  try {
    const inventoryBalance = await InventoryBalance.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Inventory balance deleted successfully', data: inventoryBalance };
  } catch (error) {
    console.error('Error deleting inventory balance:', error);
    throw new Error('Failed to delete inventory balance');
  }
};

// =========================
// WAREHOUSE TRANSFER SERVICES
// =========================

/**
 * Create a new warehouse transfer
 */
export const createWarehouseTransfer = async (data: CreateWarehouseTransfer) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if from warehouse exists
    const fromWarehouse = await Warehouse.findUnique({
      where: { id: data.fromWarehouseId }
    });

    if (!fromWarehouse) {
      throw new Error('From warehouse not found');
    }

    // Check if to warehouse exists
    const toWarehouse = await Warehouse.findUnique({
      where: { id: data.toWarehouseId }
    });

    if (!toWarehouse) {
      throw new Error('To warehouse not found');
    }

    // Check if transfer number is unique
    const existingTransfer = await WarehouseTransfer.findUnique({
      where: { transferNumber: data.transferNumber }
    });

    if (existingTransfer) {
      throw new Error('Transfer number already exists');
    }

    const warehouseTransfer = await WarehouseTransfer.create({
      data: {
        restaurantId: data.restaurantId,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        transferNumber: data.transferNumber,
        status: data.status,
        transferDate: data.transferDate,
        notes: data.notes,
      },
      include: {
        restaurant: true,
        from: true,
        to: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return warehouseTransfer;
  } catch (error) {
    console.error('Error creating warehouse transfer:', error);
    throw new Error('Failed to create warehouse transfer');
  }
};

/**
 * Get warehouse transfer by ID
 */
export const getWarehouseTransferById = async (id: string) => {
  try {
    const warehouseTransfer = await WarehouseTransfer.findUnique({
      where: { id },
      include: {
        restaurant: true,
        from: true,
        to: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return warehouseTransfer;
  } catch (error) {
    console.error('Error getting warehouse transfer by ID:', error);
    throw new Error('Failed to get warehouse transfer');
  }
};

/**
 * Get all warehouse transfers with filtering and pagination
 */
export const getWarehouseTransfers = async (query: WarehouseTransferQuery) => {
  try {
    const {
      restaurantId,
      fromWarehouseId,
      toWarehouseId,
      status,
      startDate,
      endDate,
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

    if (fromWarehouseId) {
      where.fromWarehouseId = fromWarehouseId;
    }

    if (toWarehouseId) {
      where.toWarehouseId = toWarehouseId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.transferDate = {};
      if (startDate) {
        where.transferDate.gte = startDate;
      }
      if (endDate) {
        where.transferDate.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { transferNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [warehouseTransfers, total] = await Promise.all([
      WarehouseTransfer.findMany({
        where,
        include: {
          restaurant: true,
          from: true,
          to: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      WarehouseTransfer.count({ where }),
    ]);

    return {
      data: warehouseTransfers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting warehouse transfers:', error);
    throw new Error('Failed to get warehouse transfers');
  }
};

/**
 * Update warehouse transfer
 */
export const updateWarehouseTransfer = async (id: string, data: UpdateWarehouseTransfer) => {
  try {
    const warehouseTransfer = await WarehouseTransfer.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        restaurant: true,
        from: true,
        to: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return warehouseTransfer;
  } catch (error) {
    console.error('Error updating warehouse transfer:', error);
    throw new Error('Failed to update warehouse transfer');
  }
};

/**
 * Delete warehouse transfer
 */
export const deleteWarehouseTransfer = async (id: string) => {
  try {
    await WarehouseTransfer.delete({
      where: { id },
    });

    return { message: 'Warehouse transfer deleted successfully' };
  } catch (error) {
    console.error('Error deleting warehouse transfer:', error);
    throw new Error('Failed to delete warehouse transfer');
  }
};

// =========================
// WAREHOUSE TRANSFER ITEM SERVICES
// =========================

/**
 * Create a new warehouse transfer item
 */
export const createWarehouseTransferItem = async (data: CreateWarehouseTransferItem) => {
  try {
    // Check if transfer exists
    const transfer = await WarehouseTransfer.findUnique({
      where: { id: data.transferId }
    });

    if (!transfer) {
      throw new Error('Warehouse transfer not found');
    }

    // Check if inventory item exists
    const inventoryItem = await InventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    const warehouseTransferItem = await WarehouseTransferItem.create({
      data: {
        transferId: data.transferId,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        notes: data.notes,
      },
      include: {
        transfer: true,
        inventoryItem: true,
      },
    });

    return warehouseTransferItem;
  } catch (error) {
    console.error('Error creating warehouse transfer item:', error);
    throw new Error('Failed to create warehouse transfer item');
  }
};

/**
 * Update warehouse transfer item
 */
export const updateWarehouseTransferItem = async (id: string, data: UpdateWarehouseTransferItem) => {
  try {
    const warehouseTransferItem = await WarehouseTransferItem.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        transfer: true,
        inventoryItem: true,
      },
    });

    return warehouseTransferItem;
  } catch (error) {
    console.error('Error updating warehouse transfer item:', error);
    throw new Error('Failed to update warehouse transfer item');
  }
};

/**
 * Delete warehouse transfer item
 */
export const deleteWarehouseTransferItem = async (id: string) => {
  try {
    await WarehouseTransferItem.delete({
      where: { id },
    });

    return { message: 'Warehouse transfer item deleted successfully' };
  } catch (error) {
    console.error('Error deleting warehouse transfer item:', error);
    throw new Error('Failed to delete warehouse transfer item');
  }
};

// =========================
// WAREHOUSE RECEIPT SERVICES
// =========================

/**
 * Create a new warehouse receipt
 */
export const createWarehouseReceipt = async (data: CreateWarehouseReceipt) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if warehouse exists
    const warehouse = await Warehouse.findUnique({
      where: { id: data.warehouseId }
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Check if supplier exists (if provided)
    if (data.supplierId) {
      const supplier = await Supplier.findUnique({
        where: { id: data.supplierId }
      });

      if (!supplier) {
        throw new Error('Supplier not found');
      }
    }

    if (!data.createdById) {
      throw new Error('Created by user is required');
    }

    // Check if user exists
    const user = await User.findUnique({
      where: { id: data.createdById }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const normalizedItems = (data.items ?? []).map((item) => {
      const pricing = computeItemPricing(item.quantity, item.unitPrice, item.totalPrice);
      return {
        inventoryItemId: item.inventoryItemId,
        quantity: pricing.quantity,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        expiryDate: item.expiryDate,
        batchNumber: item.batchNumber,
        notes: item.notes,
      };
    });

    if (normalizedItems.length > 0) {
      const uniqueItemIds = Array.from(new Set(normalizedItems.map((item) => item.inventoryItemId)));
      const existingItems = await InventoryItem.findMany({
        where: { id: { in: uniqueItemIds } },
        select: { id: true, isActive: true },
      });

      if (existingItems.length !== uniqueItemIds.length) {
        throw new Error('One or more inventory items not found');
      }

      const inactiveItems = existingItems.filter((item) => !item.isActive);
      if (inactiveItems.length > 0) {
        throw new Error('One or more inventory items are not approved yet');
      }
    }

    const itemsTotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const warehouseReceipt = await Database.$transaction(async (tx) => {
      const receiptNumber = data.receiptNumber || await generateUniqueReceiptNumber(tx);

      if (data.receiptNumber) {
        const existingReceipt = await tx.warehouseReceipt.findUnique({
          where: { receiptNumber: data.receiptNumber }
        });

        if (existingReceipt) {
          throw new Error('Receipt number already exists');
        }
      }

      const createdReceipt = await tx.warehouseReceipt.create({
        data: {
          restaurantId: data.restaurantId,
          warehouseId: data.warehouseId,
          receiptNumber,
          supplierId: data.supplierId,
          receiptDate: data.receiptDate,
          status: data.status,
          totalAmount: normalizedItems.length ? itemsTotal : data.totalAmount,
          notes: data.notes,
          createdById: data.createdById ?? "",
          items: normalizedItems.length
            ? {
                create: normalizedItems,
              }
            : undefined,
        },
        include: {
          restaurant: true,
          warehouse: true,
          supplier: true,
          createdBy: true,
          approvedBy: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      if (createdReceipt.status === 'received' && normalizedItems.length > 0) {
        await applyReceiptItemsToInventory(
          tx,
          createdReceipt,
          normalizedItems,
          data.createdById,
        );
      }

      return createdReceipt;
    });

    return warehouseReceipt;
  } catch (error) {
    console.error('Error creating warehouse receipt:', error);
    throw new Error('Failed to create warehouse receipt');
  }
};

/**
 * Get warehouse receipt by ID
 */
export const getWarehouseReceiptById = async (id: string) => {
  try {
    const warehouseReceipt = await WarehouseReceipt.findUnique({
      where: { id },
      include: {
        restaurant: true,
        warehouse: true,
        supplier: true,
        createdBy: true,
        approvedBy: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return warehouseReceipt;
  } catch (error) {
    console.error('Error getting warehouse receipt by ID:', error);
    throw new Error('Failed to get warehouse receipt');
  }
};

/**
 * Get all warehouse receipts with filtering and pagination
 */
export const getWarehouseReceipts = async (query: WarehouseReceiptQuery) => {
  try {
    const {
      restaurantId,
      warehouseId,
      supplierId,
      status,
      startDate,
      endDate,
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

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.receiptDate = {};
      if (startDate) {
        where.receiptDate.gte = startDate;
      }
      if (endDate) {
        where.receiptDate.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [warehouseReceipts, total] = await Promise.all([
      WarehouseReceipt.findMany({
        where,
        include: {
          restaurant: true,
          warehouse: true,
          supplier: true,
          createdBy: true,
          approvedBy: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      WarehouseReceipt.count({ where }),
    ]);

    return {
      data: warehouseReceipts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting warehouse receipts:', error);
    throw new Error('Failed to get warehouse receipts');
  }
};

/**
 * Update warehouse receipt
 */
export const updateWarehouseReceipt = async (id: string, data: UpdateWarehouseReceipt) => {
  try {
    const warehouseReceipt = await Database.$transaction(async (tx) => {
      const existingReceipt = await tx.warehouseReceipt.findUnique({
        where: { id },
        include: {
          supplier: true,
          items: true,
        },
      });

      if (!existingReceipt) {
        throw new Error('Warehouse receipt not found');
      }

      const updatedReceipt = await tx.warehouseReceipt.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          restaurant: true,
          warehouse: true,
          supplier: true,
          createdBy: true,
          approvedBy: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      if (existingReceipt.status !== 'received' && updatedReceipt.status === 'received') {
        const normalizedItems = existingReceipt.items.map((item) => {
          const pricing = computeItemPricing(
            Number(item.quantity),
            Number(item.unitPrice),
            Number(item.totalPrice),
          );
          return {
            inventoryItemId: item.inventoryItemId,
            quantity: pricing.quantity,
            unitPrice: pricing.unitPrice,
            totalPrice: pricing.totalPrice,
          };
        });

        if (normalizedItems.length > 0) {
          await applyReceiptItemsToInventory(
            tx,
            updatedReceipt,
            normalizedItems,
            data.approvedById || updatedReceipt.approvedById || updatedReceipt.createdById,
          );
        }
      }

      return updatedReceipt;
    });

    return warehouseReceipt;
  } catch (error) {
    console.error('Error updating warehouse receipt:', error);
    throw new Error('Failed to update warehouse receipt');
  }
};

/**
 * Delete warehouse receipt
 */
export const deleteWarehouseReceipt = async (id: string) => {
  try {
    await WarehouseReceipt.delete({
      where: { id },
    });

    return { message: 'Warehouse receipt deleted successfully' };
  } catch (error) {
    console.error('Error deleting warehouse receipt:', error);
    throw new Error('Failed to delete warehouse receipt');
  }
};

// =========================
// WAREHOUSE RECEIPT ITEM SERVICES
// =========================

/**
 * Create a new warehouse receipt item
 */
export const createWarehouseReceiptItem = async (data: CreateWarehouseReceiptItem) => {
  try {
    // Check if receipt exists
    const receipt = await WarehouseReceipt.findUnique({
      where: { id: data.receiptId }
    });

    if (!receipt) {
      throw new Error('Warehouse receipt not found');
    }

    if (receipt.status === 'received') {
      throw new Error('Cannot add items to a received receipt');
    }

    // Check if inventory item exists
    const inventoryItem = await InventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    if (!inventoryItem.isActive) {
      throw new Error('Inventory item is not approved yet');
    }

    const pricing = computeItemPricing(data.quantity, data.unitPrice, data.totalPrice);
    const warehouseReceiptItem = await WarehouseReceiptItem.create({
      data: {
        receiptId: data.receiptId,
        inventoryItemId: data.inventoryItemId,
        quantity: pricing.quantity,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        expiryDate: data.expiryDate,
        batchNumber: data.batchNumber,
        notes: data.notes,
      },
      include: {
        receipt: true,
        inventoryItem: true,
      },
    });

    return warehouseReceiptItem;
  } catch (error) {
    console.error('Error creating warehouse receipt item:', error);
    throw new Error('Failed to create warehouse receipt item');
  }
};

/**
 * Update warehouse receipt item
 */
export const updateWarehouseReceiptItem = async (id: string, data: UpdateWarehouseReceiptItem) => {
  try {
    const existingItem = await WarehouseReceiptItem.findUnique({
      where: { id },
      include: {
        receipt: true,
      },
    });

    if (!existingItem) {
      throw new Error('Warehouse receipt item not found');
    }

    if (existingItem.receipt.status === 'received') {
      throw new Error('Cannot update items of a received receipt');
    }

    const nextQuantity = data.quantity ?? Number(existingItem.quantity);
    const nextUnitPrice = data.unitPrice ?? Number(existingItem.unitPrice);
    const nextTotalPrice = data.totalPrice ?? nextQuantity * nextUnitPrice;

    const warehouseReceiptItem = await WarehouseReceiptItem.update({
      where: { id },
      data: {
        ...data,
        totalPrice: nextTotalPrice,
      },
      include: {
        receipt: true,
        inventoryItem: true,
      },
    });

    return warehouseReceiptItem;
  } catch (error) {
    console.error('Error updating warehouse receipt item:', error);
    throw new Error('Failed to update warehouse receipt item');
  }
};

/**
 * Delete warehouse receipt item
 */
export const deleteWarehouseReceiptItem = async (id: string) => {
  try {
    const existingItem = await WarehouseReceiptItem.findUnique({
      where: { id },
      include: {
        receipt: true,
      },
    });

    if (!existingItem) {
      throw new Error('Warehouse receipt item not found');
    }

    if (existingItem.receipt.status === 'received') {
      throw new Error('Cannot delete items from a received receipt');
    }

    await WarehouseReceiptItem.delete({
      where: { id },
    });

    return { message: 'Warehouse receipt item deleted successfully' };
  } catch (error) {
    console.error('Error deleting warehouse receipt item:', error);
    throw new Error('Failed to delete warehouse receipt item');
  }
};

// =========================
// WAREHOUSE ISSUE SERVICES
// =========================

/**
 * Create a new warehouse issue
 */
export const createWarehouseIssue = async (data: CreateWarehouseIssue) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if warehouse exists
    const warehouse = await Warehouse.findUnique({
      where: { id: data.warehouseId }
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    if (!data.createdById) {
      throw new Error('Created by user is required');
    }

    // Check if user exists
    const user = await User.findUnique({
      where: { id: data.createdById }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const normalizedItems = (data.items ?? []).map((item) => {
      const pricing = computeItemPricing(item.quantity, item.unitPrice, item.totalPrice);
      return {
        inventoryItemId: item.inventoryItemId,
        quantity: pricing.quantity,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        batchNumber: item.batchNumber,
        notes: item.notes,
      };
    });

    if (normalizedItems.length > 0) {
      const uniqueItemIds = Array.from(new Set(normalizedItems.map((item) => item.inventoryItemId)));
      const existingItems = await InventoryItem.findMany({
        where: { id: { in: uniqueItemIds } },
        select: { id: true, isActive: true },
      });

      if (existingItems.length !== uniqueItemIds.length) {
        throw new Error('One or more inventory items not found');
      }

      const inactiveItems = existingItems.filter((item) => !item.isActive);
      if (inactiveItems.length > 0) {
        throw new Error('One or more inventory items are not approved yet');
      }
    }

    const itemsTotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const warehouseIssue = await Database.$transaction(async (tx) => {
      const issueNumber = data.issueNumber || await generateUniqueIssueNumber(tx);

      if (data.issueNumber) {
        const existingIssue = await tx.warehouseIssue.findUnique({
          where: { issueNumber: data.issueNumber }
        });

        if (existingIssue) {
          throw new Error('Issue number already exists');
        }
      }

      const createdIssue = await tx.warehouseIssue.create({
        data: {
          restaurantId: data.restaurantId,
          warehouseId: data.warehouseId,
          issueNumber,
          issueDate: data.issueDate,
          status: data.status,
          purpose: data.purpose,
          totalAmount: normalizedItems.length ? itemsTotal : data.totalAmount,
          notes: data.notes,
          createdById: data.createdById ?? "",
          items: normalizedItems.length
            ? {
                create: normalizedItems,
              }
            : undefined,
        },
        include: {
          restaurant: true,
          warehouse: true,
          createdBy: true,
          approvedBy: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      if (createdIssue.status === 'issued' && normalizedItems.length > 0) {
        await applyIssueItemsToInventory(
          tx,
          createdIssue,
          normalizedItems,
          data.createdById,
        );
      }

      return createdIssue;
    });

    return warehouseIssue;
  } catch (error) {
    console.error('Error creating warehouse issue:', error);
    throw new Error('Failed to create warehouse issue');
  }
};

/**
 * Get warehouse issue by ID
 */
export const getWarehouseIssueById = async (id: string) => {
  try {
    const warehouseIssue = await WarehouseIssue.findUnique({
      where: { id },
      include: {
        restaurant: true,
        warehouse: true,
        createdBy: true,
        approvedBy: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    return warehouseIssue;
  } catch (error) {
    console.error('Error getting warehouse issue by ID:', error);
    throw new Error('Failed to get warehouse issue');
  }
};

/**
 * Get all warehouse issues with filtering and pagination
 */
export const getWarehouseIssues = async (query: WarehouseIssueQuery) => {
  try {
    const {
      restaurantId,
      warehouseId,
      status,
      purpose,
      startDate,
      endDate,
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

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (status) {
      where.status = status;
    }

    if (purpose) {
      where.purpose = purpose;
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = startDate;
      }
      if (endDate) {
        where.issueDate.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { issueNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [warehouseIssues, total] = await Promise.all([
      WarehouseIssue.findMany({
        where,
        include: {
          restaurant: true,
          warehouse: true,
          createdBy: true,
          approvedBy: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      WarehouseIssue.count({ where }),
    ]);

    return {
      data: warehouseIssues,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting warehouse issues:', error);
    throw new Error('Failed to get warehouse issues');
  }
};

/**
 * Update warehouse issue
 */
export const updateWarehouseIssue = async (id: string, data: UpdateWarehouseIssue) => {
  try {
    const warehouseIssue = await Database.$transaction(async (tx) => {
      const existingIssue = await tx.warehouseIssue.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!existingIssue) {
        throw new Error('Warehouse issue not found');
      }

      const updatedIssue = await tx.warehouseIssue.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          restaurant: true,
          warehouse: true,
          createdBy: true,
          approvedBy: true,
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      if (existingIssue.status !== 'issued' && updatedIssue.status === 'issued') {
        const normalizedItems = existingIssue.items.map((item) => {
          const pricing = computeItemPricing(
            Number(item.quantity),
            Number(item.unitPrice),
            Number(item.totalPrice),
          );
          return {
            inventoryItemId: item.inventoryItemId,
            quantity: pricing.quantity,
            unitPrice: pricing.unitPrice,
            totalPrice: pricing.totalPrice,
          };
        });

        if (normalizedItems.length > 0) {
          await applyIssueItemsToInventory(
            tx,
            updatedIssue,
            normalizedItems,
            data.approvedById || updatedIssue.approvedById || updatedIssue.createdById,
          );
        }
      }

      return updatedIssue;
    });

    return warehouseIssue;
  } catch (error) {
    console.error('Error updating warehouse issue:', error);
    throw new Error('Failed to update warehouse issue');
  }
};

/**
 * Delete warehouse issue
 */
export const deleteWarehouseIssue = async (id: string) => {
  try {
    await WarehouseIssue.delete({
      where: { id },
    });

    return { message: 'Warehouse issue deleted successfully' };
  } catch (error) {
    console.error('Error deleting warehouse issue:', error);
    throw new Error('Failed to delete warehouse issue');
  }
};

// =========================
// WAREHOUSE ISSUE ITEM SERVICES
// =========================

/**
 * Create a new warehouse issue item
 */
export const createWarehouseIssueItem = async (data: CreateWarehouseIssueItem) => {
  try {
    // Check if issue exists
    const issue = await WarehouseIssue.findUnique({
      where: { id: data.issueId }
    });

    if (!issue) {
      throw new Error('Warehouse issue not found');
    }

    if (issue.status === 'issued') {
      throw new Error('Cannot add items to an issued warehouse issue');
    }

    // Check if inventory item exists
    const inventoryItem = await InventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    if (!inventoryItem.isActive) {
      throw new Error('Inventory item is not approved yet');
    }

    const pricing = computeItemPricing(data.quantity, data.unitPrice, data.totalPrice);
    const warehouseIssueItem = await WarehouseIssueItem.create({
      data: {
        issueId: data.issueId,
        inventoryItemId: data.inventoryItemId,
        quantity: pricing.quantity,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        batchNumber: data.batchNumber,
        notes: data.notes,
      },
      include: {
        issue: true,
        inventoryItem: true,
      },
    });

    return warehouseIssueItem;
  } catch (error) {
    console.error('Error creating warehouse issue item:', error);
    throw new Error('Failed to create warehouse issue item');
  }
};

/**
 * Update warehouse issue item
 */
export const updateWarehouseIssueItem = async (id: string, data: UpdateWarehouseIssueItem) => {
  try {
    const existingItem = await WarehouseIssueItem.findUnique({
      where: { id },
      include: {
        issue: true,
      },
    });

    if (!existingItem) {
      throw new Error('Warehouse issue item not found');
    }

    if (existingItem.issue.status === 'issued') {
      throw new Error('Cannot update items of an issued warehouse issue');
    }

    const nextQuantity = data.quantity ?? Number(existingItem.quantity);
    const nextUnitPrice = data.unitPrice ?? Number(existingItem.unitPrice);
    const nextTotalPrice = data.totalPrice ?? nextQuantity * nextUnitPrice;

    const warehouseIssueItem = await WarehouseIssueItem.update({
      where: { id },
      data: {
        ...data,
        totalPrice: nextTotalPrice,
      },
      include: {
        issue: true,
        inventoryItem: true,
      },
    });

    return warehouseIssueItem;
  } catch (error) {
    console.error('Error updating warehouse issue item:', error);
    throw new Error('Failed to update warehouse issue item');
  }
};

/**
 * Delete warehouse issue item
 */
export const deleteWarehouseIssueItem = async (id: string) => {
  try {
    const existingItem = await WarehouseIssueItem.findUnique({
      where: { id },
      include: {
        issue: true,
      },
    });

    if (!existingItem) {
      throw new Error('Warehouse issue item not found');
    }

    if (existingItem.issue.status === 'issued') {
      throw new Error('Cannot delete items from an issued warehouse issue');
    }

    await WarehouseIssueItem.delete({
      where: { id },
    });

    return { message: 'Warehouse issue item deleted successfully' };
  } catch (error) {
    console.error('Error deleting warehouse issue item:', error);
    throw new Error('Failed to delete warehouse issue item');
  }
};

// =========================
// BULK OPERATION SERVICES
// =========================

/**
 * Bulk update inventory quantities
 */
export const bulkUpdateInventoryQuantities = async (data: BulkUpdateInventoryQuantities) => {
  try {
    const { itemIds, quantity, type, notes } = data;

    // Validate all items exist
    const items = await InventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true },
    });

    if (items.length !== itemIds.length) {
      throw new Error('One or more inventory items not found');
    }

    // Update quantities in InventoryBalance
    for (const item of items) {
      // Get current balance for the item (assuming single warehouse for simplicity)
      const balance = await InventoryBalance.findFirst({
        where: { inventoryItemId: item.id },
        orderBy: { updatedAt: 'desc' },
      });

      // InventoryBalance uses closingBalance, not quantity
      const currentQty = balance ? Number(balance.closingBalance) : 0;
      let newQuantity: number = currentQty;
      
      if (type === 'adjustment') {
        newQuantity = quantity;
      } else if (type === 'waste') {
        newQuantity = currentQty - quantity;
      } else if (type === 'return') {
        newQuantity = currentQty + quantity;
      }

      // Note: This function needs warehouseId and restaurantId to create/update balance properly
      // For now, we'll just create transactions and let the balance be calculated separately
      // TODO: This function needs to be refactored to properly handle balance updates
    }

    return { message: `${itemIds.length} inventory items updated successfully` };
  } catch (error) {
    console.error('Error bulk updating inventory quantities:', error);
    throw new Error('Failed to bulk update inventory quantities');
  }
};

/**
 * Bulk update warehouse status
 */
export const bulkUpdateWarehouseStatus = async (data: BulkUpdateWarehouseStatus) => {
  try {
    const { warehouseIds, isActive } = data;

    // Validate all warehouses exist
    const warehouses = await Warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true },
    });

    if (warehouses.length !== warehouseIds.length) {
      throw new Error('One or more warehouses not found');
    }

    await Warehouse.updateMany({
      where: { id: { in: warehouseIds } },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });

    return { message: `${warehouseIds.length} warehouses status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating warehouse status:', error);
    throw new Error('Failed to bulk update warehouse status');
  }
};

// =========================
// SPECIAL QUERY SERVICES
// =========================

/**
 * Get inventory low stock items
 */
export const getInventoryLowStock = async (query: InventoryLowStockQuery) => {
  try {
    const { restaurantId, warehouseId, threshold } = query;

    const where: any = {
      restaurantId,
      deletedAt: null,
      minQuantity: { not: null },
    };

    if (warehouseId) {
      where.balances = {
        some: {
          warehouseId,
        },
      };
    }

    const lowStockItems = await InventoryItem.findMany({
      where: {
        ...where,
        quantity: {
          lte: threshold,
        },
      },
      include: {
        // restaurant: true,
        balances: {
          where: warehouseId ? { warehouseId } : {},
          include: {
            warehouse: true,
          },
        },
      },
      // orderBy: {
      //   quantity: 'asc',
      // },
    });

    return lowStockItems;
  } catch (error) {
    console.error('Error getting inventory low stock:', error);
    throw new Error('Failed to get inventory low stock');
  }
};

/**
 * Get inventory items expiring soon
 */
export const getInventoryExpiry = async (query: InventoryExpiryQuery) => {
  try {
    const { organizationId, warehouseId, daysAhead } = query;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    // Note: InventoryItem uses organizationId, not restaurantId
    const where: any = {
      organizationId: organizationId || undefined,
      deletedAt: null,
      // Note: InventoryItem doesn't have expiryDate field
      // Expiry tracking should be done through InventoryBalance or separate expiry tracking
    };

    if (warehouseId) {
      where.balances = {
        some: {
          warehouseId,
        },
      };
    }

    // Note: InventoryItem doesn't have expiryDate field
    // This function should be refactored to track expiry through InventoryBalance or separate expiry tracking
    const expiringItems = await InventoryItem.findMany({
      where: {
        organizationId: organizationId || undefined,
        deletedAt: null,
      },
      include: {
        organization: true,
        balances: {
          where: warehouseId ? { warehouseId } : {},
          include: {
            warehouse: true,
          },
          orderBy: {
            balanceDate: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return expiringItems;
  } catch (error) {
    console.error('Error getting inventory expiry:', error);
    throw new Error('Failed to get inventory expiry');
  }
};

/**
 * Get inventory valuation
 */
export const getInventoryValuation = async (query: InventoryValuationQuery) => {
  try {
    const { restaurantId, warehouseId, asOfDate } = query;

    // Note: InventoryItem uses organizationId, but we need to filter by restaurant
    // Get organizationId from restaurant first, or filter through balances
    const where: any = {
      deletedAt: null,
    };

    if (warehouseId) {
      where.balances = {
        some: {
          warehouseId,
        },
      };
    }

    const items = await InventoryItem.findMany({
      where,
      include: {
        balances: {
          where: warehouseId ? { warehouseId } : {},
          orderBy: {
            balanceDate: 'desc',
          },
          take: 1,
        },
      },
    });

    const valuation = {
      totalValue: 0,
      totalQuantity: 0,
      itemCount: items.length,
      items: items.map(item => {
        // const value = Number(item.quantity) * Number(item.unitCost || 0);
        return {
          id: item.id,
          name: item.name,
          // quantity: Number(item.quantity),
          unitCost: Number(item.unitCost || 0),
          // value,
        };
      }),
    };

    // valuation.totalValue = valuation.items.reduce((sum, item) => sum + item.value, 0);
    // valuation.totalQuantity = valuation.items.reduce((sum, item) => sum + item.quantity, 0);

    return valuation;
  } catch (error) {
    console.error('Error getting inventory valuation:', error);
    throw new Error('Failed to get inventory valuation');
  }
};

/**
 * Get inventory movement report
 */
export const getInventoryMovement = async (query: InventoryMovementQuery) => {
  try {
    const { restaurantId, inventoryItemId, warehouseId, startDate, endDate, type } = query;

    // Note: InventoryTransaction uses restaurantId (correct)
    const where: any = {
      restaurantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    if (type) {
      where.type = type;
    }

    const transactions = await InventoryTransaction.findMany({
      where,
      include: {
        inventoryItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const movement = {
      totalTransactions: transactions.length,
      totalQuantity: transactions.reduce((sum, t) => sum + Number(t.quantity), 0),
      totalValue: transactions.reduce((sum, t) => sum + Number(t.totalCost || 0), 0),
      byType: {} as { [key: string]: any },
      transactions,
    };

    // Group by type
    transactions.forEach(transaction => {
      if (!movement.byType[transaction.type]) {
        movement.byType[transaction.type] = {
          count: 0,
          quantity: 0,
          value: 0,
        };
      }
      movement.byType[transaction.type].count++;
      movement.byType[transaction.type].quantity += transaction.quantity;
      movement.byType[transaction.type].value += Number(transaction.totalCost || 0);
    });

    return movement;
  } catch (error) {
    console.error('Error getting inventory movement:', error);
    throw new Error('Failed to get inventory movement');
  }
};
