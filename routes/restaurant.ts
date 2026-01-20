import { Router } from 'express';
import {
  // Table controllers
  createTable,
  getTableById,
  getTables,
  updateTable,
  deleteTable,
  
  // Reservation controllers
  createReservation,
  getReservationById,
  getReservations,
  updateReservation,
  deleteReservation,
  
  // Table order controllers
  createTableOrder,
  getTableOrderById,
  getTableOrders,
  updateTableOrder,
  deleteTableOrder,
  
  // Staff schedule controllers
  createStaffSchedule,
  getStaffScheduleById,
  getStaffSchedules,
  updateStaffSchedule,
  deleteStaffSchedule,
  
  // Staff attendance controllers
  createStaffAttendance,
  getStaffAttendanceById,
  getStaffAttendance,
  updateStaffAttendance,
  deleteStaffAttendance,
  
  // Bulk operation controllers
  bulkUpdateTableStatus,
  bulkUpdateReservationStatus,
  bulkUpdateStaffScheduleStatus,
  
  // Special query controllers
  getTableAvailability,
  checkStaffScheduleConflict,
} from '@/controllers/restaurant';
import {
  createRestaurant,
  getRestaurantById,
  getRestaurants,
  updateRestaurant,
  deleteRestaurant,

  // Restaurant chain controllers
  createRestaurantChain,
  getRestaurantChainById,
  getRestaurantChains,
  updateRestaurantChain,
  deleteRestaurantChain,

  // Restaurant user role controllers
  createRestaurantUserRole,
  getRestaurantUserRoleById,
  getRestaurantUserRoles,
  updateRestaurantUserRole,
  deleteRestaurantUserRole,
  bulkAddStaff,
  transferRestaurantStaff,
  getRestaurantStaffStatistics,
} from "@/controllers/organization";
import { requireAuth } from "@/middlewares/auth";
import {  } from "@supabase/supabase-js"

const router = Router();

router.use(requireAuth());

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update table status
router.patch('/table/bulk-update-status', bulkUpdateTableStatus);

// Bulk update reservation status
router.patch('/reservation/bulk-update-status', bulkUpdateReservationStatus);

// Bulk update staff schedule status
router.patch('/staff/schedule/bulk-update-status', bulkUpdateStaffScheduleStatus);

// =========================
// STAFF SCHEDULE ROUTES
// =========================

// Create a new staff schedule
router.post('/staff/schedule', createStaffSchedule);

// Get all staff schedules with filtering and pagination
router.get('/staff/schedule', getStaffSchedules);

// Get staff schedule by ID
router.get('/staff/schedule/:id', getStaffScheduleById);

// Update staff schedule
router.put('/staff/schedule/:id', updateStaffSchedule);

// Delete staff schedule
router.delete('/staff/schedule/:id', deleteStaffSchedule);

// =========================
// STAFF ATTENDANCE ROUTES
// =========================

// Create a new staff attendance
router.post('/staff/attendance', createStaffAttendance);

// Get all staff attendance with filtering and pagination
router.get('/staff/attendance', getStaffAttendance);

// Get staff attendance by ID
router.get('/staff/attendance/:id', getStaffAttendanceById);

// Update staff attendance
router.put('/staff/attendance/:id', updateStaffAttendance);

// Delete staff attendance
router.delete('/staff/attendance/:id', deleteStaffAttendance);

// =========================
// SPECIAL QUERY ROUTES
// =========================

// Get table availability
router.get('/table/availability', getTableAvailability);

// Check staff schedule conflict
router.post('/staff/schedule/check-conflict', checkStaffScheduleConflict);

// =========================
// RESERVATION ROUTES
// =========================

// Create a new reservation
router.post('/reservation', createReservation);

// Get all reservations with filtering and pagination
router.get('/reservation', getReservations);

// Get reservation by ID
router.get('/reservation/:id', getReservationById);

// Update reservation
router.put('/reservation/:id', updateReservation);

// Delete reservation
router.delete('/reservation/:id', deleteReservation);

// =========================
// TABLE ORDER ROUTES
// =========================

// Create a new table order
router.post('/table/order', createTableOrder);

// Get all table orders with filtering and pagination
router.get('/table/order', getTableOrders);

// Get table order by ID
router.get('/table/order/:id', getTableOrderById);

// Update table order
router.put('/table/order/:id', updateTableOrder);

// Delete table order
router.delete('/table/order/:id', deleteTableOrder);

// =========================
// TABLE ROUTES
// =========================

// Create a new table
router.post('/table', createTable);

// Get all tables with filtering and pagination
router.get('/table', getTables);

// Get table by ID
router.get('/table/:id', getTableById);

// Update table
router.put('/table/:id', updateTable);

// Delete table
router.delete('/table/:id', deleteTable);

// =========================
// RESTAURANT CHAIN ROUTES
// =========================

// Create a new restaurant chain
router.post('/chain', createRestaurantChain);

// Get all restaurant chains with filtering
router.get('/chain', getRestaurantChains);

// Get restaurant chain by ID
router.get('/chain/:id', getRestaurantChainById);

// Update restaurant chain
router.put('/chain/:id', updateRestaurantChain);

// Delete restaurant chain
router.delete('/chain/:id', deleteRestaurantChain);

// =========================
// RESTAURANT USER ROLE ROUTES
// =========================

// Create restaurant user role
router.post('/role', createRestaurantUserRole);

// Get all restaurant user roles with filtering
router.get('/role', getRestaurantUserRoles);

// Get restaurant user role by ID
router.get('/role/:id', getRestaurantUserRoleById);

// Update restaurant user role
router.put('/role/:id', updateRestaurantUserRole);

// Delete restaurant user role
router.delete('/role/:id', deleteRestaurantUserRole);

// Bulk add staff to restaurant
router.post('/role/bulk-add', bulkAddStaff);

// Transfer staff to another restaurant
router.post('/role/transfer', transferRestaurantStaff);

// Get restaurant staff statistics
router.get('/role/restaurants/:restaurantId/statistics', getRestaurantStaffStatistics);

// =========================
// RESTAURANT ROUTES
// =========================

// Create restaurant
router.post('/', createRestaurant);

// Get all restaurant
router.get('/', getRestaurants);

// Get restaurant by ID
router.get('/:id', getRestaurantById);

// Update restaurant
router.put('/:id', updateRestaurant);

// Delete restaurant
router.delete('/:id', deleteRestaurant);

// Get restaurant staff statistics
// router.get('/:restaurantId/statistics', getRestaurantStaffStatistics);

export default router;
