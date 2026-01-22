import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const TableStatus = z.enum(['available', 'occupied', 'reserved', 'maintenance', 'outOfOrder']);
export const ReservationStatus = z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'noShow']);
export const TableOrderStatus = z.enum(['active', 'completed', 'cancelled']);
export const StaffShiftType = z.enum(['morning', 'afternoon', 'evening', 'night', 'fullDay', 'splitShift']);
export const StaffScheduleStatus = z.enum(['scheduled', 'confirmed', 'inProgress', 'completed', 'absent', 'late', 'cancelled']);

// =========================
// TABLE SCHEMAS
// =========================

// Base Table schema
export const TableSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  tableNumber: z.string(),
  capacity: z.number().int().positive(),
  location: z.string().nullable(),
  status: TableStatus,
  qrCode: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Table schema
export const CreateTableSchema = z.object({
  restaurantId: z.string().uuid(),
  tableNumber: z.string().min(1, 'Table number is required').max(20, 'Table number too long'),
  capacity: z.number().int().positive('Capacity must be positive').max(20, 'Capacity too large'),
  location: z.string().max(100, 'Location too long').optional(),
  status: TableStatus.default('available'),
  qrCode: z.string().max(100, 'QR code too long').optional(),
});

// Update Table schema
export const UpdateTableSchema = z.object({
  tableNumber: z.string().min(1, 'Table number is required').max(20, 'Table number too long').optional(),
  capacity: z.number().int().positive('Capacity must be positive').max(20, 'Capacity too large').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  status: TableStatus.optional(),
  qrCode: z.string().max(100, 'QR code too long').optional(),
});

// Table Query schema
export const TableQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  status: TableStatus.optional(),
  capacity: z.number().int().positive().optional(),
  minCapacity: z.number().int().positive().optional(),
  maxCapacity: z.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['tableNumber', 'capacity', 'status', 'createdAt', 'updatedAt']).default('tableNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// RESERVATION SCHEMAS
// =========================

// Base Reservation schema
export const ReservationSchema = z.object({
  id: z.string().uuid(),
  tableId: z.string().uuid(),
  customerId: z.string().uuid().nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().nullable(),
  partySize: z.number().int().positive(),
  reservationDate: z.coerce.date(),
  durationHours: z.number().positive().max(24),
  status: ReservationStatus,
  specialRequests: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  restaurantId: z.string().uuid().nullable(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Reservation schema
export const CreateReservationSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  tableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Name too long'),
  customerPhone: z.string().min(1, 'Customer phone is required').max(20, 'Phone too long'),
  customerEmail: z.string().email('Invalid email format').max(100, 'Email too long').optional(),
  partySize: z.number().int().positive('Party size must be positive').max(20, 'Party size too large'),
  reservationDate: z.coerce.date(),
  durationHours: z.number().positive('Duration must be positive').max(24, 'Duration too long').default(2),
  specialRequests: z.string().max(500, 'Special requests too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine((data) => !!data.tableId || !!data.restaurantId, {
  message: 'Either tableId or restaurantId is required',
  path: ['restaurantId'],
});

// Update Reservation schema
export const UpdateReservationSchema = z.object({
  tableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Name too long').optional(),
  customerPhone: z.string().min(1, 'Customer phone is required').max(20, 'Phone too long').optional(),
  customerEmail: z.string().email('Invalid email format').max(100, 'Email too long').optional(),
  partySize: z.number().int().positive('Party size must be positive').max(20, 'Party size too large').optional(),
  reservationDate: z.coerce.date().optional(),
  durationHours: z.number().positive('Duration must be positive').max(24, 'Duration too long').optional(),
  status: ReservationStatus.optional(),
  specialRequests: z.string().max(500, 'Special requests too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Reservation Query schema
export const ReservationQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  tableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: ReservationStatus.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  partySize: z.number().int().positive().optional(),
  minPartySize: z.number().int().positive().optional(),
  maxPartySize: z.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['reservationDate', 'partySize', 'status', 'createdAt', 'updatedAt']).default('reservationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// TABLE ORDER SCHEMAS
// =========================

// Base TableOrder schema
export const TableOrderSchema = z.object({
  id: z.string().uuid(),
  tableId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  sessionCode: z.string(),
  status: TableOrderStatus,
  openedAt: z.date(),
  closedAt: z.date().nullable(),
  totalAmount: z.number().positive().nullable(),
  staffId: z.string().uuid().nullable(),
  restaurantId: z.string().uuid().nullable(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create TableOrder schema
export const CreateTableOrderSchema = z.object({
  tableId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  sessionCode: z.string().min(1, 'Session code is required').max(50, 'Session code too long'),
  status: TableOrderStatus.default('active'),
  staffId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
});

// Update TableOrder schema
export const UpdateTableOrderSchema = z.object({
  orderId: z.string().uuid().optional(),
  status: TableOrderStatus.optional(),
  totalAmount: z.number().positive().optional(),
  staffId: z.string().uuid().optional(),
});

// TableOrder Query schema
export const TableOrderQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  tableId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  status: TableOrderStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['openedAt', 'closedAt', 'totalAmount', 'status', 'createdAt']).default('openedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// STAFF SCHEDULE SCHEMAS
// =========================

// Base StaffSchedule schema
export const StaffScheduleSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  shiftDate: z.coerce.date(),
  shiftType: StaffShiftType,
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  status: StaffScheduleStatus,
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create StaffSchedule schema
export const CreateStaffScheduleSchema = z.object({
  staffId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  shiftDate: z.date(),
  shiftType: StaffShiftType,
  startTime: z.date(),
  endTime: z.date(),
  status: StaffScheduleStatus.default('scheduled'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Update StaffSchedule schema
export const UpdateStaffScheduleSchema = z.object({
  shiftDate: z.date().optional(),
  shiftType: StaffShiftType.optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  status: StaffScheduleStatus.optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// StaffSchedule Query schema
export const StaffScheduleQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  shiftType: StaffShiftType.optional(),
  status: StaffScheduleStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['shiftDate', 'startTime', 'endTime', 'status', 'createdAt']).default('shiftDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// STAFF ATTENDANCE SCHEMAS
// =========================

// Base StaffAttendance schema
export const StaffAttendanceSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  scheduleId: z.string().uuid().nullable(),
  workDate: z.date(),
  checkInTime: z.date().nullable(),
  checkOutTime: z.date().nullable(),
  breakMinutes: z.number().int().min(0).nullable(),
  overtimeHours: z.number().positive().max(24).nullable(),
  totalHours: z.number().positive().max(24).nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create StaffAttendance schema
export const CreateStaffAttendanceSchema = z.object({
  staffId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  scheduleId: z.string().uuid().optional(),
  workDate: z.date(),
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
  breakMinutes: z.number().int().min(0).optional(),
  overtimeHours: z.number().positive().max(24).optional(),
  totalHours: z.number().positive().max(24).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Update StaffAttendance schema
export const UpdateStaffAttendanceSchema = z.object({
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
  breakMinutes: z.number().int().min(0).optional(),
  overtimeHours: z.number().positive().max(24).optional(),
  totalHours: z.number().positive().max(24).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// StaffAttendance Query schema
export const StaffAttendanceQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  scheduleId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['workDate', 'checkInTime', 'checkOutTime', 'totalHours', 'createdAt']).default('workDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// BULK OPERATION SCHEMAS
// =========================

// Bulk update table status schema
export const BulkUpdateTableStatusSchema = z.object({
  tableIds: z.array(z.string().uuid()).min(1, 'At least one table is required'),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance', 'outOfOrder']),
});

// Bulk update reservation status schema
export const BulkUpdateReservationStatusSchema = z.object({
  reservationIds: z.array(z.string().uuid()).min(1, 'At least one reservation is required'),
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'noShow']),
});

// Bulk update staff schedule status schema
export const BulkUpdateStaffScheduleStatusSchema = z.object({
  scheduleIds: z.array(z.string().uuid()).min(1, 'At least one schedule is required'),
  status: z.enum(['scheduled', 'confirmed', 'inProgress', 'completed', 'absent', 'late', 'cancelled']),
});

// Table availability query schema
export const TableAvailabilityQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  date: z.date(),
  partySize: z.number().int().positive(),
  durationHours: z.number().positive().max(24).default(2),
});

// Staff schedule conflict check schema
export const StaffScheduleConflictSchema = z.object({
  staffId: z.string().uuid(),
  shiftDate: z.date(),
  startTime: z.date(),
  endTime: z.date(),
  excludeScheduleId: z.string().uuid().optional(),
});

// =========================
// EXPORT TYPE DEFINITIONS
// =========================

export type Table = z.infer<typeof TableSchema>;
export type CreateTable = z.infer<typeof CreateTableSchema>;
export type UpdateTable = z.infer<typeof UpdateTableSchema>;
export type TableQuery = z.infer<typeof TableQuerySchema>;

export type Reservation = z.infer<typeof ReservationSchema>;
export type CreateReservation = z.infer<typeof CreateReservationSchema>;
export type UpdateReservation = z.infer<typeof UpdateReservationSchema>;
export type ReservationQuery = z.infer<typeof ReservationQuerySchema>;

export type TableOrder = z.infer<typeof TableOrderSchema>;
export type CreateTableOrder = z.infer<typeof CreateTableOrderSchema>;
export type UpdateTableOrder = z.infer<typeof UpdateTableOrderSchema>;
export type TableOrderQuery = z.infer<typeof TableOrderQuerySchema>;

export type StaffSchedule = z.infer<typeof StaffScheduleSchema>;
export type CreateStaffSchedule = z.infer<typeof CreateStaffScheduleSchema>;
export type UpdateStaffSchedule = z.infer<typeof UpdateStaffScheduleSchema>;
export type StaffScheduleQuery = z.infer<typeof StaffScheduleQuerySchema>;

export type StaffAttendance = z.infer<typeof StaffAttendanceSchema>;
export type CreateStaffAttendance = z.infer<typeof CreateStaffAttendanceSchema>;
export type UpdateStaffAttendance = z.infer<typeof UpdateStaffAttendanceSchema>;
export type StaffAttendanceQuery = z.infer<typeof StaffAttendanceQuerySchema>;

export type BulkUpdateTableStatus = z.infer<typeof BulkUpdateTableStatusSchema>;
export type BulkUpdateReservationStatus = z.infer<typeof BulkUpdateReservationStatusSchema>;
export type BulkUpdateStaffScheduleStatus = z.infer<typeof BulkUpdateStaffScheduleStatusSchema>;
export type TableAvailabilityQuery = z.infer<typeof TableAvailabilityQuerySchema>;
export type StaffScheduleConflict = z.infer<typeof StaffScheduleConflictSchema>;
