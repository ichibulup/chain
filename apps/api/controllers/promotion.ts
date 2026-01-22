import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import {
  // Voucher services
  createVoucher as createVoucherService,
  getVoucherById as getVoucherByIdService,
  getVoucherByCode as getVoucherByCodeService,
  getVouchers as getVouchersService,
  updateVoucher as updateVoucherService,
  deleteVoucher as deleteVoucherService,
  validateVoucher as validateVoucherService,
  
  // Voucher usage services
  createVoucherUsage as createVoucherUsageService,
  getVoucherUsages as getVoucherUsagesService,
  
  // Promotion services
  createPromotion as createPromotionService,
  getPromotionById as getPromotionByIdService,
  getPromotions as getPromotionsService,
  updatePromotion as updatePromotionService,
  deletePromotion as deletePromotionService,
  getActivePromotions as getActivePromotionsService,
  
  // Promotion menu item services
  addPromotionMenuItem as addPromotionMenuItemService,
  removePromotionMenuItem as removePromotionMenuItemService,
  bulkAddPromotionMenuItems as bulkAddPromotionMenuItemsService,
} from '@/services/promotion';
import {
  CreateVoucherSchema,
  UpdateVoucherSchema,
  VoucherQuerySchema,
  ValidateVoucherSchema,
  CreateVoucherUsageSchema,
  CreatePromotionSchema,
  UpdatePromotionSchema,
  PromotionQuerySchema,
  CreatePromotionMenuItemSchema,
  BulkAddPromotionMenuItemsSchema,
} from '@/schemas/promotion';

// =========================
// VOUCHER CONTROLLERS
// =========================

/**
 * Create a new voucher
 */
export const createVoucher = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateVoucherSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const voucher = await createVoucherService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Voucher created successfully',
      data: voucher
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create voucher';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get voucher by ID
 */
export const getVoucherById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID is not valid'
      });
    }

    const voucher = await getVoucherByIdService(id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: voucher
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get voucher';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get voucher by code
 */
export const getVoucherByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code is required'
      });
    }

    const voucher = await getVoucherByCodeService(code);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: voucher
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get voucher';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all vouchers with pagination and filtering
 */
export const getVouchers = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await VoucherQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const query = result.data;
    const vouchers = await getVouchersService(query);

    res.status(200).json({
      success: true,
      ...vouchers
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get vouchers';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update voucher
 */
export const updateVoucher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateVoucherSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;
    const voucher = await updateVoucherService(id, validatedData);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Voucher updated successfully',
      data: voucher
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update voucher';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete voucher
 */
export const deleteVoucher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID is not valid'
      });
    }

    const voucher = await deleteVoucherService(id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Voucher deleted successfully',
      data: voucher
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete voucher';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Validate voucher
 */
export const validateVoucher = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await ValidateVoucherSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;
    const validation = await validateVoucherService(validatedData);

    res.status(200).json({
      success: true,
      message: 'Voucher is valid',
      data: validation
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate voucher';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// VOUCHER USAGE CONTROLLERS
// =========================

/**
 * Create voucher usage
 */
export const createVoucherUsage = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateVoucherUsageSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;
    const usage = await createVoucherUsageService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Voucher usage recorded successfully',
      data: usage
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create voucher usage';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get voucher usages by voucher ID
 */
export const getVoucherUsages = async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;

    if (!voucherId) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID is required'
      });
    }

    // Validate UUID format
    if (!validate(voucherId)) {
      return res.status(400).json({
        success: false,
        message: 'Voucher ID is not valid'
      });
    }

    const usages = await getVoucherUsagesService(voucherId);

    res.status(200).json({
      success: true,
      data: usages
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get voucher usages';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// PROMOTION CONTROLLERS
// =========================

/**
 * Create a new promotion
 */
export const createPromotion = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreatePromotionSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;
    const promotion = await createPromotionService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create promotion';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get promotion by ID
 */
export const getPromotionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is not valid'
      });
    }

    const promotion = await getPromotionByIdService(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get promotion';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all promotions with pagination and filtering
 */
export const getPromotions = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await PromotionQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const query = result.data;
    const promotions = await getPromotionsService(query);

    res.status(200).json({
      success: true,
      ...promotions
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get promotions';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get active promotions for a restaurant
 */
export const getActivePromotions = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required'
      });
    }

    // Validate UUID format
    if (!validate(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is not valid'
      });
    }

    const promotions = await getActivePromotionsService(restaurantId);

    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get active promotions';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update promotion
 */
export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdatePromotionSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;
    const promotion = await updatePromotionService(id, validatedData);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Promotion updated successfully',
      data: promotion
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update promotion';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete promotion
 */
export const deletePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is not valid'
      });
    }

    const promotion = await deletePromotionService(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully',
      data: promotion
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete promotion';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// PROMOTION MENU ITEM CONTROLLERS
// =========================

/**
 * Add menu item to promotion
 */
export const addPromotionMenuItem = async (req: Request, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!promotionId) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is required'
      });
    }

    // Validate UUID format
    if (!validate(promotionId)) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is not valid'
      });
    }

    // Validate request body
    const result = await CreatePromotionMenuItemSchema.safeParseAsync({
      ...req.body,
      promotionId
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;
    const promotionMenuItem = await addPromotionMenuItemService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Menu item added to promotion successfully',
      data: promotionMenuItem
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add menu item to promotion';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Remove menu item from promotion
 */
export const removePromotionMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Promotion menu item ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Promotion menu item ID is not valid'
      });
    }

    const promotionMenuItem = await removePromotionMenuItemService(id);

    if (!promotionMenuItem) {
      return res.status(404).json({
        success: false,
        message: 'Promotion menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item removed from promotion successfully',
      data: promotionMenuItem
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove menu item from promotion';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Bulk add menu items to promotion
 */
export const bulkAddPromotionMenuItems = async (req: Request, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!promotionId) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is required'
      });
    }

    // Validate UUID format
    if (!validate(promotionId)) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID is not valid'
      });
    }

    // Validate request body
    const result = await BulkAddPromotionMenuItemsSchema.safeParseAsync({
      promotionId,
      menuItemIds: req.body.menuItemIds
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;
    const result2 = await bulkAddPromotionMenuItemsService(validatedData);

    res.status(201).json({
      success: true,
      message: `${result2.count} menu items added to promotion successfully`,
      data: result2
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk add menu items to promotion';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};
