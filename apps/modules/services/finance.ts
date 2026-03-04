import { Prisma } from '@prisma/client/index';
import type {
  CreateTaxRate,
  UpdateTaxRate,
  TaxRateQuery,
  TaxRate,
  CreateOrderTax,
  UpdateOrderTax,
  OrderTaxQuery,
  OrderTax,
} from '@/schemas/finance';
import { OrderTax as OrderTaxModel, TaxRate as TaxRateModel } from '@/models/finance';
import { Order } from '@/models/order';
// =========================
// HELPER FUNCTIONS
// =========================

/**
 * Check if order exists
 */
const checkOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    const order = await Order.findUnique({
      where: { id: orderId },
    });
    return !!order;
  } catch (error) {
    console.error('Error checking order existence:', error);
    throw error;
  }
};

/**
 * Check if tax rate exists
 */
const checkTaxRateExists = async (taxRateId: string): Promise<boolean> => {
  try {
    const taxRate = await TaxRateModel.findUnique({
      where: { id: taxRateId },
    });
    return !!taxRate;
  } catch (error) {
    console.error('Error checking tax rate existence:', error);
    throw error;
  }
};

// =========================
// TAX RATE SERVICES
// =========================

/**
 * Create a new tax rate
 */
export const createTaxRate = async (data: CreateTaxRate): Promise<TaxRate> => {
  try {
    // Validate restaurant exists
    // const restaurantExists = await checkRestaurantExists(data.restaurantId);
    // if (!restaurantExists) {
    //   throw new Error('Restaurant not found');
    // }

    const taxRate = await TaxRateModel.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        ratePct: new Prisma.Decimal(data.ratePct),
        isActive: data.isActive ?? true,
      },
    });

    // Convert Decimal to number for response
    return {
      ...taxRate,
      ratePct: Number(taxRate.ratePct),
    } as TaxRate;
  } catch (error) {
    console.error('Error creating tax rate:', error);
    throw error;
  }
};

/**
 * Get tax rate by ID
 */
export const getTaxRateById = async (id: string): Promise<TaxRate | null> => {
  try {
    const taxRate = await TaxRateModel.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return taxRate as TaxRate | null;
  } catch (error) {
    console.error('Error getting tax rate by ID:', error);
    throw error;
  }
};

/**
 * Get all tax rates with filtering and pagination
 */
export const getTaxRates = async (
  query: TaxRateQuery
): Promise<{ data: TaxRate[]; pagination: any }> => {
  try {
    const { restaurantId, isActive, search, minRate, maxRate, page, limit, sortBy, sortOrder } =
      query;

    // Build where clause
    const where: Prisma.TaxRateWhereInput = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Rate range filter
    if (minRate !== undefined || maxRate !== undefined) {
      where.ratePct = {};
      if (minRate !== undefined) {
        where.ratePct.gte = new Prisma.Decimal(minRate);
      }
      if (maxRate !== undefined) {
        where.ratePct.lte = new Prisma.Decimal(maxRate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [taxRates, total] = await Promise.all([
      TaxRateModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      }),
      TaxRateModel.count({ where }),
    ]);

    return {
      data: taxRates.map((tr) => ({
        ...tr,
        ratePct: Number(tr.ratePct),
      })) as TaxRate[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting tax rates:', error);
    throw error;
  }
};

/**
 * Update tax rate by ID
 */
export const updateTaxRate = async (id: string, data: UpdateTaxRate): Promise<TaxRate> => {
  try {
    // Check if tax rate exists
    const existingTaxRate = await TaxRateModel.findUnique({
      where: { id },
    });

    if (!existingTaxRate) {
      throw new Error('Tax rate not found');
    }

    // Prepare update data
    const updateData: Prisma.TaxRateUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.ratePct !== undefined) updateData.ratePct = new Prisma.Decimal(data.ratePct);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const taxRate = await TaxRateModel.update({
      where: { id },
      data: updateData,
    });

    return {
      ...taxRate,
      ratePct: Number(taxRate.ratePct),
    } as TaxRate;
  } catch (error) {
    console.error('Error updating tax rate:', error);
    throw error;
  }
};

/**
 * Delete tax rate by ID
 */
export const deleteTaxRate = async (id: string): Promise<void> => {
  try {
    await TaxRateModel.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting tax rate:', error);
    throw error;
  }
};

/**
 * Get active tax rates for a restaurant
 */
export const getActiveTaxRates = async (restaurantId: string): Promise<TaxRate[]> => {
  try {
    const taxRates = await TaxRateModel.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return taxRates.map((tr) => ({
      ...tr,
      ratePct: Number(tr.ratePct),
    })) as TaxRate[];
  } catch (error) {
    console.error('Error getting active tax rates:', error);
    throw error;
  }
};

// =========================
// ORDER TAX SERVICES
// =========================

/**
 * Create a new order tax
 */
export const createOrderTax = async (data: CreateOrderTax): Promise<OrderTax> => {
  try {
    // Validate order exists
    const orderExists = await checkOrderExists(data.orderId);
    if (!orderExists) {
      throw new Error('Order not found');
    }

    // Validate tax rate exists
    const taxRateExists = await checkTaxRateExists(data.taxRateId);
    if (!taxRateExists) {
      throw new Error('Tax rate not found');
    }

    const orderTax = await OrderTaxModel.create({
      data: {
        orderId: data.orderId,
        taxRateId: data.taxRateId,
        amount: new Prisma.Decimal(data.amount),
      },
    });

    return {
      ...orderTax,
      amount: Number(orderTax.amount),
    } as OrderTax;
  } catch (error) {
    console.error('Error creating order tax:', error);
    throw error;
  }
};

/**
 * Get order tax by ID
 */
export const getOrderTaxById = async (id: string): Promise<OrderTax | null> => {
  try {
    const orderTax = await OrderTaxModel.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
            totalAmount: true,
          },
        },
        taxRate: {
          select: {
            id: true,
            name: true,
            ratePct: true,
          },
        },
      },
    });

    return orderTax as OrderTax | null;
  } catch (error) {
    console.error('Error getting order tax by ID:', error);
    throw error;
  }
};

/**
 * Get order tax by order ID
 */
export const getOrderTaxByOrderId = async (orderId: string): Promise<OrderTax | null> => {
  try {
    const orderTax = await OrderTaxModel.findUnique({
      where: { orderId },
      include: {
        taxRate: {
          select: {
            id: true,
            name: true,
            ratePct: true,
          },
        },
      },
    });

    return orderTax as OrderTax | null;
  } catch (error) {
    console.error('Error getting order tax by order ID:', error);
    throw error;
  }
};

/**
 * Get all order taxes with filtering and pagination
 */
export const getOrderTaxes = async (
  query: OrderTaxQuery
): Promise<{ data: OrderTax[]; pagination: any }> => {
  try {
    const { orderId, taxRateId, minAmount, maxAmount, page, limit, sortBy, sortOrder } = query;

    // Build where clause
    const where: Prisma.OrderTaxWhereInput = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (taxRateId) {
      where.taxRateId = taxRateId;
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = new Prisma.Decimal(minAmount);
      }
      if (maxAmount !== undefined) {
        where.amount.lte = new Prisma.Decimal(maxAmount);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [orderTaxes, total] = await Promise.all([
      OrderTaxModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortBy === 'amount' ? sortOrder : sortOrder },
        include: {
          order: {
            select: {
              id: true,
              orderCode: true,
              totalAmount: true,
            },
          },
          taxRate: {
            select: {
              id: true,
              name: true,
              ratePct: true,
            },
          },
        },
      }),
      OrderTaxModel.count({ where }),
    ]);

    return {
      data: orderTaxes.map((ot) => ({
        ...ot,
        amount: Number(ot.amount),
      })) as OrderTax[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting order taxes:', error);
    throw error;
  }
};

/**
 * Update order tax by ID
 */
export const updateOrderTax = async (id: string, data: UpdateOrderTax): Promise<OrderTax> => {
  try {
    // Check if order tax exists
    const existingOrderTax = await OrderTaxModel.findUnique({
      where: { id },
    });

    if (!existingOrderTax) {
      throw new Error('Order tax not found');
    }

    // If updating tax rate, validate it exists
    if (data.taxRateId) {
      const taxRateExists = await checkTaxRateExists(data.taxRateId);
      if (!taxRateExists) {
        throw new Error('Tax rate not found');
      }
    }

    // Prepare update data
    const updateData: Prisma.OrderTaxUpdateInput = {};

    if (data.taxRateId !== undefined) {
      updateData.taxRate = {
        connect: { id: data.taxRateId },
      };
    }
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);

    const orderTax = await OrderTaxModel.update({
      where: { id },
      data: updateData,
    });

    return {
      ...orderTax,
      amount: Number(orderTax.amount),
    } as OrderTax;
  } catch (error) {
    console.error('Error updating order tax:', error);
    throw error;
  }
};

/**
 * Delete order tax by ID
 */
export const deleteOrderTax = async (id: string): Promise<void> => {
  try {
    await OrderTaxModel.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting order tax:', error);
    throw error;
  }
};

/**
 * Calculate tax amount based on tax rate and base amount
 */
export const calculateTaxAmount = async (
  taxRateId: string,
  baseAmount: number
): Promise<number> => {
  try {
    const taxRate = await TaxRateModel.findUnique({
      where: { id: taxRateId },
    });

    if (!taxRate) {
      throw new Error('Tax rate not found');
    }

    if (!taxRate.isActive) {
      throw new Error('Tax rate is not active');
    }

    // Calculate: baseAmount * (ratePct / 100)
    const taxAmount = baseAmount * (Number(taxRate.ratePct) / 100);

    return Number(taxAmount.toFixed(2));
  } catch (error) {
    console.error('Error calculating tax amount:', error);
    throw error;
  }
};
