import { Router } from "express";
import {
  // Payment controllers
  createPayment,
  deletePayment,
  getPaymentById,
  getPayments,
  updatePayment,

  // Payment intent controllers
  createPaymentIntent,
  getPaymentIntentById,
  getPaymentIntents,
  updatePaymentIntent,
  deletePaymentIntent,

  // Refund controllers
  createRefund,
  deleteRefund,
  getRefundById,
  getRefunds,
  updateRefund,

  // Special query controllers
  getPaymentSummary,
} from "@/controllers/order";

const router = Router();

// =========================
// REFUND ROUTES
// =========================

// Create a new refund
router.post('/refund', createRefund);

// Get all refunds with filtering and pagination
router.get('/refund', getRefunds);

// Get refund by ID
router.get('/refund/:id', getRefundById);

// Update refund
router.put('/refund/:id', updateRefund);

// Delete refund
router.delete('/refund/:id', deleteRefund);

// =========================
// PAYMENT INTENT ROUTES
// =========================

// Create a new payment intent
router.post('/intent', createPaymentIntent);

// Get all payment intents with filtering and pagination
router.get('/intent', getPaymentIntents);

// Get payment intent by ID
router.get('/intent/:id', getPaymentIntentById);

// Update payment intent
router.put('/intent/:id', updatePaymentIntent);

// Delete payment intent
router.delete('/intent/:id', deletePaymentIntent);

// =========================
// PAYMENT ROUTES
// =========================

// Create a new payment
router.post('/', createPayment);

// Get all payments with filtering and pagination
router.get('/', getPayments);

// Get payment by ID
router.get('/:id', getPaymentById);

// Update payment
router.put('/:id', updatePayment);

// Delete payment
router.delete('/:id', deletePayment);

// Get payment summary
router.get('/summary', getPaymentSummary);

export default router;
