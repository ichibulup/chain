import { Router } from 'express';
import {
  // Voucher controllers
  createVoucher,
  getVoucherById,
  getVoucherByCode,
  getVouchers,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  
  // Voucher usage controllers
  createVoucherUsage,
  getVoucherUsages,
  
  // Promotion controllers
  createPromotion,
  getPromotionById,
  getPromotions,
  getActivePromotions,
  updatePromotion,
  deletePromotion,
  
  // Promotion menu item controllers
  addPromotionMenuItem,
  removePromotionMenuItem,
  bulkAddPromotionMenuItems,
} from '@/controllers/promotion';

const router = Router();

// =========================
// VOUCHER ROUTES
// =========================

// Create a new voucher
router.post('/vouchers', createVoucher);

// Get all vouchers with filtering and pagination
router.get('/vouchers', getVouchers);

// Get voucher by code
router.get('/vouchers/code/:code', getVoucherByCode);

// Get voucher by ID
router.get('/vouchers/:id', getVoucherById);

// Update voucher
router.put('/vouchers/:id', updateVoucher);

// Delete voucher
router.delete('/vouchers/:id', deleteVoucher);

// Validate voucher for usage
router.post('/vouchers/validate', validateVoucher);

// =========================
// VOUCHER USAGE ROUTES
// =========================

// Create voucher usage record
router.post('/voucher-usages', createVoucherUsage);

// Get voucher usage history by voucher ID
router.get('/voucher-usages/voucher/:voucherId', getVoucherUsages);

// =========================
// PROMOTION ROUTES
// =========================

// Create a new promotion
router.post('/promotions', createPromotion);

// Get all promotions with filtering and pagination
router.get('/promotions', getPromotions);

// Get active promotions for a restaurant
router.get('/promotions/active/:restaurantId', getActivePromotions);

// Get promotion by ID
router.get('/promotions/:id', getPromotionById);

// Update promotion
router.put('/promotions/:id', updatePromotion);

// Delete promotion
router.delete('/promotions/:id', deletePromotion);

// =========================
// PROMOTION MENU ITEM ROUTES
// =========================

// Add menu item to promotion
router.post('/promotion-menu-items', addPromotionMenuItem);

// Remove menu item from promotion
router.delete('/promotion-menu-items/:id', removePromotionMenuItem);

// Bulk add menu items to promotion
router.post('/promotion-menu-items/bulk-add', bulkAddPromotionMenuItems);

export default router;
