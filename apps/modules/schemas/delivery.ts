import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const DeliveryVehicle = z.enum(['motorcycle', 'bicycle', 'car', 'scooter', 'walking']);
export const DeliveryStaffStatus = z.enum(['available', 'busy', 'offline', 'onBreak', 'maintenance']);
export const DeliveryStatus = z.enum(['assigned', 'accepted', 'pickedUp', 'inTransit', 'delivered', 'failed', 'cancelled']);

// =========================
// DELIVERY STAFF SCHEMAS
// =========================

// Base DeliveryStaff schema
export const DeliveryStaffSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  vehicleType: DeliveryVehicle,
  licensePlate: z.string().nullable(),
  status: DeliveryStaffStatus,
  currentZone: z.string().nullable(),
  maxCapacity: z.number().int().positive().default(5),
  rating: z.number().min(0).max(5).nullable(),
  totalDeliveries: z.number().int().min(0).default(0),
  totalDistanceKm: z.number().min(0).default(0),
  totalEarnings: z.number().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create DeliveryStaff schema
export const CreateDeliveryStaffSchema = z.object({
  userId: z.string().uuid(),
  vehicleType: DeliveryVehicle,
  licensePlate: z.string().max(20, 'License plate too long').optional(),
  status: DeliveryStaffStatus.default('available'),
  currentZone: z.string().max(100, 'Current zone too long').optional(),
  maxCapacity: z.number().int().positive('Max capacity must be positive').max(20, 'Max capacity too large').default(5),
  rating: z.number().min(0, 'Rating cannot be negative').max(5, 'Rating cannot exceed 5').optional(),
  totalDeliveries: z.number().int().min(0, 'Total deliveries cannot be negative').default(0),
  totalDistanceKm: z.number().min(0, 'Total distance cannot be negative').default(0),
  totalEarnings: z.number().min(0, 'Total earnings cannot be negative').default(0),
});

// Update DeliveryStaff schema
export const UpdateDeliveryStaffSchema = z.object({
  vehicleType: DeliveryVehicle.optional(),
  licensePlate: z.string().max(20, 'License plate too long').optional(),
  status: DeliveryStaffStatus.optional(),
  currentZone: z.string().max(100, 'Current zone too long').optional(),
  maxCapacity: z.number().int().positive('Max capacity must be positive').max(20, 'Max capacity too large').optional(),
  rating: z.number().min(0, 'Rating cannot be negative').max(5, 'Rating cannot exceed 5').optional(),
  totalDeliveries: z.number().int().min(0, 'Total deliveries cannot be negative').optional(),
  totalDistanceKm: z.number().min(0, 'Total distance cannot be negative').optional(),
  totalEarnings: z.number().min(0, 'Total earnings cannot be negative').optional(),
});

// DeliveryStaff Query schema
export const DeliveryStaffQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  vehicleType: DeliveryVehicle.optional(),
  status: DeliveryStaffStatus.optional(),
  currentZone: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxRating: z.number().min(0).max(5).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['rating', 'totalDeliveries', 'totalEarnings', 'createdAt', 'updatedAt']).default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// DELIVERY SCHEMAS
// =========================

// Base Delivery schema
export const DeliverySchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  deliveryStaffId: z.string().uuid().nullable(),
  status: DeliveryStatus,
  assignedAt: z.date().nullable(),
  pickedUpAt: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  estimatedTimeMin: z.number().int().positive().nullable(),
  actualTimeMin: z.number().int().positive().nullable(),
  deliveryFee: z.number().positive(),
  distanceKm: z.number().positive().nullable(),
  destinationLatitude: z.number().min(-90).max(90).nullable(),
  destinationLongitude: z.number().min(-180).max(180).nullable(),
  notes: z.string().nullable(),
  customerRating: z.number().int().min(1).max(5).nullable(),
  customerFeedback: z.string().nullable(),
  deliveryPhoto: z.string().nullable(),
  currentLatitude: z.number().min(-90).max(90).nullable(),
  currentLongitude: z.number().min(-180).max(180).nullable(),
  lastLocationAt: z.date().nullable(),
  isTrackingActive: z.boolean().default(true),
  trackingCode: z.string().nullable(),
  routePolyline: z.string().nullable(),
  estimatedArrival: z.date().nullable(),
  actualArrival: z.date().nullable(),
  customerNotifiedAt: z.date().nullable(),
  staffNotifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create Delivery schema
export const CreateDeliverySchema = z.object({
  orderId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  deliveryStaffId: z.string().uuid().optional(),
  status: DeliveryStatus.default('assigned'),
  estimatedTimeMin: z.number().int().positive('Estimated time must be positive').optional(),
  deliveryFee: z.number().positive('Delivery fee must be positive'),
  distanceKm: z.number().positive('Distance must be positive').optional(),
  destinationLatitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude').optional(),
  destinationLongitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  trackingCode: z.string().max(50, 'Tracking code too long').optional(),
  estimatedArrival: z.date().optional(),
});

// Update Delivery schema
export const UpdateDeliverySchema = z.object({
  deliveryStaffId: z.string().uuid().optional(),
  status: DeliveryStatus.optional(),
  estimatedTimeMin: z.number().int().positive('Estimated time must be positive').optional(),
  actualTimeMin: z.number().int().positive('Actual time must be positive').optional(),
  deliveryFee: z.number().positive('Delivery fee must be positive').optional(),
  distanceKm: z.number().positive('Distance must be positive').optional(),
  destinationLatitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude').optional(),
  destinationLongitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  customerRating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
  customerFeedback: z.string().max(1000, 'Customer feedback too long').optional(),
  deliveryPhoto: z.string().max(500, 'Delivery photo URL too long').optional(),
  currentLatitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude').optional(),
  currentLongitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude').optional(),
  isTrackingActive: z.boolean().optional(),
  trackingCode: z.string().max(50, 'Tracking code too long').optional(),
  routePolyline: z.string().max(10000, 'Route polyline too long').optional(),
  estimatedArrival: z.date().optional(),
  actualArrival: z.date().optional(),
  customerNotifiedAt: z.date().optional(),
  staffNotifiedAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Delivery Query schema
export const DeliveryQuerySchema = z.object({
  orderId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  deliveryStaffId: z.string().uuid().optional(),
  status: DeliveryStatus.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxRating: z.number().min(1).max(5).optional(),
  isTrackingActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'assignedAt', 'deliveredAt', 'status', 'customerRating', 'deliveryFee']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// DELIVERY LOCATION SCHEMAS
// =========================

// Base DeliveryLocation schema
export const DeliveryLocationSchema = z.object({
  id: z.string().uuid(),
  deliveryId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().positive().nullable(),
  headingDegrees: z.number().min(0).max(360).nullable(),
  speedMetersPerSecond: z.number().positive().nullable(),
  capturedAt: z.date(),
});

// Create DeliveryLocation schema
export const CreateDeliveryLocationSchema = z.object({
  deliveryId: z.string().uuid(),
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  accuracyMeters: z.number().positive('Accuracy must be positive').optional(),
  headingDegrees: z.number().min(0, 'Heading must be between 0 and 360').max(360, 'Heading must be between 0 and 360').optional(),
  speedMetersPerSecond: z.number().positive('Speed must be positive').optional(),
  capturedAt: z.date().optional(),
});

// Update DeliveryLocation schema
export const UpdateDeliveryLocationSchema = z.object({
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude').optional(),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude').optional(),
  accuracyMeters: z.number().positive('Accuracy must be positive').optional(),
  headingDegrees: z.number().min(0, 'Heading must be between 0 and 360').max(360, 'Heading must be between 0 and 360').optional(),
  speedMetersPerSecond: z.number().positive('Speed must be positive').optional(),
  capturedAt: z.date().optional(),
});

// DeliveryLocation Query schema
export const DeliveryLocationQuerySchema = z.object({
  deliveryId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['capturedAt', 'latitude', 'longitude']).default('capturedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// DELIVERY ZONE SCHEMAS
// =========================

// Base DeliveryZone schema
export const DeliveryZoneSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: z.string(),
  polygonGeo: z.any(), // JSON object for polygon coordinates
  deliveryFee: z.number().positive(),
  minOrderAmount: z.number().positive().nullable(),
  maxDistanceKm: z.number().positive().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

// Create DeliveryZone schema
export const CreateDeliveryZoneSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1, 'Zone name is required').max(100, 'Zone name too long'),
  polygonGeo: z.any(), // JSON object for polygon coordinates
  deliveryFee: z.number().positive('Delivery fee must be positive'),
  minOrderAmount: z.number().positive('Min order must be positive').optional(),
  maxDistanceKm: z.number().positive('Max distance must be positive').optional(),
  isActive: z.boolean().default(true),
});

// Update DeliveryZone schema
export const UpdateDeliveryZoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required').max(100, 'Zone name too long').optional(),
  polygonGeo: z.any().optional(), // JSON object for polygon coordinates
  deliveryFee: z.number().positive('Delivery fee must be positive').optional(),
  minOrderAmount: z.number().positive('Min order must be positive').optional(),
  maxDistanceKm: z.number().positive('Max distance must be positive').optional(),
  isActive: z.boolean().optional(),
});

// DeliveryZone Query schema
export const DeliveryZoneQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'deliveryFee', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =========================
// BULK OPERATION SCHEMAS
// =========================

// Bulk update delivery staff status schema
export const BulkUpdateDeliveryStaffStatusSchema = z.object({
  staffIds: z.array(z.string().uuid()).min(1, 'At least one staff is required'),
  status: DeliveryStaffStatus,
});

// Bulk update delivery status schema
export const BulkUpdateDeliveryStatusSchema = z.object({
  deliveryIds: z.array(z.string().uuid()).min(1, 'At least one delivery is required'),
  status: DeliveryStatus,
  notes: z.string().max(500, 'Notes too long').optional(),
});

// =========================
// SPECIAL QUERY SCHEMAS
// =========================

// Delivery staff availability query schema
export const DeliveryStaffAvailabilityQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  vehicleType: DeliveryVehicle.optional(),
  currentZone: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
});

// Delivery tracking query schema
export const DeliveryTrackingQuerySchema = z.object({
  trackingCode: z.string().min(1, 'Tracking code is required'),
});

// Delivery zone coverage query schema
export const DeliveryZoneCoverageQuerySchema = z.object({
  restaurantId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Delivery statistics query schema
export const DeliveryStatisticsQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  deliveryStaffId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// Delivery performance query schema
export const DeliveryPerformanceQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  deliveryStaffId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
});

// =========================
// EXPORT TYPE DEFINITIONS
// =========================

export type DeliveryStaff = z.infer<typeof DeliveryStaffSchema>;
export type CreateDeliveryStaff = z.infer<typeof CreateDeliveryStaffSchema>;
export type UpdateDeliveryStaff = z.infer<typeof UpdateDeliveryStaffSchema>;
export type DeliveryStaffQuery = z.infer<typeof DeliveryStaffQuerySchema>;

export type Delivery = z.infer<typeof DeliverySchema>;
export type CreateDelivery = z.infer<typeof CreateDeliverySchema>;
export type UpdateDelivery = z.infer<typeof UpdateDeliverySchema>;
export type DeliveryQuery = z.infer<typeof DeliveryQuerySchema>;

export type DeliveryLocation = z.infer<typeof DeliveryLocationSchema>;
export type CreateDeliveryLocation = z.infer<typeof CreateDeliveryLocationSchema>;
export type UpdateDeliveryLocation = z.infer<typeof UpdateDeliveryLocationSchema>;
export type DeliveryLocationQuery = z.infer<typeof DeliveryLocationQuerySchema>;

export type DeliveryZone = z.infer<typeof DeliveryZoneSchema>;
export type CreateDeliveryZone = z.infer<typeof CreateDeliveryZoneSchema>;
export type UpdateDeliveryZone = z.infer<typeof UpdateDeliveryZoneSchema>;
export type DeliveryZoneQuery = z.infer<typeof DeliveryZoneQuerySchema>;

export type BulkUpdateDeliveryStaffStatus = z.infer<typeof BulkUpdateDeliveryStaffStatusSchema>;
export type BulkUpdateDeliveryStatus = z.infer<typeof BulkUpdateDeliveryStatusSchema>;

export type DeliveryStaffAvailabilityQuery = z.infer<typeof DeliveryStaffAvailabilityQuerySchema>;
export type DeliveryTrackingQuery = z.infer<typeof DeliveryTrackingQuerySchema>;
export type DeliveryZoneCoverageQuery = z.infer<typeof DeliveryZoneCoverageQuerySchema>;
export type DeliveryStatisticsQuery = z.infer<typeof DeliveryStatisticsQuerySchema>;
export type DeliveryPerformanceQuery = z.infer<typeof DeliveryPerformanceQuerySchema>;
