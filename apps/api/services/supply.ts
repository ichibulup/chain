import { Prisma } from '@prisma/client/index';
import {
  CreateSupplier,
  UpdateSupplier,
  SupplierQuery,
  CreateSupplierItem,
  UpdateSupplierItem,
  SupplierItemQuery,
  CreatePurchaseOrder,
  UpdatePurchaseOrder,
  PurchaseOrderQuery,
  CreatePurchaseOrderItem,
  UpdatePurchaseOrderItem,
  PurchaseOrderItemQuery,
  BulkUpdateSupplierStatus,
  BulkUpdatePurchaseOrderStatus,
  BulkUpdateSupplierItemPrices,
  SupplierPerformanceQuery,
  PurchaseOrderSummaryQuery,
  SupplierComparisonQuery,
  PurchaseOrderAnalyticsQuery,
  SupplierRatingUpdate,
  SupplierContactUpdate,
  SupplierPaymentTermsUpdate,
  SendPurchaseOrder,
  ConfirmPurchaseOrder,
  ReceivePurchaseOrder,
  CancelPurchaseOrder,
  SupplierRegistration,
} from '@/schemas/supply';
import {
  InventoryTransactionType,
  InventoryItemShortly,
  OrganizationRole,
  OrganizationShortly,
  PurchaseOrderStatus,
  RestaurantShortly,
  SupplierShortly,
  SupplierStatus,
  WarehouseReceiptStatus,
  WarehouseShortly,
  UserRole,
  UserShortly
} from '@/lib/interfaces';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  SupplierItem,
} from '@/models/supply';
import {
  InventoryItem,
  Warehouse,
  WarehouseReceipt,
} from '@/models/inventory';
import { Restaurant, User } from '@/models/organization';
import { Database } from '@/models/database';
import { createOrganization as createOrganizationService } from '@/services/organization';
import { updateUser as updateUserService } from '@/services/user';
import { generateReceiptCode, normalizeBalanceDate } from '@/lib/utils/generaters';

const computeItemPricing = (quantity: number, unitPrice?: number | null, totalPrice?: number | null) => {
  const safeQuantity = Number(quantity ?? 0);
  const safeUnitPrice = Number(unitPrice ?? 0);
  const safeTotalPrice = totalPrice !== undefined && totalPrice !== null
    ? Number(totalPrice)
    : safeQuantity * safeUnitPrice;
  return { quantity: safeQuantity, unitPrice: safeUnitPrice, totalPrice: safeTotalPrice };
};

const appendWorkflowNote = (original: string | null | undefined, note: string) => {
  const trimmed = (original || '').trim();
  if (!trimmed) {
    return note;
  }

  if (trimmed.includes(note)) {
    return trimmed;
  }

  return `${trimmed}\n${note}`;
};

const generateUniqueReceiptNumberForTx = async (
  tx: Prisma.TransactionClient,
  maxAttempts = 5,
) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generateReceiptCode();
    const existing = await tx.warehouseReceipt.findUnique({
      where: { receiptNumber: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Failed to generate unique receipt number for purchase order receipt');
};

const upsertReceiptInventoryBalance = async (
  tx: Prisma.TransactionClient,
  {
    restaurantId,
    warehouseId,
    inventoryItemId,
    balanceDate,
    receivedQty,
    userId,
  }: {
    restaurantId: string;
    warehouseId: string;
    inventoryItemId: string;
    balanceDate: Date;
    receivedQty: number;
    userId?: string | null;
  },
) => {
  const normalizedDate = normalizeBalanceDate(balanceDate);

  const previousBalance = await tx.inventoryBalance.findFirst({
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
  const existingBalance = await tx.inventoryBalance.findUnique({
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
    const nextReceivedQty = Number(existingBalance.receivedQty) + receivedQty;
    const nextIssuedQty = Number(existingBalance.issuedQty);
    const nextAdjustedQty = Number(existingBalance.adjustedQty);
    const closingBalance = openingBalance + nextReceivedQty - nextIssuedQty + nextAdjustedQty;

    await tx.inventoryBalance.update({
      where: { id: existingBalance.id },
      data: {
        openingBalance,
        receivedQty: nextReceivedQty,
        closingBalance,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
    });

    return;
  }

  await tx.inventoryBalance.create({
    data: {
      restaurantId,
      warehouseId,
      inventoryItemId,
      balanceDate: normalizedDate,
      openingBalance,
      receivedQty,
      issuedQty: 0,
      adjustedQty: 0,
      closingBalance: openingBalance + receivedQty,
      createdById: userId || null,
    },
  });
};

// =========================
// SUPPLIER SERVICES
// =========================

/**
 * Create a new supplier
 */
export const createSupplier = async (data: CreateSupplier, userId?: string | null) => {
  try {
    const supplier = await Database.$transaction(async (tx) => {
      const organization = await tx.organization.findUnique({
        where: { id: data.organizationId },
        select: { id: true, ownerId: true },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      const chainAdmins = await tx.organizationMembership.findMany({
        where: {
          organizationId: data.organizationId,
          role: OrganizationRole.admin,
        },
        select: { userId: true },
      });

      const adminIds = new Set<string>([
        organization.ownerId,
        ...chainAdmins.map((member) => member.userId),
      ]);

      const now = new Date();
      await Promise.all(
        Array.from(adminIds).map((adminId) =>
          tx.organizationMembership.upsert({
            where: {
              organizationId_userId: {
                organizationId: data.organizationId,
                userId: adminId,
              },
            },
            create: {
              organizationId: data.organizationId,
              userId: adminId,
              role: OrganizationRole.admin,
              joinedAt: now,
            },
            update: {
              role: OrganizationRole.admin,
            },
          })
        )
      );

      return tx.supplier.create({
        data: {
          organizationId: data.organizationId,
          name: data.name,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
          address: data.address,
          taxCode: data.taxCode,
          paymentTerms: data.paymentTerms,
          rating: data.rating,
          status: data.status,
          createdById: userId || null,
        },
        include: {
          organization: true,
          supplierItems: {
            include: {
              inventoryItem: {
                select: InventoryItemShortly
              },
            },
          },
          purchaseOrders: {
            orderBy: {
              orderDate: 'desc',
            },
            take: 5,
          },
          warehouseReceipts: {
            orderBy: {
              receiptDate: 'desc',
            },
            take: 5,
          },
        },
      });
    });

    return supplier;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw new Error('Failed to create supplier');
  }
};

/**
 * Supplier self-registration with new organization
 */
export const registerSupplier = async (data: SupplierRegistration, userId?: string | null) => {
  try {
    if (!userId) {
      throw new Error('User is required to register supplier');
    }

    const user = await User.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const organization = await createOrganizationService(
      {
        name: data.organization.name,
        code: data.organization.code,
        description: data.organization.description,
        logoUrl: data.organization.logoUrl,
        ownerId: userId,
      },
      userId
    );

    const supplier = await createSupplier(
      {
        organizationId: organization.id,
        name: data.supplier.name,
        contactPerson: data.supplier.contactPerson,
        email: data.supplier.email,
        phone: data.supplier.phone,
        address: data.supplier.address,
        taxCode: data.supplier.taxCode,
        paymentTerms: data.supplier.paymentTerms,
        rating: data.supplier.rating,
        status: SupplierStatus.inactive,
      },
      userId
    );

    if (user.role === UserRole.customer) {
      await updateUserService(userId, { role: UserRole.supplier });
    }

    return {
      organization,
      supplier,
    };
  } catch (error) {
    console.error('Error registering supplier:', error);
    throw new Error('Failed to register supplier');
  }
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id: string) => {
  try {
    const supplier = await Supplier.findUnique({
      where: { id },
      include: {
        organization: {
          select: OrganizationShortly
        },
        supplierItems: {
          include: {
            inventoryItem: {
                select: InventoryItemShortly
              },
          },
          orderBy: {
            unitPrice: 'asc',
          },
        },
        purchaseOrders: {
          include: {
            items: {
              include: {
                inventoryItem: {
                  select: InventoryItemShortly
                },
              },
            },
          },
          orderBy: {
            orderDate: 'desc',
          },
        },
        warehouseReceipts: {
          include: {
            items: {
              include: {
                inventoryItem: {
                  select: InventoryItemShortly
                },
              },
            },
          },
          orderBy: {
            receiptDate: 'desc',
          },
        },
      },
    });

    return supplier;
  } catch (error) {
    console.error('Error getting supplier by ID:', error);
    throw new Error('Failed to get supplier');
  }
};

/**
 * Get all suppliers with filtering and pagination
 */
export const getSuppliers = async (query: SupplierQuery) => {
  try {
    const {
      organizationId,
      status,
      rating,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (status) {
      where.status = status;
    }

    if (rating !== undefined) {
      where.rating = {
        gte: rating,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { taxCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      Supplier.findMany({
        where,
        include: {
          organization: {
            select: {
              ...OrganizationShortly,
              owner: {
                select: UserShortly,
              }
            }
          },
          supplierItems: {
            take: 3,
            orderBy: {
              unitPrice: 'asc',
            },
          },
          _count: {
            select: {
              purchaseOrders: true,
              supplierItems: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw new Error('Failed to get suppliers');
  }
};

/**
 * Update supplier
 */
export const updateSupplier = async (id: string, data: UpdateSupplier, userId?: string | null) => {
  try {
    const supplier = await Supplier.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        organization: {
          select: OrganizationShortly
        },
        supplierItems: {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        },
        purchaseOrders: {
          orderBy: {
            orderDate: 'desc',
          },
          take: 5,
        },
      },
    });

    return supplier;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw new Error('Failed to update supplier');
  }
};

/**
 * Delete supplier
 */

export const deleteSupplier = async (id: string, userId?: string | null) => {
  try {
    // Check if supplier has purchase orders
    const purchaseOrders = await PurchaseOrder.count({
      where: { supplierId: id }
    });

    if (purchaseOrders > 0) {
      throw new Error('Cannot delete supplier with existing purchase orders');
    }

    // Check if supplier has warehouse receipts
    const warehouseReceipts = await WarehouseReceipt.count({
      where: { supplierId: id }
    });

    if (warehouseReceipts > 0) {
      throw new Error('Cannot delete supplier with existing warehouse receipts');
    }

    const supplier = await Supplier.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Supplier deleted successfully', data: supplier };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw new Error('Failed to delete supplier');
  }
};

// =========================
// SUPPLIER ITEM SERVICES
// =========================

/**
 * Create a new supplier item
 */
export const createSupplierItem = async (data: CreateSupplierItem, userId?: string | null) => {
  try {
    // Check if supplier exists
    const supplier = await Supplier.findUnique({
      where: { id: data.supplierId }
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    if (supplier.status !== 'active') {
      throw new Error('Supplier is not active');
    }

    if (supplier.status !== 'active') {
      throw new Error('Supplier is not approved to provide items');
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

    // Check if supplier item already exists
    const existingItem = await SupplierItem.findUnique({
      where: {
        supplierId_inventoryItemId: {
          supplierId: data.supplierId,
          inventoryItemId: data.inventoryItemId,
        },
      },
    });

    if (existingItem) {
      throw new Error('Supplier item already exists for this inventory item');
    }

    const supplierItem = await SupplierItem.create({
      data: {
        supplierId: data.supplierId,
        inventoryItemId: data.inventoryItemId,
        supplierSku: data.supplierSku,
        unitPrice: data.unitPrice,
        minOrderQty: data.minOrderQty,
        leadTimeDays: data.leadTimeDays,
        isPreferred: data.isPreferred,
        createdById: userId || null,
      },
      include: {
        supplier: {
          select: SupplierShortly
        },
        inventoryItem: {
          select: InventoryItemShortly
        },
      },
    });

    return supplierItem;
  } catch (error) {
    console.error('Error creating supplier item:', error);
    throw new Error('Failed to create supplier item');
  }
};

/**
 * Get supplier item by ID
 */
export const getSupplierItemById = async (id: string) => {
  try {
    const supplierItem = await SupplierItem.findUnique({
      where: { id },
      include: {
        supplier: {
          select: SupplierShortly
        },
        inventoryItem: {
          select: InventoryItemShortly
        },
      },
    });

    return supplierItem;
  } catch (error) {
    console.error('Error getting supplier item by ID:', error);
    throw new Error('Failed to get supplier item');
  }
};

/**
 * Get all supplier items with filtering and pagination
 */
export const getSupplierItems = async (query: SupplierItemQuery) => {
  try {
    const {
      supplierId,
      inventoryItemId,
      isPreferred,
      minPrice,
      maxPrice,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    if (isPreferred !== undefined) {
      where.isPreferred = isPreferred;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.unitPrice = {};
      if (minPrice !== undefined) {
        where.unitPrice.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.unitPrice.lte = maxPrice;
      }
    }

    if (search) {
      where.OR = [
        { supplierSku: { contains: search, mode: 'insensitive' } },
        { inventoryItem: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [supplierItems, total] = await Promise.all([
      SupplierItem.findMany({
        where,
        include: {
          supplier: {
            select: SupplierShortly
          },
          inventoryItem: {
            select: InventoryItemShortly
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      SupplierItem.count({ where }),
    ]);

    return {
      data: supplierItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting supplier items:', error);
    throw new Error('Failed to get supplier items');
  }
};

/**
 * Update supplier item
 */
export const updateSupplierItem = async (id: string, data: UpdateSupplierItem, userId?: string | null) => {
  try {
    const supplierItem = await SupplierItem.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        supplier: {
          select: SupplierShortly
        },
        inventoryItem: {
          select: InventoryItemShortly
        },
      },
    });

    return supplierItem;
  } catch (error) {
    console.error('Error updating supplier item:', error);
    throw new Error('Failed to update supplier item');
  }
};

/**
 * Delete supplier item
 */
export const deleteSupplierItem = async (id: string, userId?: string | null) => {
  try {
    const supplierItem = await SupplierItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Supplier item deleted successfully', data: supplierItem };
  } catch (error) {
    console.error('Error deleting supplier item:', error);
    throw new Error('Failed to delete supplier item');
  }
};

// =========================
// PURCHASE ORDER SERVICES
// =========================

/**
 * Create a new purchase order
 */
export const createPurchaseOrder = async (data: CreatePurchaseOrder, userId?: string | null) => {
  try {
    // Check if supplier exists
    const supplier = await Supplier.findUnique({
      where: { id: data.supplierId }
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    if (data.warehouseId) {
      const warehouse = await Warehouse.findUnique({
        where: { id: data.warehouseId },
        select: {
          id: true,
          restaurantId: true,
          isActive: true,
        },
      });

      if (!warehouse) {
        throw new Error('Warehouse not found');
      }

      if (!warehouse.isActive) {
        throw new Error('Warehouse is inactive');
      }

      if (warehouse.restaurantId !== data.restaurantId) {
        throw new Error('Warehouse does not belong to purchase order restaurant');
      }
    }

    const createdById = userId || data.createdById;

    if (!createdById) {
      throw new Error('Created by user is required');
    }

    // Check if user exists
    const user = await User.findUnique({
      where: { id: createdById }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if order number is unique
    const existingOrder = await PurchaseOrder.findUnique({
      where: { orderNumber: data.orderNumber }
    });

    if (existingOrder) {
      throw new Error('Order number already exists');
    }

    const normalizedItems = (data.items ?? []).map((item) => {
      const pricing = computeItemPricing(item.quantity, item.unitPrice, item.totalPrice);
      return {
        inventoryItemId: item.inventoryItemId,
        quantity: pricing.quantity,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        receivedQty: Number(item.receivedQty ?? 0),
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

    const purchaseOrder = await Database.$transaction(async (tx) => {
      const workflowNote = data.warehouseId
        ? `Warehouse request origin: ${data.warehouseId}`
        : '';

      const createdOrder = await tx.purchaseOrder.create({
        data: {
          supplierId: data.supplierId,
          restaurantId: data.restaurantId,
          orderNumber: data.orderNumber,
          status: data.status,
          orderDate: data.orderDate,
          expectedDate: data.expectedDate,
          receivedDate: data.receivedDate,
          totalAmount: normalizedItems.length ? itemsTotal : data.totalAmount,
          notes: appendWorkflowNote(data.notes, workflowNote),
          createdById: createdById,
          items: normalizedItems.length
            ? {
                create: normalizedItems,
              }
            : undefined,
        },
        include: {
          supplier: {
            select: SupplierShortly
          },
          restaurant: {
            select: RestaurantShortly
          },
          createdBy: {
            select: UserShortly
          },
          items: {
            include: {
              inventoryItem: {
                select: InventoryItemShortly
              },
            },
          },
        },
      });

      return createdOrder;
    });

    return purchaseOrder;
  } catch (error) {
    console.error('Error creating purchase order:', error);
    throw new Error('Failed to create purchase order');
  }
};

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderById = async (id: string) => {
  try {
    const purchaseOrder = await PurchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: SupplierShortly
        },
        restaurant: {
          select: RestaurantShortly
        },
        createdBy: {
          select: UserShortly
        },
        items: {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        },
      },
    });

    return purchaseOrder;
  } catch (error) {
    console.error('Error getting purchase order by ID:', error);
    throw new Error('Failed to get purchase order');
  }
};

/**
 * Get all purchase orders with filtering and pagination
 */
export const getPurchaseOrders = async (query: PurchaseOrderQuery) => {
  try {
    const {
      supplierId,
      restaurantId,
      status,
      startDate,
      endDate,
      createdById,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (status) {
      where.status = status;
    }

    if (createdById) {
      where.createdById = createdById;
    }

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = startDate;
      }
      if (endDate) {
        where.orderDate.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: SupplierShortly
          },
          restaurant: {
            select: RestaurantShortly
          },
          createdBy: {
            select: UserShortly
          },
          items: {
            include: {
              inventoryItem: {
                select: InventoryItemShortly
              },
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      PurchaseOrder.count({ where }),
    ]);

    return {
      data: purchaseOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting purchase orders:', error);
    throw new Error('Failed to get purchase orders');
  }
};

/**
 * Update purchase order
 */
export const updatePurchaseOrder = async (id: string, data: UpdatePurchaseOrder) => {
  try {
    const purchaseOrder = await PurchaseOrder.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        supplier: {
          select: SupplierShortly
        },
        restaurant: {
          select: RestaurantShortly
        },
        createdBy: {
          select: UserShortly
        },
        items: {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        },
      },
    });

    return purchaseOrder;
  } catch (error) {
    console.error('Error updating purchase order:', error);
    throw new Error('Failed to update purchase order');
  }
};

/**
 * Delete purchase order
 */
export const deletePurchaseOrder = async (id: string, userId?: string | null) => {
  try {
    const purchaseOrder = await PurchaseOrder.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Purchase order deleted successfully', data: purchaseOrder };
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    throw new Error('Failed to delete purchase order');
  }
};

// =========================
// PURCHASE ORDER ITEM SERVICES
// =========================

/**
 * Create a new purchase order item
 */
export const createPurchaseOrderItem = async (data: CreatePurchaseOrderItem) => {
  try {
    // Check if purchase order exists
    const purchaseOrder = await PurchaseOrder.findUnique({
      where: { id: data.purchaseOrderId }
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if inventory item exists
    const inventoryItem = await InventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    const purchaseOrderItem = await PurchaseOrderItem.create({
      data: {
        purchaseOrderId: data.purchaseOrderId,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
        receivedQty: data.receivedQty,
        notes: data.notes,
      },
      include: {
        purchaseOrder: true,
        inventoryItem: {
          select: InventoryItemShortly
        },
      },
    });

    return purchaseOrderItem;
  } catch (error) {
    console.error('Error creating purchase order item:', error);
    throw new Error('Failed to create purchase order item');
  }
};

/**
 * Get purchase order item by ID
 */
export const getPurchaseOrderItemById = async (id: string) => {
  try {
    const purchaseOrderItem = await PurchaseOrderItem.findUnique({
      where: { id },
      include: {
        purchaseOrder: true,
        inventoryItem: {
          select: InventoryItemShortly
        },
      },
    });

    return purchaseOrderItem;
  } catch (error) {
    console.error('Error getting purchase order item by ID:', error);
    throw new Error('Failed to get purchase order item');
  }
};

/**
 * Get all purchase order items with filtering and pagination
 */
export const getPurchaseOrderItems = async (query: PurchaseOrderItemQuery) => {
  try {
    const {
      purchaseOrderId,
      inventoryItemId,
      minQuantity,
      maxQuantity,
      minPrice,
      maxPrice,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId;
    }

    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    if (minQuantity !== undefined || maxQuantity !== undefined) {
      where.quantity = {};
      if (minQuantity !== undefined) {
        where.quantity.gte = minQuantity;
      }
      if (maxQuantity !== undefined) {
        where.quantity.lte = maxQuantity;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.unitPrice = {};
      if (minPrice !== undefined) {
        where.unitPrice.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.unitPrice.lte = maxPrice;
      }
    }

    const [purchaseOrderItems, total] = await Promise.all([
      PurchaseOrderItem.findMany({
        where,
        include: {
          purchaseOrder: true,
          inventoryItem: {
            select: InventoryItemShortly
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      PurchaseOrderItem.count({ where }),
    ]);

    return {
      data: purchaseOrderItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting purchase order items:', error);
    throw new Error('Failed to get purchase order items');
  }
};

/**
 * Update purchase order item
 */
export const updatePurchaseOrderItem = async (id: string, data: UpdatePurchaseOrderItem) => {
  try {
    const purchaseOrderItem = await PurchaseOrderItem.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        purchaseOrder: true,
        inventoryItem: {
          select: InventoryItemShortly
        },
      },
    });

    return purchaseOrderItem;
  } catch (error) {
    console.error('Error updating purchase order item:', error);
    throw new Error('Failed to update purchase order item');
  }
};

/**
 * Delete purchase order item
 */
export const deletePurchaseOrderItem = async (id: string) => {
  try {
    await PurchaseOrderItem.delete({
      where: { id },
    });

    return { message: 'Purchase order item deleted successfully' };
  } catch (error) {
    console.error('Error deleting purchase order item:', error);
    throw new Error('Failed to delete purchase order item');
  }
};

// =========================
// BULK OPERATION SERVICES
// =========================

/**
 * Bulk update supplier status
 */
export const bulkUpdateSupplierStatus = async (data: BulkUpdateSupplierStatus) => {
  try {
    const { supplierIds, status } = data;

    // Validate all suppliers exist
    const suppliers = await Supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true },
    });

    if (suppliers.length !== supplierIds.length) {
      throw new Error('One or more suppliers not found');
    }

    await Supplier.updateMany({
      where: { id: { in: supplierIds } },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return { message: `${supplierIds.length} suppliers status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating supplier status:', error);
    throw new Error('Failed to bulk update supplier status');
  }
};

/**
 * Bulk update purchase order status
 */
export const bulkUpdatePurchaseOrderStatus = async (data: BulkUpdatePurchaseOrderStatus) => {
  try {
    const { purchaseOrderIds, status } = data;

    // Validate all purchase orders exist
    const purchaseOrders = await PurchaseOrder.findMany({
      where: { id: { in: purchaseOrderIds } },
      select: { id: true },
    });

    if (purchaseOrders.length !== purchaseOrderIds.length) {
      throw new Error('One or more purchase orders not found');
    }

    await PurchaseOrder.updateMany({
      where: { id: { in: purchaseOrderIds } },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return { message: `${purchaseOrderIds.length} purchase orders status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating purchase order status:', error);
    throw new Error('Failed to bulk update purchase order status');
  }
};

/**
 * Bulk update supplier item prices
 */
export const bulkUpdateSupplierItemPrices = async (data: BulkUpdateSupplierItemPrices) => {
  try {
    const { supplierItemIds, priceAdjustment, adjustmentType, notes } = data;

    // Validate all supplier items exist
    const supplierItems = await SupplierItem.findMany({
      where: { id: { in: supplierItemIds } },
      select: { id: true, unitPrice: true },
    });

    if (supplierItems.length !== supplierItemIds.length) {
      throw new Error('One or more supplier items not found');
    }

    // Update prices
    for (const item of supplierItems) {
      const currentPrice = Number(item.unitPrice);
      let newPrice: number;
      
      if (adjustmentType === 'percentage') {
        newPrice = currentPrice * (1 + priceAdjustment / 100);
      } else {
        newPrice = currentPrice + priceAdjustment;
      }

      await SupplierItem.update({
        where: { id: item.id },
        data: {
          unitPrice: new Prisma.Decimal(newPrice),
          updatedAt: new Date(),
        },
      });
    }

    return { message: `${supplierItemIds.length} supplier item prices updated successfully` };
  } catch (error) {
    console.error('Error bulk updating supplier item prices:', error);
    throw new Error('Failed to bulk update supplier item prices');
  }
};

// =========================
// SPECIAL QUERY SERVICES
// =========================

/**
 * Get supplier performance metrics
 */
export const getSupplierPerformance = async (query: SupplierPerformanceQuery) => {
  try {
    const { restaurantId, supplierId, startDate, endDate, metrics } = query;

    const where: any = {
      restaurantId,
      orderDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const purchaseOrders = await PurchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: SupplierShortly
        },
        items: {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // Calculate performance metrics
    const performance = {
      totalOrders: purchaseOrders.length,
      totalValue: purchaseOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      averageOrderValue: 0,
      onTimeDelivery: 0,
      qualityRating: 0,
      priceCompetitiveness: 0,
      reliability: 0,
      suppliers: {} as { [key: string]: any },
    };

    if (purchaseOrders.length > 0) {
      performance.averageOrderValue = performance.totalValue / purchaseOrders.length;

      // Group by supplier
      const supplierStats = purchaseOrders.reduce((acc, order) => {
        const supplierId = order.supplierId;
        if (!acc[supplierId]) {
          acc[supplierId] = {
            supplier: order.supplier,
            orders: [],
            totalValue: 0,
            onTimeCount: 0,
          };
        }
        acc[supplierId].orders.push(order);
        acc[supplierId].totalValue += Number(order.totalAmount);
        
        // Check if order was on time
        if (order.expectedDate && order.receivedDate && order.receivedDate <= order.expectedDate) {
          acc[supplierId].onTimeCount++;
        }
        
        return acc;
      }, {} as any);

      performance.suppliers = supplierStats;
    }

    return performance;
  } catch (error) {
    console.error('Error getting supplier performance:', error);
    throw new Error('Failed to get supplier performance');
  }
};

/**
 * Get purchase order summary
 */
export const getPurchaseOrderSummary = async (query: PurchaseOrderSummaryQuery) => {
  try {
    const { restaurantId, supplierId, startDate, endDate, groupBy } = query;

    const where: any = {
      restaurantId,
      orderDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const purchaseOrders = await PurchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: SupplierShortly
        },
        items: {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // Group data based on groupBy parameter
    const groupedData = purchaseOrders.reduce((acc, order) => {
      let key = '';
      
      switch (groupBy) {
        case 'supplier':
          key = order.supplier.name;
          break;
        case 'month':
          key = order.orderDate.toISOString().substring(0, 7); // YYYY-MM
          break;
        case 'week':
          const week = getWeekNumber(order.orderDate);
          key = `${order.orderDate.getFullYear()}-W${week}`;
          break;
        case 'day':
          key = order.orderDate.toISOString().substring(0, 10); // YYYY-MM-DD
          break;
        default:
          key = 'all';
      }

      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalValue: 0,
          orders: [],
        };
      }

      acc[key].count++;
      acc[key].totalValue += Number(order.totalAmount);
      acc[key].orders.push(order);

      return acc;
    }, {} as any);

    return {
      summary: groupedData,
      totalOrders: purchaseOrders.length,
      totalValue: purchaseOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      averageOrderValue: purchaseOrders.length > 0 
        ? purchaseOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0) / purchaseOrders.length 
        : 0,
    };
  } catch (error) {
    console.error('Error getting purchase order summary:', error);
    throw new Error('Failed to get purchase order summary');
  }
};

/**
 * Get supplier comparison for specific inventory item
 */
export const getSupplierComparison = async (query: SupplierComparisonQuery) => {
  try {
    const { restaurantId, inventoryItemId, includeInactive } = query;

    const where: any = {
      inventoryItemId,
      supplier: {
        restaurantId,
      },
    };

    if (!includeInactive) {
      where.supplier = {
        ...where.supplier,
        status: 'active',
      };
    }

    const supplierItems = await SupplierItem.findMany({
      where,
      include: {
        supplier: {
          select: SupplierShortly
        },
        inventoryItem: {
          select: InventoryItemShortly
        },
      },
      orderBy: {
        unitPrice: 'asc',
      },
    });

    // Calculate comparison metrics
    const comparison = supplierItems.map(item => ({
      id: item.id,
      supplier: item.supplier,
      inventoryItem: item.inventoryItem,
      unitPrice: Number(item.unitPrice),
      minOrderQty: item.minOrderQty ? Number(item.minOrderQty) : null,
      leadTimeDays: item.leadTimeDays,
      isPreferred: item.isPreferred,
      supplierSku: item.supplierSku,
      rating: item.supplier.rating,
      status: item.supplier.status,
    }));

    // Find best price
    const bestPrice = Math.min(...comparison.map(item => item.unitPrice));
    
    // Add price comparison
    const comparisonWithRanking = comparison.map(item => ({
      ...item,
      priceRank: item.unitPrice === bestPrice ? 1 : comparison.filter(c => c.unitPrice < item.unitPrice).length + 1,
      priceDifference: item.unitPrice - bestPrice,
      priceDifferencePercent: bestPrice > 0 ? ((item.unitPrice - bestPrice) / bestPrice) * 100 : 0,
    }));

    return {
      inventoryItem: comparison[0]?.inventoryItem,
      suppliers: comparisonWithRanking,
      bestPrice,
      totalSuppliers: comparison.length,
    };
  } catch (error) {
    console.error('Error getting supplier comparison:', error);
    throw new Error('Failed to get supplier comparison');
  }
};

/**
 * Get purchase order analytics
 */
export const getPurchaseOrderAnalytics = async (query: PurchaseOrderAnalyticsQuery) => {
  try {
    const { restaurantId, startDate, endDate, groupBy, includeItems } = query;

    const where: any = {
      restaurantId,
      orderDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    const purchaseOrders = await PurchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: SupplierShortly
        },
        items: includeItems ? {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        } : false,
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // Group data based on groupBy parameter
    const groupedData = purchaseOrders.reduce((acc, order) => {
      let key = '';
      
      switch (groupBy) {
        case 'supplier':
          key = order.supplier.name;
          break;
        case 'status':
          key = order.status;
          break;
        case 'month':
          key = order.orderDate.toISOString().substring(0, 7);
          break;
        case 'week':
          const week = getWeekNumber(order.orderDate);
          key = `${order.orderDate.getFullYear()}-W${week}`;
          break;
        default:
          key = 'all';
      }

      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalValue: 0,
          orders: [],
          statusBreakdown: {},
        };
      }

      acc[key].count++;
      acc[key].totalValue += Number(order.totalAmount);
      acc[key].orders.push(order);
      
      // Status breakdown
      if (!acc[key].statusBreakdown[order.status]) {
        acc[key].statusBreakdown[order.status] = 0;
      }
      acc[key].statusBreakdown[order.status]++;

      return acc;
    }, {} as any);

    return {
      analytics: groupedData,
      totalOrders: purchaseOrders.length,
      totalValue: purchaseOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      averageOrderValue: purchaseOrders.length > 0 
        ? purchaseOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0) / purchaseOrders.length 
        : 0,
    };
  } catch (error) {
    console.error('Error getting purchase order analytics:', error);
    throw new Error('Failed to get purchase order analytics');
  }
};

// =========================
// WORKFLOW SERVICES
// =========================

/**
 * Send purchase order to supplier
 */
export const sendPurchaseOrder = async (data: SendPurchaseOrder) => {
  try {
    const purchaseOrder = await PurchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: {
        items: true,
      },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.draft) {
      throw new Error('Only draft purchase orders can be sent');
    }

    if (purchaseOrder.items.length === 0) {
      throw new Error('Cannot send purchase order without items');
    }

    const warehouse = await Warehouse.findUnique({
      where: { id: data.warehouseId },
      select: WarehouseShortly,
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    if (!warehouse.isActive) {
      throw new Error('Warehouse is inactive');
    }

    if (warehouse.restaurantId !== purchaseOrder.restaurantId) {
      throw new Error('Warehouse does not belong to purchase order restaurant');
    }

    const requestedBy = data.requestedById ? `requestedBy=${data.requestedById}` : 'requestedBy=system';
    const workflowNote = `WarehouseRequest warehouseId=${data.warehouseId}; ${requestedBy}; sendMethod=${data.sendMethod}`;

    const updatedOrder = await PurchaseOrder.update({
      where: { id: data.purchaseOrderId },
      data: {
        status: PurchaseOrderStatus.sent,
        notes: appendWorkflowNote(purchaseOrder.notes, workflowNote),
        updatedAt: new Date(),
      },
      include: {
        supplier: {
          select: SupplierShortly
        },
        restaurant: {
          select: RestaurantShortly
        },
        items: {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        },
      },
    });

    // TODO: Implement actual sending logic (email, fax, etc.)
    // This would integrate with email service, supplier portal, etc.

    return {
      message: 'Purchase order sent successfully',
      data: updatedOrder,
    };
  } catch (error) {
    console.error('Error sending purchase order:', error);
    throw new Error('Failed to send purchase order');
  }
};

/**
 * Confirm purchase order with supplier
 */
export const confirmPurchaseOrder = async (data: ConfirmPurchaseOrder) => {
  try {
    const purchaseOrder = await PurchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.sent) {
      throw new Error('Only sent purchase orders can be confirmed');
    }

    if (purchaseOrder.supplierId !== data.supplierId) {
      throw new Error('Supplier does not match this purchase order');
    }

    const workflowNote = appendWorkflowNote(
      purchaseOrder.notes,
      `SupplierConfirmation supplierId=${data.supplierId}; confirmedBy=${data.confirmedById || 'system'}${data.confirmationNotes ? `; note=${data.confirmationNotes}` : ''}`,
    );

    const updatedOrder = await PurchaseOrder.update({
      where: { id: data.purchaseOrderId },
      data: {
        status: PurchaseOrderStatus.confirmed,
        expectedDate: data.expectedDate,
        notes: workflowNote,
        updatedAt: new Date(),
      },
      include: {
        supplier: {
          select: SupplierShortly
        },
        restaurant: {
          select: RestaurantShortly
        },
        items: {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        },
      },
    });

    return {
      message: 'Purchase order confirmed successfully',
      data: updatedOrder,
    };
  } catch (error) {
    console.error('Error confirming purchase order:', error);
    throw new Error('Failed to confirm purchase order');
  }
};

/**
 * Receive purchase order items
 */
export const receivePurchaseOrder = async (data: ReceivePurchaseOrder) => {
  try {
    const result = await Database.$transaction(async (tx) => {
      const purchaseOrder = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: {
          supplier: {
            select: SupplierShortly,
          },
          items: true,
        },
      });

      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      if (
        purchaseOrder.status !== PurchaseOrderStatus.confirmed
        && purchaseOrder.status !== PurchaseOrderStatus.partiallyReceived
      ) {
        throw new Error('Only confirmed or partially received purchase orders can be received');
      }

      const warehouse = await tx.warehouse.findUnique({
        where: { id: data.warehouseId },
        select: {
          id: true,
          restaurantId: true,
          isActive: true,
        },
      });

      if (!warehouse) {
        throw new Error('Warehouse not found');
      }

      if (!warehouse.isActive) {
        throw new Error('Warehouse is inactive');
      }

      if (warehouse.restaurantId !== purchaseOrder.restaurantId) {
        throw new Error('Warehouse does not belong to purchase order restaurant');
      }

      const createdById = data.createdById || purchaseOrder.createdById;
      const approvedById = data.approvedById || data.createdById || null;

      const orderItemsMap = new Map(
        purchaseOrder.items.map((item) => [item.id, item]),
      );

      const validReceivedItems = data.receivedItems.filter((item) => Number(item.receivedQty) > 0);
      if (validReceivedItems.length === 0) {
        throw new Error('At least one received item with quantity > 0 is required');
      }

      const receiptItemsInput: Array<{
        inventoryItemId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        notes?: string;
      }> = [];

      for (const receivedItem of validReceivedItems) {
        const orderItem = orderItemsMap.get(receivedItem.itemId);

        if (!orderItem) {
          throw new Error(`Purchase order item not found: ${receivedItem.itemId}`);
        }

        const orderedQty = Number(orderItem.quantity);
        const previousReceivedQty = Number(orderItem.receivedQty);
        const nextReceivedQty = previousReceivedQty + Number(receivedItem.receivedQty);

        if (nextReceivedQty > orderedQty) {
          throw new Error(`Received quantity exceeds ordered quantity for item: ${receivedItem.itemId}`);
        }

        await tx.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: {
            receivedQty: nextReceivedQty,
            notes: appendWorkflowNote(orderItem.notes, receivedItem.qualityNotes || ''),
          },
        });

        const unitPrice = Number(orderItem.unitPrice);
        const quantity = Number(receivedItem.receivedQty);
        const totalPrice = quantity * unitPrice;

        receiptItemsInput.push({
          inventoryItemId: orderItem.inventoryItemId,
          quantity,
          unitPrice,
          totalPrice,
          notes: receivedItem.qualityNotes,
        });
      }

      const providedReceiptNumber = data.receiptNumber?.trim();
      if (providedReceiptNumber) {
        const existingReceipt = await tx.warehouseReceipt.findUnique({
          where: { receiptNumber: providedReceiptNumber },
          select: { id: true },
        });

        if (existingReceipt) {
          throw new Error('Receipt number already exists');
        }
      }

      const receiptNumber = providedReceiptNumber || await generateUniqueReceiptNumberForTx(tx);
      const receiptTotalAmount = receiptItemsInput.reduce((sum, item) => sum + item.totalPrice, 0);
      const receiptNotes = appendWorkflowNote(
        data.receivingNotes,
        `Linked purchaseOrderId=${purchaseOrder.id}; supplierId=${purchaseOrder.supplierId}`,
      );

      const warehouseReceipt = await tx.warehouseReceipt.create({
        data: {
          restaurantId: purchaseOrder.restaurantId,
          warehouseId: data.warehouseId,
          receiptNumber,
          supplierId: purchaseOrder.supplierId,
          receiptDate: data.receivedDate,
          status: WarehouseReceiptStatus.received,
          totalAmount: receiptTotalAmount,
          notes: receiptNotes,
          createdById,
          approvedById,
          approvedAt: approvedById ? data.receivedDate : null,
          items: {
            create: receiptItemsInput,
          },
        },
        include: {
          restaurant: {
            select: RestaurantShortly,
          },
          warehouse: {
            select: WarehouseShortly,
          },
          supplier: {
            select: SupplierShortly,
          },
          createdBy: {
            select: UserShortly,
          },
          approvedBy: {
            select: UserShortly,
          },
          items: {
            include: {
              inventoryItem: {
                select: InventoryItemShortly,
              },
            },
          },
        },
      });

      for (const item of receiptItemsInput) {
        await upsertReceiptInventoryBalance(tx, {
          restaurantId: purchaseOrder.restaurantId,
          warehouseId: data.warehouseId,
          inventoryItemId: item.inventoryItemId,
          balanceDate: data.receivedDate,
          receivedQty: item.quantity,
          userId: approvedById || createdById,
        });

        await tx.inventoryTransaction.create({
          data: {
            restaurantId: purchaseOrder.restaurantId,
            inventoryItemId: item.inventoryItemId,
            type: InventoryTransactionType.purchase,
            quantity: item.quantity,
            totalCost: item.totalPrice,
            unitCost: item.unitPrice,
            invoiceNumber: warehouseReceipt.receiptNumber,
            supplierName: purchaseOrder.supplier?.name || null,
            notes: receiptNotes,
            createdById: approvedById || createdById,
          },
        });
      }

      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: purchaseOrder.id },
      });

      const fullyReceived = updatedItems.every((item) =>
        Number(item.receivedQty) >= Number(item.quantity)
      );

      const purchaseOrderStatus = fullyReceived
        ? PurchaseOrderStatus.received
        : PurchaseOrderStatus.partiallyReceived;

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          status: purchaseOrderStatus,
          receivedDate: fullyReceived ? data.receivedDate : purchaseOrder.receivedDate,
          notes: appendWorkflowNote(
            purchaseOrder.notes,
            `WarehouseReceived warehouseId=${data.warehouseId}; receiptNumber=${warehouseReceipt.receiptNumber}`,
          ),
          updatedAt: new Date(),
          updatedById: approvedById || createdById,
        },
        include: {
          supplier: {
            select: SupplierShortly,
          },
          restaurant: {
            select: RestaurantShortly,
          },
          createdBy: {
            select: UserShortly,
          },
          items: {
            include: {
              inventoryItem: {
                select: InventoryItemShortly,
              },
            },
          },
        },
      });

      return {
        purchaseOrder: updatedOrder,
        warehouseReceipt,
        fullyReceived,
      };
    });

    return {
      message: `Purchase order ${result.fullyReceived ? 'fully received' : 'partially received'} successfully`,
      data: {
        purchaseOrder: result.purchaseOrder,
        warehouseReceipt: result.warehouseReceipt,
      },
    };
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    throw new Error('Failed to receive purchase order');
  }
};

/**
 * Cancel purchase order
 */
export const cancelPurchaseOrder = async (data: CancelPurchaseOrder) => {
  try {
    const purchaseOrder = await PurchaseOrder.findUnique({
      where: { id: data.purchaseOrderId }
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    if (
      purchaseOrder.status === PurchaseOrderStatus.received
      || purchaseOrder.status === PurchaseOrderStatus.cancelled
    ) {
      throw new Error('Cannot cancel received or already cancelled purchase orders');
    }

    const updatedOrder = await PurchaseOrder.update({
      where: { id: data.purchaseOrderId },
      data: {
        status: PurchaseOrderStatus.cancelled,
        notes: appendWorkflowNote(purchaseOrder.notes, `CancelReason: ${data.reason}`),
        updatedAt: new Date(),
      },
      include: {
        supplier: {
          select: SupplierShortly
        },
        restaurant: {
          select: RestaurantShortly
        },
        items: {
          include: {
            inventoryItem: {
              select: InventoryItemShortly
            },
          },
        },
      },
    });

    // TODO: Implement supplier notification if notifySupplier is true

    return {
      message: 'Purchase order cancelled successfully',
      data: updatedOrder,
    };
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    throw new Error('Failed to cancel purchase order');
  }
};

// =========================
// UTILITY FUNCTIONS
// =========================

/**
 * Get week number from date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
