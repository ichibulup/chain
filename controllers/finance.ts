import type { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import * as financeService from '@/services/finance';
import {
  CreateTaxRateSchema,
  UpdateTaxRateSchema,
  TaxRateQuerySchema,
  CreateOrderTaxSchema,
  UpdateOrderTaxSchema,
  OrderTaxQuerySchema,
} from '@/schemas/finance';

// =========================
// TAX RATE CONTROLLERS
// =========================

/**
 * Create a new tax rate
 */
export const createTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
      return;
    }

    // Validate input with Zod
    const validation = CreateTaxRateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const taxRate = await financeService.createTaxRate(validation.data);

    res.status(201).json({
      success: true,
      message: 'Tax rate created successfully',
      data: taxRate,
    });
  } catch (error: any) {
    console.error('Error creating tax rate:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Get tax rate by ID
 */
export const getTaxRateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid tax rate ID',
      });
      return;
    }

    const taxRate = await financeService.getTaxRateById(id);

    if (!taxRate) {
      res.status(404).json({
        success: false,
        message: 'Tax rate not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tax rate retrieved successfully',
      data: taxRate,
    });
  } catch (error: any) {
    console.error('Error getting tax rate:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Get all tax rates with filtering
 */
export const getTaxRates = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const validation = TaxRateQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.issues,
      });
      return;
    }

    const result = await financeService.getTaxRates(validation.data);

    res.status(200).json({
      success: true,
      message: 'Tax rates retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error getting tax rates:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Update tax rate by ID
 */
export const updateTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid tax rate ID',
      });
      return;
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
      return;
    }

    // Validate input with Zod
    const validation = UpdateTaxRateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const taxRate = await financeService.updateTaxRate(id, validation.data);

    res.status(200).json({
      success: true,
      message: 'Tax rate updated successfully',
      data: taxRate,
    });
  } catch (error: any) {
    console.error('Error updating tax rate:', error);

    if (error?.message === 'Tax rate not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Delete tax rate by ID
 */
export const deleteTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid tax rate ID',
      });
      return;
    }

    await financeService.deleteTaxRate(id);

    res.status(200).json({
      success: true,
      message: 'Tax rate deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting tax rate:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Get active tax rates for a restaurant
 */
export const getActiveTaxRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId } = req.params;

    // Validate UUID
    if (!restaurantId || !validate(restaurantId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID',
      });
      return;
    }

    const taxRates = await financeService.getActiveTaxRates(restaurantId);

    res.status(200).json({
      success: true,
      message: 'Active tax rates retrieved successfully',
      data: taxRates,
    });
  } catch (error: any) {
    console.error('Error getting active tax rates:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

// =========================
// ORDER TAX CONTROLLERS
// =========================

/**
 * Create a new order tax
 */
export const createOrderTax = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
      return;
    }

    // Validate input with Zod
    const validation = CreateOrderTaxSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const orderTax = await financeService.createOrderTax(validation.data);

    res.status(201).json({
      success: true,
      message: 'Order tax created successfully',
      data: orderTax,
    });
  } catch (error: any) {
    console.error('Error creating order tax:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Get order tax by ID
 */
export const getOrderTaxById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order tax ID',
      });
      return;
    }

    const orderTax = await financeService.getOrderTaxById(id);

    if (!orderTax) {
      res.status(404).json({
        success: false,
        message: 'Order tax not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order tax retrieved successfully',
      data: orderTax,
    });
  } catch (error: any) {
    console.error('Error getting order tax:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Get order tax by order ID
 */
export const getOrderTaxByOrderId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    // Validate UUID
    if (!orderId || !validate(orderId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
      return;
    }

    const orderTax = await financeService.getOrderTaxByOrderId(orderId);

    if (!orderTax) {
      res.status(404).json({
        success: false,
        message: 'Order tax not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order tax retrieved successfully',
      data: orderTax,
    });
  } catch (error: any) {
    console.error('Error getting order tax by order ID:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Get all order taxes with filtering
 */
export const getOrderTaxes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const validation = OrderTaxQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.issues,
      });
      return;
    }

    const result = await financeService.getOrderTaxes(validation.data);

    res.status(200).json({
      success: true,
      message: 'Order taxes retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error getting order taxes:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Update order tax by ID
 */
export const updateOrderTax = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order tax ID',
      });
      return;
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
      return;
    }

    // Validate input with Zod
    const validation = UpdateOrderTaxSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const orderTax = await financeService.updateOrderTax(id, validation.data);

    res.status(200).json({
      success: true,
      message: 'Order tax updated successfully',
      data: orderTax,
    });
  } catch (error: any) {
    console.error('Error updating order tax:', error);

    if (error?.message === 'Order tax not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Delete order tax by ID
 */
export const deleteOrderTax = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order tax ID',
      });
      return;
    }

    await financeService.deleteOrderTax(id);

    res.status(200).json({
      success: true,
      message: 'Order tax deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting order tax:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};

/**
 * Calculate tax amount
 */
export const calculateTaxAmount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxRateId } = req.params;
    const { baseAmount } = req.body;

    // Validate UUID
    if (!taxRateId || !validate(taxRateId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid tax rate ID',
      });
      return;
    }

    // Validate base amount
    if (baseAmount === undefined || baseAmount === null || typeof baseAmount !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Valid base amount is required',
      });
      return;
    }

    if (baseAmount < 0) {
      res.status(400).json({
        success: false,
        message: 'Base amount must be non-negative',
      });
      return;
    }

    const taxAmount = await financeService.calculateTaxAmount(taxRateId, baseAmount);

    res.status(200).json({
      success: true,
      message: 'Tax amount calculated successfully',
      data: {
        taxRateId,
        baseAmount,
        taxAmount,
        totalAmount: baseAmount + taxAmount,
      },
    });
  } catch (error: any) {
    console.error('Error calculating tax amount:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
};
