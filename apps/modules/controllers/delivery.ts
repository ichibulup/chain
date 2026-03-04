import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import {
  // Delivery staff services
  createDeliveryStaff as createDeliveryStaffService,
  getDeliveryStaffById as getDeliveryStaffByIdService,
  getDeliveryStaff as getDeliveryStaffService,
  updateDeliveryStaff as updateDeliveryStaffService,
  deleteDeliveryStaff as deleteDeliveryStaffService,
  
  // Delivery services
  createDelivery as createDeliveryService,
  getDeliveryById as getDeliveryByIdService,
  getDeliveries as getDeliveriesService,
  updateDelivery as updateDeliveryService,
  deleteDelivery as deleteDeliveryService,
  
  // Delivery location services
  createDeliveryLocation as createDeliveryLocationService,
  getDeliveryLocationById as getDeliveryLocationByIdService,
  getDeliveryLocations as getDeliveryLocationsService,
  updateDeliveryLocation as updateDeliveryLocationService,
  deleteDeliveryLocation as deleteDeliveryLocationService,
  
  // Delivery zone services
  createDeliveryZone as createDeliveryZoneService,
  getDeliveryZoneById as getDeliveryZoneByIdService,
  getDeliveryZones as getDeliveryZonesService,
  updateDeliveryZone as updateDeliveryZoneService,
  deleteDeliveryZone as deleteDeliveryZoneService,
  
  // Bulk operation services
  bulkUpdateDeliveryStaffStatus as bulkUpdateDeliveryStaffStatusService,
  bulkUpdateDeliveryStatus as bulkUpdateDeliveryStatusService,
  
  // Special query services
  getDeliveryStaffAvailability as getDeliveryStaffAvailabilityService,
  getDeliveryByTrackingCode as getDeliveryByTrackingCodeService,
  checkDeliveryZoneCoverage as checkDeliveryZoneCoverageService,
  getDeliveryStatistics as getDeliveryStatisticsService,
  getDeliveryPerformance as getDeliveryPerformanceService,
  
  // Existence check services
  checkOrderExists,
  checkDeliveryStaffExists,
  checkDeliveryExists,
  checkDeliveryZoneExists,
} from '@/services/delivery';
import {
  checkUserExists,
  checkRestaurantExists
} from '@/services/helper'
import {
  CreateDeliveryStaffSchema,
  UpdateDeliveryStaffSchema,
  DeliveryStaffQuerySchema,
  CreateDeliverySchema,
  UpdateDeliverySchema,
  DeliveryQuerySchema,
  CreateDeliveryLocationSchema,
  UpdateDeliveryLocationSchema,
  DeliveryLocationQuerySchema,
  CreateDeliveryZoneSchema,
  UpdateDeliveryZoneSchema,
  DeliveryZoneQuerySchema,
  BulkUpdateDeliveryStaffStatusSchema,
  BulkUpdateDeliveryStatusSchema,
  DeliveryStaffAvailabilityQuerySchema,
  DeliveryTrackingQuerySchema,
  DeliveryZoneCoverageQuerySchema,
  DeliveryStatisticsQuerySchema,
  DeliveryPerformanceQuerySchema,
} from '@/schemas/delivery';

// =========================
// DELIVERY STAFF CONTROLLERS
// =========================

/**
 * Create a new delivery staff
 */
export const createDeliveryStaff = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateDeliveryStaffSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate user exists
    const userExists = await checkUserExists(validatedData.userId);

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const deliveryStaff = await createDeliveryStaffService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Delivery staff created successfully',
      data: deliveryStaff
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create delivery staff';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get delivery staff by ID
 */
export const getDeliveryStaffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery staff ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery staff ID is not valid'
      });
    }

    const deliveryStaff = await getDeliveryStaffByIdService(id);

    if (!deliveryStaff) {
      return res.status(404).json({
        success: false,
        message: 'Delivery staff not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery staff found',
      data: deliveryStaff,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery staff';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all delivery staff with filtering and pagination
 */
export const getDeliveryStaff = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryStaffQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getDeliveryStaffService(result.data);

    res.status(200).json({
      success: true,
      message: 'Delivery staff retrieved successfully',
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery staff';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update delivery staff
 */
export const updateDeliveryStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery staff ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery staff ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateDeliveryStaffSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate delivery staff exists
    const deliveryStaffExists = await checkDeliveryStaffExists(id);

    if (!deliveryStaffExists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery staff not found'
      });
    }

    const deliveryStaff = await updateDeliveryStaffService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Delivery staff updated successfully',
      data: deliveryStaff
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update delivery staff';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete delivery staff
 */
export const deleteDeliveryStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery staff ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery staff ID is not valid'
      });
    }

    // Validate delivery staff exists
    const deliveryStaffExists = await checkDeliveryStaffExists(id);

    if (!deliveryStaffExists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery staff not found'
      });
    }

    await deleteDeliveryStaffService(id);

    res.status(200).json({
      success: true,
      message: 'Delivery staff deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete delivery staff';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// DELIVERY CONTROLLERS
// =========================

/**
 * Create a new delivery
 */
export const createDelivery = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateDeliverySchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate order exists
    const orderExists = await checkOrderExists(validatedData.orderId);

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);

    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Validate delivery staff exists if provided
    if (validatedData.deliveryStaffId) {
      const deliveryStaffExists = await checkDeliveryStaffExists(validatedData.deliveryStaffId);

      if (!deliveryStaffExists) {
        return res.status(404).json({
          success: false,
          message: 'Delivery staff not found'
        });
      }
    }

    const delivery = await createDeliveryService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: delivery
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create delivery';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get delivery by ID
 */
export const getDeliveryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery ID is not valid'
      });
    }

    const delivery = await getDeliveryByIdService(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery found',
      data: delivery,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all deliveries with filtering and pagination
 */
export const getDeliveries = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getDeliveriesService(result.data);

    res.status(200).json({
      success: true,
      message: 'Deliveries retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get deliveries';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update delivery
 */
export const updateDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateDeliverySchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate delivery staff exists if provided
    if (validatedData.deliveryStaffId) {
      const deliveryStaffExists = await checkDeliveryStaffExists(validatedData.deliveryStaffId);

      if (!deliveryStaffExists) {
        return res.status(404).json({
          success: false,
          message: 'Delivery staff not found'
        });
      }
    }

    const delivery = await updateDeliveryService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Delivery updated successfully',
      data: delivery
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update delivery';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete delivery
 */
export const deleteDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery ID is not valid'
      });
    }

    // Validate delivery exists
    const deliveryExists = await checkDeliveryExists(id);

    if (!deliveryExists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    await deleteDeliveryService(id);

    res.status(200).json({
      success: true,
      message: 'Delivery deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete delivery';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// DELIVERY LOCATION CONTROLLERS
// =========================

/**
 * Create a new delivery location
 */
export const createDeliveryLocation = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateDeliveryLocationSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate delivery exists
    const deliveryExists = await checkDeliveryExists(validatedData.deliveryId);

    if (!deliveryExists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    const deliveryLocation = await createDeliveryLocationService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Delivery location created successfully',
      data: deliveryLocation
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create delivery location';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get delivery location by ID
 */
export const getDeliveryLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery location ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery location ID is not valid'
      });
    }

    const deliveryLocation = await getDeliveryLocationByIdService(id);

    if (!deliveryLocation) {
      return res.status(404).json({
        success: false,
        message: 'Delivery location not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery location found',
      data: deliveryLocation,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery location';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all delivery locations with filtering and pagination
 */
export const getDeliveryLocations = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryLocationQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getDeliveryLocationsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Delivery locations retrieved successfully',
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery locations';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update delivery location
 */
export const updateDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery location ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery location ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateDeliveryLocationSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const deliveryLocation = await updateDeliveryLocationService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Delivery location updated successfully',
      data: deliveryLocation
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update delivery location';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete delivery location
 */
export const deleteDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery location ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery location ID is not valid'
      });
    }

    await deleteDeliveryLocationService(id);

    res.status(200).json({
      success: true,
      message: 'Delivery location deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete delivery location';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// DELIVERY ZONE CONTROLLERS
// =========================

/**
 * Create a new delivery zone
 */
export const createDeliveryZone = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateDeliveryZoneSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate restaurant exists
    const restaurantExists = await checkRestaurantExists(validatedData.restaurantId);

    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const deliveryZone = await createDeliveryZoneService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Delivery zone created successfully',
      data: deliveryZone
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create delivery zone';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get delivery zone by ID
 */
export const getDeliveryZoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery zone ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery zone ID is not valid'
      });
    }

    const deliveryZone = await getDeliveryZoneByIdService(id);

    if (!deliveryZone) {
      return res.status(404).json({
        success: false,
        message: 'Delivery zone not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery zone found',
      data: deliveryZone,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery zone';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all delivery zones with filtering and pagination
 */
export const getDeliveryZones = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryZoneQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getDeliveryZonesService(result.data);

    res.status(200).json({
      success: true,
      message: 'Delivery zones retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery zones';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update delivery zone
 */
export const updateDeliveryZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery zone ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery zone ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateDeliveryZoneSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate delivery zone exists
    const deliveryZoneExists = await checkDeliveryZoneExists(id);

    if (!deliveryZoneExists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery zone not found'
      });
    }

    const deliveryZone = await updateDeliveryZoneService(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Delivery zone updated successfully',
      data: deliveryZone
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update delivery zone';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete delivery zone
 */
export const deleteDeliveryZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Delivery zone ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery zone ID is not valid'
      });
    }

    // Validate delivery zone exists
    const deliveryZoneExists = await checkDeliveryZoneExists(id);

    if (!deliveryZoneExists) {
      return res.status(404).json({
        success: false,
        message: 'Delivery zone not found'
      });
    }

    await deleteDeliveryZoneService(id);

    res.status(200).json({
      success: true,
      message: 'Delivery zone deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete delivery zone';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// BULK OPERATION CONTROLLERS
// =========================

/**
 * Bulk update delivery staff status
 */
export const bulkUpdateDeliveryStaffStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdateDeliveryStaffStatusSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const response = await bulkUpdateDeliveryStaffStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update delivery staff status';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Bulk update delivery status
 */
export const bulkUpdateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdateDeliveryStatusSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const response = await bulkUpdateDeliveryStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update delivery status';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// SPECIAL QUERY CONTROLLERS
// =========================

/**
 * Get delivery staff availability
 */
export const getDeliveryStaffAvailability = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryStaffAvailabilityQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const availableStaff = await getDeliveryStaffAvailabilityService(result.data);

    res.status(200).json({
      success: true,
      message: 'Delivery staff availability retrieved successfully',
      data: availableStaff
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery staff availability';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get delivery by tracking code
 */
export const getDeliveryByTrackingCode = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryTrackingQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const delivery = await getDeliveryByTrackingCodeService(result.data);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery found',
      data: delivery
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery by tracking code';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Check delivery zone coverage
 */
export const checkDeliveryZoneCoverage = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryZoneCoverageQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const coverage = await checkDeliveryZoneCoverageService(result.data);

    res.status(200).json({
      success: true,
      message: 'Delivery zone coverage checked successfully',
      data: coverage
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check delivery zone coverage';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get delivery statistics
 */
export const getDeliveryStatistics = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryStatisticsQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const statistics = await getDeliveryStatisticsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Delivery statistics retrieved successfully',
      data: statistics
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery statistics';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get delivery performance
 */
export const getDeliveryPerformance = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await DeliveryPerformanceQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const performance = await getDeliveryPerformanceService(result.data);

    res.status(200).json({
      success: true,
      message: 'Delivery performance retrieved successfully',
      data: performance
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery performance';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};
