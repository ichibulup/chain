import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import { getUserIdFromRequest, requireUserIdFromRequest } from '@/lib/utils/auth';
import {
  getActorOrThrow,
  isAdminRole,
  requireManagerAccessToStaff,
  requireManagerOrAdminForRestaurant,
} from '@/lib/utils/permissions';
import { prisma } from '@/lib/prisma';
import {
  // Table services
  createTable as createTableService,
  getTableById as getTableByIdService,
  getTables as getTablesService,
  updateTable as updateTableService,
  deleteTable as deleteTableService,
  
  // Reservation services
  createReservation as createReservationService,
  getReservationById as getReservationByIdService,
  getReservations as getReservationsService,
  updateReservation as updateReservationService,
  deleteReservation as deleteReservationService,
  
  // Table order services
  createTableOrder as createTableOrderService,
  getTableOrderById as getTableOrderByIdService,
  getTableOrders as getTableOrdersService,
  updateTableOrder as updateTableOrderService,
  deleteTableOrder as deleteTableOrderService,
  
  // Staff schedule services
  createStaffSchedule as createStaffScheduleService,
  getStaffScheduleById as getStaffScheduleByIdService,
  getStaffSchedules as getStaffSchedulesService,
  updateStaffSchedule as updateStaffScheduleService,
  deleteStaffSchedule as deleteStaffScheduleService,
  
  // Staff attendance services
  createStaffAttendance as createStaffAttendanceService,
  getStaffAttendanceById as getStaffAttendanceByIdService,
  getStaffAttendance as getStaffAttendanceService,
  updateStaffAttendance as updateStaffAttendanceService,
  deleteStaffAttendance as deleteStaffAttendanceService,
  
  // Bulk operation services
  bulkUpdateTableStatus as bulkUpdateTableStatusService,
  bulkUpdateReservationStatus as bulkUpdateReservationStatusService,
  bulkUpdateStaffScheduleStatus as bulkUpdateStaffScheduleStatusService,
  
  // Special query services
  getTableAvailability as getTableAvailabilityService,
  checkStaffScheduleConflict as checkStaffScheduleConflictService,

  // Existence check services
  checkTableExists,
  checkOrderExists,
  checkStaffScheduleExists,
  checkStaffAttendanceExists,
} from '@/services/restaurant';
import {
  checkRestaurantExists,
  checkUserExists,
} from '@/services/helper';
import {
  CreateTableSchema,
  UpdateTableSchema,
  TableQuerySchema,
  CreateReservationSchema,
  UpdateReservationSchema,
  ReservationQuerySchema,
  CreateTableOrderSchema,
  UpdateTableOrderSchema,
  TableOrderQuerySchema,
  CreateStaffScheduleSchema,
  UpdateStaffScheduleSchema,
  StaffScheduleQuerySchema,
  CreateStaffAttendanceSchema,
  UpdateStaffAttendanceSchema,
  StaffAttendanceQuerySchema,
  BulkUpdateTableStatusSchema,
  BulkUpdateReservationStatusSchema,
  BulkUpdateStaffScheduleStatusSchema,
  TableAvailabilityQuerySchema,
  StaffScheduleConflictSchema,
} from '@/schemas/restaurant';

// =========================
// TABLE CONTROLLERS
// =========================

/**
 * Create a new table
 */
export const createTable = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateTableSchema.safeParseAsync(req.body);

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

    const table = await createTableService(validatedData);

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: table
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create table';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get table by ID
 */
export const getTableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is not valid'
      });
    }

    const table = await getTableByIdService(id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table found',
      data: table,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get table';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all tables with filtering and pagination
 */
export const getTables = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await TableQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getTablesService(result.data);

    res.status(200).json({
      success: true,
      message: 'Tables retrieved successfully',
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get tables';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update table
 */
export const updateTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateTableSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate table exists
    const tableExists = await checkTableExists(id);

    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const table = await updateTableService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: table
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update table';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete table
 */
export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is not valid'
      });
    }

    // Validate table exists
    const tableExists = await checkTableExists(id);

    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    await deleteTableService(id);

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete table';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// RESERVATION CONTROLLERS
// =========================

/**
 * Create a new reservation
 */
export const createReservation = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateReservationSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate table exists (only when tableId is provided)
    if (validatedData.tableId) {
      const tableExists = await checkTableExists(validatedData.tableId);

      if (!tableExists) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }
    }

    // Validate customer exists if provided
    if (validatedData.customerId) {
      const customerExists = await checkUserExists(validatedData.customerId);

      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const reservation = await createReservationService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get reservation by ID
 */
export const getReservationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is not valid'
      });
    }

    const reservation = await getReservationByIdService(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reservation found',
      data: reservation,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get reservation';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all reservations with filtering and pagination
 */
export const getReservations = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await ReservationQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getReservationsService(result.data);

    res.status(200).json({
      success: true,
      message: 'Reservations retrieved successfully',
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get reservations';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update reservation
 */
export const updateReservation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateReservationSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate table exists if provided
    if (validatedData.tableId) {
      const tableExists = await checkTableExists(validatedData.tableId);

      if (!tableExists) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }
    }

    // Validate customer exists if provided
    if (validatedData.customerId) {
      const customerExists = await checkUserExists(validatedData.customerId);

      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const reservation = await updateReservationService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Reservation updated successfully',
      data: reservation
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update reservation';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete reservation
 */
export const deleteReservation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is not valid'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteReservationService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete reservation';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// TABLE ORDER CONTROLLERS
// =========================

/**
 * Create a new table order
 */
export const createTableOrder = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateTableOrderSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate table exists
    const tableExists = await checkTableExists(validatedData.tableId);

    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Validate staff exists if provided
    if (validatedData.staffId) {
      const staffExists = await checkUserExists(validatedData.staffId);

      if (!staffExists) {
        return res.status(404).json({
          success: false,
          message: 'Staff not found'
        });
      }
    }

    // Validate order exists if provided
    if (validatedData.orderId) {
      const orderExists = await checkOrderExists(validatedData.orderId);

      if (!orderExists) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const tableOrder = await createTableOrderService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Table order created successfully',
      data: tableOrder
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create table order';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get table order by ID
 */
export const getTableOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Table order ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Table order ID is not valid'
      });
    }

    const tableOrder = await getTableOrderByIdService(id);

    if (!tableOrder) {
      return res.status(404).json({
        success: false,
        message: 'Table order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table order found',
      data: tableOrder,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get table order';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all table orders with filtering and pagination
 */
export const getTableOrders = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await TableOrderQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getTableOrdersService(result.data);

    res.status(200).json({
      success: true,
      message: 'Table orders retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get table orders';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update table order
 */
export const updateTableOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Table order ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Table order ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateTableOrderSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate staff exists if provided
    if (validatedData.staffId) {
      const staffExists = await checkUserExists(validatedData.staffId);

      if (!staffExists) {
        return res.status(404).json({
          success: false,
          message: 'Staff not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const tableOrder = await updateTableOrderService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Table order updated successfully',
      data: tableOrder
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update table order';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete table order
 */
export const deleteTableOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Table order ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Table order ID is not valid'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteTableOrderService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Table order deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete table order';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// STAFF SCHEDULE CONTROLLERS
// =========================

/**
 * Create a new staff schedule
 */
export const createStaffSchedule = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateStaffScheduleSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const userId = requireUserIdFromRequest(req);
    try {
      await requireManagerOrAdminForRestaurant(userId, validatedData.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    // Validate staff exists
    const staffExists = await checkUserExists(validatedData.staffId);

    if (!staffExists) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
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

    const staffSchedule = await createStaffScheduleService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Staff schedule created successfully',
      data: staffSchedule
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create staff schedule';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get staff schedule by ID
 */
export const getStaffScheduleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Staff schedule ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Staff schedule ID is not valid'
      });
    }

    const userId = requireUserIdFromRequest(req);
    const staffSchedule = await getStaffScheduleByIdService(id);

    if (!staffSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Staff schedule not found'
      });
    }

    try {
      await requireManagerOrAdminForRestaurant(userId, staffSchedule.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff schedule found',
      data: staffSchedule,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get staff schedule';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all staff schedules with filtering and pagination
 */
export const getStaffSchedules = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await StaffScheduleQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const userId = requireUserIdFromRequest(req);
    const actor = await getActorOrThrow(userId);

    if (result.data.restaurantId) {
      try {
        await requireManagerOrAdminForRestaurant(userId, result.data.restaurantId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Forbidden';
        const status = message === 'Restaurant not found' ? 404 : 403;
        return res.status(status).json({
          success: false,
          message,
        });
      }
    } else if (!isAdminRole(actor.role)) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required'
      });
    }

    const response = await getStaffSchedulesService(result.data);

    res.status(200).json({
      success: true,
      message: 'Staff schedules retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get staff schedules';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update staff schedule
 */
export const updateStaffSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Staff schedule ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Staff schedule ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateStaffScheduleSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const userId = requireUserIdFromRequest(req);
    const existingSchedule = await getStaffScheduleByIdService(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Staff schedule not found'
      });
    }

    try {
      await requireManagerOrAdminForRestaurant(userId, existingSchedule.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const staffSchedule = await updateStaffScheduleService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Staff schedule updated successfully',
      data: staffSchedule
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update staff schedule';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete staff schedule
 */
export const deleteStaffSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Staff schedule ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Staff schedule ID is not valid'
      });
    }

    const userId = requireUserIdFromRequest(req);
    const existingSchedule = await getStaffScheduleByIdService(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Staff schedule not found'
      });
    }

    try {
      await requireManagerOrAdminForRestaurant(userId, existingSchedule.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    await deleteStaffScheduleService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Staff schedule deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete staff schedule';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// =========================
// STAFF ATTENDANCE CONTROLLERS
// =========================

/**
 * Create a new staff attendance
 */
export const createStaffAttendance = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await CreateStaffAttendanceSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate staff exists
    const staffExists = await checkUserExists(validatedData.staffId);

    if (!staffExists) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
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

    // Validate schedule exists if provided
    if (validatedData.scheduleId) {
      const scheduleExists = await checkStaffScheduleExists(validatedData.scheduleId);

      if (!scheduleExists) {
        return res.status(404).json({
          success: false,
          message: 'Staff schedule not found'
        });
      }
    }

    const userId = getUserIdFromRequest(req);
    const staffAttendance = await createStaffAttendanceService(validatedData, userId);

    res.status(201).json({
      success: true,
      message: 'Staff attendance created successfully',
      data: staffAttendance
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create staff attendance';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get staff attendance by ID
 */
export const getStaffAttendanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Staff attendance ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Staff attendance ID is not valid'
      });
    }

    const staffAttendance = await getStaffAttendanceByIdService(id);

    if (!staffAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Staff attendance not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff attendance found',
      data: staffAttendance,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get staff attendance';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get all staff attendance with filtering and pagination
 */
export const getStaffAttendance = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await StaffAttendanceQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const response = await getStaffAttendanceService(result.data);

    res.status(200).json({
      success: true,
      message: 'Staff attendance retrieved successfully',
      data: response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get staff attendance';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Update staff attendance
 */
export const updateStaffAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Staff attendance ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Staff attendance ID is not valid'
      });
    }

    // Validate request body
    const result = await UpdateStaffAttendanceSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate staff attendance exists
    const staffAttendanceExists = await checkStaffAttendanceExists(id);

    if (!staffAttendanceExists) {
      return res.status(404).json({
        success: false,
        message: 'Staff attendance not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    const staffAttendance = await updateStaffAttendanceService(id, validatedData, userId);

    res.status(200).json({
      success: true,
      message: 'Staff attendance updated successfully',
      data: staffAttendance
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update staff attendance';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Delete staff attendance
 */
export const deleteStaffAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Staff attendance ID is required'
      });
    }

    // Validate UUID format
    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Staff attendance ID is not valid'
      });
    }

    // Validate staff attendance exists
    const staffAttendanceExists = await checkStaffAttendanceExists(id);

    if (!staffAttendanceExists) {
      return res.status(404).json({
        success: false,
        message: 'Staff attendance not found'
      });
    }

    const userId = getUserIdFromRequest(req);
    await deleteStaffAttendanceService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Staff attendance deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete staff attendance';
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
 * Bulk update table status
 */
export const bulkUpdateTableStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdateTableStatusSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    // Validate all tables exist
    const tableExists = await Promise.all(
      validatedData.tableIds.map(id => checkTableExists(id))
    );

    const allExist = tableExists.every(exists => exists);

    if (!allExist) {
      return res.status(404).json({
        success: false,
        message: 'One or more tables not found'
      });
    }

    const response = await bulkUpdateTableStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update table status';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Bulk update reservation status
 */
export const bulkUpdateReservationStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdateReservationStatusSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const response = await bulkUpdateReservationStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update reservation status';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Bulk update staff schedule status
 */
export const bulkUpdateStaffScheduleStatus = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await BulkUpdateStaffScheduleStatusSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const validatedData = result.data;

    const userId = requireUserIdFromRequest(req);
    const actor = await getActorOrThrow(userId);

    // Validate all schedules exist
    const scheduleExists = await Promise.all(
      validatedData.scheduleIds.map(id => checkStaffScheduleExists(id))
    );

    const allExist = scheduleExists.every(exists => exists);

    if (!allExist) {
      return res.status(404).json({
        success: false,
        message: 'One or more staff schedules not found'
      });
    }

    if (!isAdminRole(actor.role)) {
      const schedules = await prisma.staffSchedule.findMany({
        where: { id: { in: validatedData.scheduleIds } },
        select: { restaurantId: true },
      });

      const restaurantIds = new Set(schedules.map(item => item.restaurantId));

      if (restaurantIds.size !== 1) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const [restaurantId] = Array.from(restaurantIds);
      try {
        await requireManagerOrAdminForRestaurant(userId, restaurantId!);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Forbidden';
        const status = message === 'Restaurant not found' ? 404 : 403;
        return res.status(status).json({
          success: false,
          message,
        });
      }
    }

    const response = await bulkUpdateStaffScheduleStatusService(validatedData);

    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update staff schedule status';
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
 * Get table availability
 */
export const getTableAvailability = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const result = await TableAvailabilityQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const availableTables = await getTableAvailabilityService(result.data);

    res.status(200).json({
      success: true,
      message: 'Table availability retrieved successfully',
      data: availableTables
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get table availability';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Check staff schedule conflict
 */
export const checkStaffScheduleConflict = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = await StaffScheduleConflictSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireManagerAccessToStaff(userId, result.data.staffId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      return res.status(403).json({
        success: false,
        message,
      });
    }

    const hasConflict = await checkStaffScheduleConflictService(result.data);

    res.status(200).json({
      success: true,
      message: 'Staff schedule conflict check completed',
      data: { hasConflict }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check staff schedule conflict';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};
