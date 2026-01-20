import { Router } from 'express';
import {
  // Delivery staff controllers
  createDeliveryStaff,
  getDeliveryStaffById,
  getDeliveryStaff,
  updateDeliveryStaff,
  deleteDeliveryStaff,
  
  // Delivery controllers
  createDelivery,
  getDeliveryById,
  getDeliveries,
  updateDelivery,
  deleteDelivery,
  
  // Delivery location controllers
  createDeliveryLocation,
  getDeliveryLocationById,
  getDeliveryLocations,
  updateDeliveryLocation,
  deleteDeliveryLocation,
  
  // Delivery zone controllers
  createDeliveryZone,
  getDeliveryZoneById,
  getDeliveryZones,
  updateDeliveryZone,
  deleteDeliveryZone,
  
  // Bulk operation controllers
  bulkUpdateDeliveryStaffStatus,
  bulkUpdateDeliveryStatus,
  
  // Special query controllers
  getDeliveryStaffAvailability,
  getDeliveryByTrackingCode,
  checkDeliveryZoneCoverage,
  getDeliveryStatistics,
  getDeliveryPerformance,
} from '@/controllers/delivery';

const router = Router();

// =========================
// DELIVERY STAFF ROUTES
// =========================

// Create a new delivery staff
router.post('/staff', createDeliveryStaff);

// Get all delivery staff with filtering and pagination
router.get('/staff', getDeliveryStaff);

// Get delivery staff by ID
router.get('/staff/:id', getDeliveryStaffById);

// Update delivery staff
router.put('/staff/:id', updateDeliveryStaff);

// Delete delivery staff
router.delete('/staff/:id', deleteDeliveryStaff);

// =========================
// DELIVERY ROUTES
// =========================

// Create a new delivery
router.post('/deliveries', createDelivery);

// Get all deliveries with filtering and pagination
router.get('/deliveries', getDeliveries);

// Get delivery by ID
router.get('/deliveries/:id', getDeliveryById);

// Update delivery
router.put('/deliveries/:id', updateDelivery);

// Delete delivery
router.delete('/deliveries/:id', deleteDelivery);

// =========================
// DELIVERY LOCATION ROUTES
// =========================

// Create a new delivery location
router.post('/locations', createDeliveryLocation);

// Get all delivery locations with filtering and pagination
router.get('/locations', getDeliveryLocations);

// Get delivery location by ID
router.get('/locations/:id', getDeliveryLocationById);

// Update delivery location
router.put('/locations/:id', updateDeliveryLocation);

// Delete delivery location
router.delete('/locations/:id', deleteDeliveryLocation);

// =========================
// DELIVERY ZONE ROUTES
// =========================

// Create a new delivery zone
router.post('/zones', createDeliveryZone);

// Get all delivery zones with filtering and pagination
router.get('/zones', getDeliveryZones);

// Get delivery zone by ID
router.get('/zones/:id', getDeliveryZoneById);

// Update delivery zone
router.put('/zones/:id', updateDeliveryZone);

// Delete delivery zone
router.delete('/zones/:id', deleteDeliveryZone);

// =========================
// BULK OPERATION ROUTES
// =========================

// Bulk update delivery staff status
router.patch('/staff/bulk-update-status', bulkUpdateDeliveryStaffStatus);

// Bulk update delivery status
router.patch('/deliveries/bulk-update-status', bulkUpdateDeliveryStatus);

// =========================
// SPECIAL QUERY ROUTES
// =========================

// Get delivery staff availability
router.get('/delivery-staff/availability', getDeliveryStaffAvailability);

// Get delivery by tracking code
router.get('/deliveries/tracking', getDeliveryByTrackingCode);

// Check delivery zone coverage
router.get('/delivery-zones/coverage', checkDeliveryZoneCoverage);

// Get delivery statistics
router.get('/deliveries/statistics', getDeliveryStatistics);

// Get delivery performance
router.get('/deliveries/performance', getDeliveryPerformance);

export default router;
