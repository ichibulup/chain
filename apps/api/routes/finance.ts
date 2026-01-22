import { Router } from 'express';
import * as financeController from '@/controllers/finance';

const router = Router();

// =========================
// TAX RATE ROUTES
// =========================

/**
 * @route   GET /api/finance/tax-rates
 * @desc    Get all tax rates with filtering
 * @access  Private
 */
router.get('/tax-rates', financeController.getTaxRates);

/**
 * @route   GET /api/finance/tax-rates/:id
 * @desc    Get tax rate by ID
 * @access  Private
 */
router.get('/tax-rates/:id', financeController.getTaxRateById);

/**
 * @route   POST /api/finance/tax-rates
 * @desc    Create a new tax rate
 * @access  Private
 */
router.post('/tax-rates', financeController.createTaxRate);

/**
 * @route   PUT /api/finance/tax-rates/:id
 * @desc    Update tax rate by ID
 * @access  Private
 */
router.put('/tax-rates/:id', financeController.updateTaxRate);

/**
 * @route   DELETE /api/finance/tax-rates/:id
 * @desc    Delete tax rate by ID
 * @access  Private
 */
router.delete('/tax-rates/:id', financeController.deleteTaxRate);

/**
 * @route   GET /api/finance/restaurants/:restaurantId/active-tax-rates
 * @desc    Get active tax rates for a restaurant
 * @access  Private
 */
router.get('/restaurant/:restaurantId/active-tax-rates', financeController.getActiveTaxRates);

/**
 * @route   POST /api/finance/tax-rates/:taxRateId/calculate
 * @desc    Calculate tax amount based on tax rate and base amount
 * @access  Private
 */
router.post('/tax-rates/:taxRateId/calculate', financeController.calculateTaxAmount);

// =========================
// ORDER TAX ROUTES
// =========================

/**
 * @route   GET /api/finance/order-taxes
 * @desc    Get all order taxes with filtering
 * @access  Private
 */
router.get('/order-taxes', financeController.getOrderTaxes);

/**
 * @route   GET /api/finance/order-taxes/:id
 * @desc    Get order tax by ID
 * @access  Private
 */
router.get('/order-taxes/:id', financeController.getOrderTaxById);

/**
 * @route   GET /api/finance/orders/:orderId/tax
 * @desc    Get order tax by order ID
 * @access  Private
 */
router.get('/orders/:orderId/tax', financeController.getOrderTaxByOrderId);

/**
 * @route   POST /api/finance/order-taxes
 * @desc    Create a new order tax
 * @access  Private
 */
router.post('/order-taxes', financeController.createOrderTax);

/**
 * @route   PUT /api/finance/order-taxes/:id
 * @desc    Update order tax by ID
 * @access  Private
 */
router.put('/order-taxes/:id', financeController.updateOrderTax);

/**
 * @route   DELETE /api/finance/order-taxes/:id
 * @desc    Delete order tax by ID
 * @access  Private
 */
router.delete('/order-taxes/:id', financeController.deleteOrderTax);

export default router;
