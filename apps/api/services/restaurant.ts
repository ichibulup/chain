import {
  CreateTable,
  UpdateTable,
  TableQuery,
  CreateReservation,
  UpdateReservation,
  ReservationQuery,
  CreateTableOrder,
  UpdateTableOrder,
  TableOrderQuery,
  CreateStaffSchedule,
  UpdateStaffSchedule,
  StaffScheduleQuery,
  CreateStaffAttendance,
  UpdateStaffAttendance,
  StaffAttendanceQuery,
  BulkUpdateTableStatus,
  BulkUpdateReservationStatus,
  BulkUpdateStaffScheduleStatus,
  TableAvailabilityQuery,
  StaffScheduleConflict,
} from '@/schemas/restaurant';
import {
  Reservation,
  StaffAttendance,
  StaffSchedule,
  Table,
  TableOrder,
} from '@/models/restaurant';
import { Order } from '@/models/order';
import { Restaurant, User } from '@/models/organization';
import { RestaurantShortly, UserShortly, TableShortly } from "lib/interfaces";

// =========================
// TABLE SERVICES
// =========================

/**
 * Create a new table
 */
export const createTable = async (data: CreateTable, userId?: string | null) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if table number already exists in restaurant
    const existingTable = await Table.findFirst({
      where: {
        restaurantId: data.restaurantId,
        tableNumber: data.tableNumber
      }
    });

    if (existingTable) {
      throw new Error('Table number already exists in this restaurant');
    }

    const table = await Table.create({
      data: {
        restaurantId: data.restaurantId,
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        location: data.location,
        status: data.status,
        qrCode: data.qrCode,
        createdById: userId || null,
      },
      include: {
        restaurant: true,
        reservations: true,
        tableOrders: true,
      },
    });

    return table;
  } catch (error) {
    console.error('Error creating table:', error);
    throw new Error('Failed to create table');
  }
};

/**
 * Get table by ID
 */
export const getTableById = async (id: string) => {
  try {
    const table = await Table.findUnique({
      where: { id },
      include: {
        restaurant: true,
        reservations: {
          orderBy: {
            reservationDate: 'desc',
          },
        },
        tableOrders: {
          orderBy: {
            openedAt: 'desc',
          },
        },
      },
    });

    return table;
  } catch (error) {
    console.error('Error getting table by ID:', error);
    throw new Error('Failed to get table');
  }
};

/**
 * Get all tables with filtering and pagination
 */
export const getTables = async (query: TableQuery) => {
  try {
    const {
      restaurantId,
      status,
      capacity,
      minCapacity,
      maxCapacity,
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

    if (status) {
      where.status = status;
    }

    if (capacity) {
      where.capacity = capacity;
    }

    if (minCapacity !== undefined || maxCapacity !== undefined) {
      where.capacity = {};
      if (minCapacity !== undefined) {
        where.capacity.gte = minCapacity;
      }
      if (maxCapacity !== undefined) {
        where.capacity.lte = maxCapacity;
      }
    }

    if (search) {
      where.OR = [
        { tableNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tables, total] = await Promise.all([
      Table.findMany({
        where,
        include: {
          restaurant: true,
          reservations: {
            where: {
              status: { in: ['pending', 'confirmed'] },
            },
            orderBy: {
              reservationDate: 'asc',
            },
          },
          tableOrders: {
            where: {
              status: 'active',
            },
            orderBy: {
              openedAt: 'desc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Table.count({ where }),
    ]);

    return {
      data: tables,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting tables:', error);
    throw new Error('Failed to get tables');
  }
};

/**
 * Update table
 */
export const updateTable = async (id: string, data: UpdateTable, userId?: string | null) => {
  try {
    const table = await Table.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        restaurant: true,
        reservations: true,
        tableOrders: true,
      },
    });

    return table;
  } catch (error) {
    console.error('Error updating table:', error);
    throw new Error('Failed to update table');
  }
};

/**
 * Delete table
 */
export const deleteTable = async (id: string, userId?: string | null) => {
  try {
    // Check if table has active reservations
    const activeReservations = await Reservation.count({
      where: {
        tableId: id,
        status: { in: ['pending', 'confirmed', 'seated'] },
      },
    });

    if (activeReservations > 0) {
      throw new Error('Cannot delete table with active reservations');
    }

    // Check if table has active orders
    const activeOrders = await TableOrder.count({
      where: {
        tableId: id,
        status: 'active',
      },
    });

    if (activeOrders > 0) {
      throw new Error('Cannot delete table with active orders');
    }

    const table = await Table.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Table deleted successfully', data: table };
  } catch (error) {
    console.error('Error deleting table:', error);
    throw new Error('Failed to delete table');
  }
};

// =========================
// RESERVATION SERVICES
// =========================

/**
 * Create a new reservation
 */
export const createReservation = async (data: CreateReservation, userId?: string | null) => {
  try {
    const demoTableId = "ff06b1f3-52f0-4635-90b1-c082529919e4"
    // Check if table exists
    const table = await Table.findUnique({
      where: { id: demoTableId }
    });

    if (!table) {
      throw new Error('Table not found');
    }

    // Check if customer exists (if provided)
    if (data.customerId) {
      const customer = await User.findUnique({
        where: { id: data.customerId }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }
    }

    // Check for conflicting reservations
    const conflictingReservation = await Reservation.findFirst({
      where: {
        tableId: data.tableId,
        status: { in: ['pending', 'confirmed', 'seated'] },
        reservationDate: {
          gte: new Date(data.reservationDate.getTime() - data.durationHours * 60 * 60 * 1000),
          lte: new Date(data.reservationDate.getTime() + data.durationHours * 60 * 60 * 1000),
        },
      },
    });

    if (conflictingReservation) {
      throw new Error('Table is already reserved for this time slot');
    }

    const reservation = await Reservation.create({
      data: {
        tableId: demoTableId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        partySize: data.partySize,
        reservationDate: data.reservationDate,
        durationHours: data.durationHours,
        specialRequests: data.specialRequests,
        notes: data.notes,
        restaurantId: data.restaurantId || table.restaurantId,
        // createdById: userId || null,
      },
      include: {
        table: {
          select: TableShortly
        },
        customer: {
          select: UserShortly
        },
        restaurant: {
          select: RestaurantShortly
        },
      },
    });

    return reservation;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw new Error('Failed to create reservation');
  }
};

/**
 * Get reservation by ID
 */
export const getReservationById = async (id: string) => {
  try {
    const reservation = await Reservation.findUnique({
      where: { id },
      include: {
        table: {
          select: TableShortly
        },
        customer: {
          select: UserShortly
        },
        restaurant: {
          select: RestaurantShortly
        },
      },
    });

    return reservation;
  } catch (error) {
    console.error('Error getting reservation by ID:', error);
    throw new Error('Failed to get reservation');
  }
};

/**
 * Get all reservations with filtering and pagination
 */
export const getReservations = async (query: ReservationQuery) => {
  try {
    const {
      restaurantId,
      tableId,
      customerId,
      status,
      startDate,
      endDate,
      partySize,
      minPartySize,
      maxPartySize,
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

    if (tableId) {
      where.tableId = tableId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.reservationDate = {};
      if (startDate) {
        where.reservationDate.gte = startDate;
      }
      if (endDate) {
        where.reservationDate.lte = endDate;
      }
    }

    if (partySize) {
      where.partySize = partySize;
    }

    if (minPartySize !== undefined || maxPartySize !== undefined) {
      where.partySize = {};
      if (minPartySize !== undefined) {
        where.partySize.gte = minPartySize;
      }
      if (maxPartySize !== undefined) {
        where.partySize.lte = maxPartySize;
      }
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reservations, total] = await Promise.all([
      Reservation.findMany({
        where,
        include: {
          table: {
            select: TableShortly
          },
          customer: {
            select: UserShortly
          },
          restaurant: {
            select: RestaurantShortly
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Reservation.count({ where }),
    ]);

    return {
      data: reservations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting reservations:', error);
    throw new Error('Failed to get reservations');
  }
};

/**
 * Update reservation
 */
export const updateReservation = async (id: string, data: UpdateReservation, userId?: string | null) => {
  try {
    const reservation = await Reservation.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
      },
      include: {
        table: {
          select: TableShortly
        },
        customer: {
          select: UserShortly
        },
        restaurant: {
          select: RestaurantShortly
        },
      },
    });

    return reservation;
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw new Error('Failed to update reservation');
  }
};

/**
 * Delete reservation
 */
export const deleteReservation = async (id: string, userId?: string | null) => {
  try {
    const reservation = await Reservation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Reservation deleted successfully', data: reservation };
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw new Error('Failed to delete reservation');
  }
};

// =========================
// TABLE ORDER SERVICES
// =========================

/**
 * Create a new table order
 */
export const createTableOrder = async (data: CreateTableOrder, userId?: string | null) => {
  try {
    // Check if table exists
    const table = await Table.findUnique({
      where: { id: data.tableId }
    });

    if (!table) {
      throw new Error('Table not found');
    }

    // Check if staff exists (if provided)
    if (data.staffId) {
      const staff = await User.findUnique({
        where: { id: data.staffId }
      });

      if (!staff) {
        throw new Error('Staff not found');
      }
    }

    // Check if order exists (if provided)
    if (data.orderId) {
      const order = await Order.findUnique({
        where: { id: data.orderId }
      });

      if (!order) {
        throw new Error('Order not found');
      }
    }

    const tableOrder = await TableOrder.create({
      data: {
        tableId: data.tableId,
        orderId: data.orderId,
        sessionCode: data.sessionCode,
        status: data.status,
        staffId: data.staffId,
        restaurantId: data.restaurantId || table.restaurantId,
        createdById: userId || null,
      },
      include: {
        table: {
          select: TableShortly
        },
        order: true,
        staff: true,
        restaurant: true,
      },
    });

    return tableOrder;
  } catch (error) {
    console.error('Error creating table order:', error);
    throw new Error('Failed to create table order');
  }
};

/**
 * Get table order by ID
 */
export const getTableOrderById = async (id: string) => {
  try {
    const tableOrder = await TableOrder.findUnique({
      where: { id },
      include: {
        table: {
          select: TableShortly
        },
        order: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        staff: true,
        restaurant: true,
      },
    });

    return tableOrder;
  } catch (error) {
    console.error('Error getting table order by ID:', error);
    throw new Error('Failed to get table order');
  }
};

/**
 * Get all table orders with filtering and pagination
 */
export const getTableOrders = async (query: TableOrderQuery) => {
  try {
    const {
      restaurantId,
      tableId,
      staffId,
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

    if (tableId) {
      where.tableId = tableId;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.openedAt = {};
      if (startDate) {
        where.openedAt.gte = startDate;
      }
      if (endDate) {
        where.openedAt.lte = endDate;
      }
    }

    if (search) {
      where.sessionCode = { contains: search, mode: 'insensitive' };
    }

    const [tableOrders, total] = await Promise.all([
      TableOrder.findMany({
        where,
        include: {
          table: {
            select: TableShortly
          },
          order: {
            include: {
              items: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
          staff: true,
          restaurant: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      TableOrder.count({ where }),
    ]);

    return {
      data: tableOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting table orders:', error);
    throw new Error('Failed to get table orders');
  }
};

/**
 * Update table order
 */
export const updateTableOrder = async (id: string, data: UpdateTableOrder, userId?: string | null) => {
  try {
    const tableOrder = await TableOrder.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
      },
      include: {
        table: {
          select: TableShortly
        },
        order: true,
        staff: true,
        restaurant: true,
      },
    });

    return tableOrder;
  } catch (error) {
    console.error('Error updating table order:', error);
    throw new Error('Failed to update table order');
  }
};

/**
 * Delete table order
 */
export const deleteTableOrder = async (id: string, userId?: string | null) => {
  try {
    const tableOrder = await TableOrder.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Table order deleted successfully', data: tableOrder };
  } catch (error) {
    console.error('Error deleting table order:', error);
    throw new Error('Failed to delete table order');
  }
};

// =========================
// STAFF SCHEDULE SERVICES
// =========================

/**
 * Create a new staff schedule
 */
export const createStaffSchedule = async (data: CreateStaffSchedule, userId?: string | null) => {
  try {
    // Check if staff exists
    const staff = await User.findUnique({
      where: { id: data.staffId }
    });

    if (!staff) {
      throw new Error('Staff not found');
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check for schedule conflicts
    const conflictingSchedule = await StaffSchedule.findFirst({
      where: {
        staffId: data.staffId,
        shiftDate: data.shiftDate,
        shiftType: data.shiftType,
        status: { not: 'cancelled' },
      },
    });

    if (conflictingSchedule) {
      throw new Error('Staff already has a schedule for this date and shift type');
    }

    const staffSchedule = await StaffSchedule.create({
      data: {
        staffId: data.staffId,
        restaurantId: data.restaurantId,
        shiftDate: data.shiftDate,
        shiftType: data.shiftType,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        notes: data.notes,
        createdById: userId || null,
      },
      include: {
        staff: true,
        restaurant: true,
        attendance: true,
      },
    });

    return staffSchedule;
  } catch (error) {
    console.error('Error creating staff schedule:', error);
    throw new Error('Failed to create staff schedule');
  }
};

/**
 * Get staff schedule by ID
 */
export const getStaffScheduleById = async (id: string) => {
  try {
    const staffSchedule = await StaffSchedule.findUnique({
      where: { id },
      include: {
        staff: true,
        restaurant: true,
        attendance: true,
      },
    });

    return staffSchedule;
  } catch (error) {
    console.error('Error getting staff schedule by ID:', error);
    throw new Error('Failed to get staff schedule');
  }
};

/**
 * Get all staff schedules with filtering and pagination
 */
export const getStaffSchedules = async (query: StaffScheduleQuery) => {
  try {
    const {
      restaurantId,
      staffId,
      shiftType,
      status,
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

    if (staffId) {
      where.staffId = staffId;
    }

    if (shiftType) {
      where.shiftType = shiftType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) {
        where.shiftDate.gte = startDate;
      }
      if (endDate) {
        where.shiftDate.lte = endDate;
      }
    }

    const [staffSchedules, total] = await Promise.all([
      StaffSchedule.findMany({
        where,
        include: {
          staff: true,
          restaurant: true,
          attendance: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      StaffSchedule.count({ where }),
    ]);

    return {
      data: staffSchedules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting staff schedules:', error);
    throw new Error('Failed to get staff schedules');
  }
};

/**
 * Update staff schedule
 */
export const updateStaffSchedule = async (id: string, data: UpdateStaffSchedule, userId?: string | null) => {
  try {
    const staffSchedule = await StaffSchedule.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        staff: true,
        restaurant: true,
        attendance: true,
      },
    });

    return staffSchedule;
  } catch (error) {
    console.error('Error updating staff schedule:', error);
    throw new Error('Failed to update staff schedule');
  }
};

/**
 * Delete staff schedule
 */
export const deleteStaffSchedule = async (id: string, userId?: string | null) => {
  try {
    const staffSchedule = await StaffSchedule.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Staff schedule deleted successfully', data: staffSchedule };
  } catch (error) {
    console.error('Error deleting staff schedule:', error);
    throw new Error('Failed to delete staff schedule');
  }
};

// =========================
// STAFF ATTENDANCE SERVICES
// =========================

/**
 * Create a new staff attendance
 */
export const createStaffAttendance = async (data: CreateStaffAttendance, userId?: string | null) => {
  try {
    // Check if staff exists
    const staff = await User.findUnique({
      where: { id: data.staffId }
    });

    if (!staff) {
      throw new Error('Staff not found');
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if schedule exists (if provided)
    if (data.scheduleId) {
      const schedule = await StaffSchedule.findUnique({
        where: { id: data.scheduleId }
      });

      if (!schedule) {
        throw new Error('Staff schedule not found');
      }
    }

    // Check if attendance already exists for this date
    const existingAttendance = await StaffAttendance.findFirst({
      where: {
        staffId: data.staffId,
        workDate: data.workDate,
      },
    });

    if (existingAttendance) {
      throw new Error('Attendance already exists for this date');
    }

    const staffAttendance = await StaffAttendance.create({
      data: {
        staffId: data.staffId,
        restaurantId: data.restaurantId,
        scheduleId: data.scheduleId,
        workDate: data.workDate,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        breakMinutes: data.breakMinutes,
        overtimeHours: data.overtimeHours,
        totalHours: data.totalHours,
        notes: data.notes,
        createdById: userId || null,
      },
      include: {
        staff: true,
        restaurant: true,
        schedule: true,
      },
    });

    return staffAttendance;
  } catch (error) {
    console.error('Error creating staff attendance:', error);
    throw new Error('Failed to create staff attendance');
  }
};

/**
 * Get staff attendance by ID
 */
export const getStaffAttendanceById = async (id: string) => {
  try {
    const staffAttendance = await StaffAttendance.findUnique({
      where: { id },
      include: {
        staff: true,
        restaurant: true,
        schedule: true,
      },
    });

    return staffAttendance;
  } catch (error) {
    console.error('Error getting staff attendance by ID:', error);
    throw new Error('Failed to get staff attendance');
  }
};

/**
 * Get all staff attendance with filtering and pagination
 */
export const getStaffAttendance = async (query: StaffAttendanceQuery) => {
  try {
    const {
      restaurantId,
      staffId,
      scheduleId,
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

    if (staffId) {
      where.staffId = staffId;
    }

    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    if (startDate || endDate) {
      where.workDate = {};
      if (startDate) {
        where.workDate.gte = startDate;
      }
      if (endDate) {
        where.workDate.lte = endDate;
      }
    }

    const [staffAttendance, total] = await Promise.all([
      StaffAttendance.findMany({
        where,
        include: {
          staff: true,
          restaurant: true,
          schedule: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      StaffAttendance.count({ where }),
    ]);

    return {
      data: staffAttendance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting staff attendance:', error);
    throw new Error('Failed to get staff attendance');
  }
};

/**
 * Update staff attendance
 */
export const updateStaffAttendance = async (id: string, data: UpdateStaffAttendance, userId?: string | null) => {
  try {
    const staffAttendance = await StaffAttendance.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId || undefined,
        updatedAt: new Date(),
      },
      include: {
        staff: true,
        restaurant: true,
        schedule: true,
      },
    });

    return staffAttendance;
  } catch (error) {
    console.error('Error updating staff attendance:', error);
    throw new Error('Failed to update staff attendance');
  }
};

/**
 * Delete staff attendance
 */
export const deleteStaffAttendance = async (id: string, userId?: string | null) => {
  try {
    const staffAttendance = await StaffAttendance.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId || null,
      },
    });

    return { message: 'Staff attendance deleted successfully', data: staffAttendance };
  } catch (error) {
    console.error('Error deleting staff attendance:', error);
    throw new Error('Failed to delete staff attendance');
  }
};

// =========================
// BULK OPERATION SERVICES
// =========================

/**
 * Bulk update table status
 */
export const bulkUpdateTableStatus = async (data: BulkUpdateTableStatus) => {
  try {
    const { tableIds, status } = data;

    await Table.updateMany({
      where: {
        id: { in: tableIds },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return { message: `${tableIds.length} tables status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating table status:', error);
    throw new Error('Failed to bulk update table status');
  }
};

/**
 * Bulk update reservation status
 */
export const bulkUpdateReservationStatus = async (data: BulkUpdateReservationStatus) => {
  try {
    const { reservationIds, status } = data;

    await Reservation.updateMany({
      where: {
        id: { in: reservationIds },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return { message: `${reservationIds.length} reservations status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating reservation status:', error);
    throw new Error('Failed to bulk update reservation status');
  }
};

/**
 * Bulk update staff schedule status
 */
export const bulkUpdateStaffScheduleStatus = async (data: BulkUpdateStaffScheduleStatus) => {
  try {
    const { scheduleIds, status } = data;

    await StaffSchedule.updateMany({
      where: {
        id: { in: scheduleIds },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return { message: `${scheduleIds.length} staff schedules status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating staff schedule status:', error);
    throw new Error('Failed to bulk update staff schedule status');
  }
};

// =========================
// SPECIAL QUERY SERVICES
// =========================

/**
 * Get table availability
 */
export const getTableAvailability = async (query: TableAvailabilityQuery) => {
  try {
    const { restaurantId, date, partySize, durationHours } = query;

    // Get all tables in restaurant with sufficient capacity
    const availableTables = await Table.findMany({
      where: {
        restaurantId,
        capacity: { gte: partySize },
        status: 'available',
      },
      include: {
        reservations: {
          where: {
            status: { in: ['pending', 'confirmed', 'seated'] },
            reservationDate: {
              gte: new Date(date.getTime() - durationHours * 60 * 60 * 1000),
              lte: new Date(date.getTime() + durationHours * 60 * 60 * 1000),
            },
          },
        },
        tableOrders: {
          where: {
            status: 'active',
            openedAt: {
              gte: new Date(date.getTime() - durationHours * 60 * 60 * 1000),
              lte: new Date(date.getTime() + durationHours * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    // Filter out tables with conflicts
    const trulyAvailableTables = availableTables.filter(table => 
      table.reservations.length === 0 && table.tableOrders.length === 0
    );

    return trulyAvailableTables;
  } catch (error) {
    console.error('Error getting table availability:', error);
    throw new Error('Failed to get table availability');
  }
};

/**
 * Check staff schedule conflict
 */
export const checkStaffScheduleConflict = async (data: StaffScheduleConflict) => {
  try {
    const { staffId, shiftDate, startTime, endTime, excludeScheduleId } = data;

    const conflictingSchedule = await StaffSchedule.findFirst({
      where: {
        staffId,
        shiftDate,
        status: { not: 'cancelled' },
        ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return !!conflictingSchedule;
  } catch (error) {
    console.error('Error checking staff schedule conflict:', error);
    throw new Error('Failed to check staff schedule conflict');
  }
};

// =========================
// EXISTENCE CHECK SERVICES
// =========================

/**
 * Check if table exists
 */
export const checkTableExists = async (tableId: string): Promise<boolean> => {
  try {
    const table = await Table.findUnique({
      where: { id: tableId },
      select: { id: true },
    });
    return !!table;
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
};

/**
 * Check if order exists
 */
export const checkOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    const order = await Order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    return !!order;
  } catch (error) {
    console.error('Error checking order existence:', error);
    return false;
  }
};

/**
 * Check if staff schedule exists
 */
export const checkStaffScheduleExists = async (scheduleId: string): Promise<boolean> => {
  try {
    const schedule = await StaffSchedule.findUnique({
      where: { id: scheduleId },
      select: { id: true },
    });
    return !!schedule;
  } catch (error) {
    console.error('Error checking staff schedule existence:', error);
    return false;
  }
};

/**
 * Check if staff attendance exists
 */
export const checkStaffAttendanceExists = async (attendanceId: string): Promise<boolean> => {
  try {
    const attendance = await StaffAttendance.findUnique({
      where: { id: attendanceId },
      select: { id: true },
    });
    return !!attendance;
  } catch (error) {
    console.error('Error checking staff attendance existence:', error);
    return false;
  }
};
