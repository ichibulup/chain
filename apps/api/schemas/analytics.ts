import { z } from 'zod';

// =========================
// ENUMS
// =========================

export const RevenueReportType = z.enum(['daily', 'weekly', 'monthly', 'yearly']);
export const KpiPeriod = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
export const AnalyticsEvent = z.enum([
  'pageView',
  'menuItemView',
  'orderCreated',
  'orderCompleted',
  'userRegistration',
  'reservationCreated',
  'reviewSubmitted',
  'searchPerformed',
  'deliveryAssigned',
  'deliveryCompleted',
  'inventoryLow',
  'supplierOrderCreated',
  'warehouseReceiptCreated',
  'warehouseIssueCreated',
  'staffCheckIn',
  'staffCheckOut',
  'paymentProcessed',
  'voucherUsed',
  'promotionApplied',
]);

// =========================
// REVENUE REPORT SCHEMAS
// =========================

export const RevenueReportSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  reportDate: z.date(),
  reportType: RevenueReportType,
  totalRevenue: z.number(),
  totalOrders: z.number().int(),
  totalCustomers: z.number().int(),
  avgOrderValue: z.number().nullable(),
  dineInRevenue: z.number().nullable(),
  takeawayRevenue: z.number().nullable(),
  deliveryRevenue: z.number().nullable(),
  popularItems: z.any().nullable(), // Json
  paymentBreakdown: z.any().nullable(), // Json
  hourlyBreakdown: z.any().nullable(), // Json
  createdAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export const CreateRevenueReportSchema = z.object({
  restaurantId: z.string().uuid(),
  reportDate: z.coerce.date(),
  reportType: RevenueReportType,
  totalRevenue: z.number().min(0, 'Total revenue must be non-negative'),
  totalOrders: z.number().int().min(0, 'Total orders must be non-negative').default(0),
  totalCustomers: z.number().int().min(0, 'Total customers must be non-negative').default(0),
  avgOrderValue: z.number().min(0).optional(),
  dineInRevenue: z.number().min(0).optional(),
  takeawayRevenue: z.number().min(0).optional(),
  deliveryRevenue: z.number().min(0).optional(),
  popularItems: z.any().optional(),
  paymentBreakdown: z.any().optional(),
  hourlyBreakdown: z.any().optional(),
});

export const UpdateRevenueReportSchema = z.object({
  totalRevenue: z.number().min(0).optional(),
  totalOrders: z.number().int().min(0).optional(),
  totalCustomers: z.number().int().min(0).optional(),
  avgOrderValue: z.number().min(0).optional(),
  dineInRevenue: z.number().min(0).optional(),
  takeawayRevenue: z.number().min(0).optional(),
  deliveryRevenue: z.number().min(0).optional(),
  popularItems: z.any().optional(),
  paymentBreakdown: z.any().optional(),
  hourlyBreakdown: z.any().optional(),
});

export const RevenueReportQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  reportType: RevenueReportType.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['reportDate', 'totalRevenue', 'totalOrders', 'createdAt']).default('reportDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// KPI METRIC SCHEMAS
// =========================

export const KpiMetricSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  metricName: z.string(),
  metricValue: z.number(),
  metricDate: z.date(),
  periodType: KpiPeriod,
  createdAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export const CreateKpiMetricSchema = z.object({
  restaurantId: z.string().uuid(),
  metricName: z.string().min(1, 'Metric name is required').max(100, 'Metric name too long'),
  metricValue: z.number(),
  metricDate: z.coerce.date(),
  periodType: KpiPeriod,
});

export const UpdateKpiMetricSchema = z.object({
  metricName: z.string().min(1).max(100).optional(),
  metricValue: z.number().optional(),
  metricDate: z.coerce.date().optional(),
  periodType: KpiPeriod.optional(),
});

export const KpiMetricQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  metricName: z.string().optional(),
  periodType: KpiPeriod.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['metricDate', 'metricValue', 'metricName', 'createdAt']).default('metricDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// ANALYTICS EVENT LOG SCHEMAS
// =========================

export const AnalyticsEventLogSchema = z.object({
  id: z.string().uuid(),
  eventType: AnalyticsEvent,
  entityType: z.string(),
  entityId: z.string(),
  restaurantId: z.string().uuid().nullable(),
  userId: z.string().uuid().nullable(),
  metadata: z.any().nullable(), // Json
  createdAt: z.date(),
});

export const CreateAnalyticsEventLogSchema = z.object({
  eventType: AnalyticsEvent,
  entityType: z.string().min(1, 'Entity type is required').max(100, 'Entity type too long'),
  entityId: z.string().uuid(),
  restaurantId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  metadata: z.any().optional(),
});

export const AnalyticsEventLogQuerySchema = z.object({
  eventType: AnalyticsEvent.optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'eventType', 'entityType']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// USER STATISTICS SCHEMAS
// =========================

export const UserStatisticsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  totalReservations: z.number().int(),
  successfulReservations: z.number().int(),
  cancelledReservations: z.number().int(),
  noShowReservations: z.number().int(),
  totalOrders: z.number().int(),
  completedOrders: z.number().int(),
  cancelledOrders: z.number().int(),
  totalSpent: z.number(),
  loyaltyPoints: z.number().int(),
  favoriteRestaurantId: z.string().uuid().nullable(),
  lastOrderDate: z.date().nullable(),
  lastReservationDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserStatisticsSchema = z.object({
  userId: z.string().uuid(),
  totalReservations: z.number().int().min(0).default(0),
  successfulReservations: z.number().int().min(0).default(0),
  cancelledReservations: z.number().int().min(0).default(0),
  noShowReservations: z.number().int().min(0).default(0),
  totalOrders: z.number().int().min(0).default(0),
  completedOrders: z.number().int().min(0).default(0),
  cancelledOrders: z.number().int().min(0).default(0),
  totalSpent: z.number().min(0).default(0),
  loyaltyPoints: z.number().int().min(0).default(0),
  favoriteRestaurantId: z.string().uuid().optional(),
  lastOrderDate: z.coerce.date().optional(),
  lastReservationDate: z.coerce.date().optional(),
});

export const UpdateUserStatisticsSchema = z.object({
  totalReservations: z.number().int().min(0).optional(),
  successfulReservations: z.number().int().min(0).optional(),
  cancelledReservations: z.number().int().min(0).optional(),
  noShowReservations: z.number().int().min(0).optional(),
  totalOrders: z.number().int().min(0).optional(),
  completedOrders: z.number().int().min(0).optional(),
  cancelledOrders: z.number().int().min(0).optional(),
  totalSpent: z.number().min(0).optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  favoriteRestaurantId: z.string().uuid().optional(),
  lastOrderDate: z.coerce.date().optional(),
  lastReservationDate: z.coerce.date().optional(),
});

export const UserStatisticsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  minTotalSpent: z.number().min(0).optional(),
  maxTotalSpent: z.number().min(0).optional(),
  minLoyaltyPoints: z.number().int().min(0).optional(),
  favoriteRestaurantId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['totalSpent', 'loyaltyPoints', 'totalOrders', 'createdAt', 'updatedAt']).default('totalSpent'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =========================
// TYPE EXPORTS
// =========================

export type RevenueReport = z.infer<typeof RevenueReportSchema>;
export type CreateRevenueReport = z.infer<typeof CreateRevenueReportSchema>;
export type UpdateRevenueReport = z.infer<typeof UpdateRevenueReportSchema>;
export type RevenueReportQuery = z.infer<typeof RevenueReportQuerySchema>;

export type KpiMetric = z.infer<typeof KpiMetricSchema>;
export type CreateKpiMetric = z.infer<typeof CreateKpiMetricSchema>;
export type UpdateKpiMetric = z.infer<typeof UpdateKpiMetricSchema>;
export type KpiMetricQuery = z.infer<typeof KpiMetricQuerySchema>;

export type AnalyticsEventLog = z.infer<typeof AnalyticsEventLogSchema>;
export type CreateAnalyticsEventLog = z.infer<typeof CreateAnalyticsEventLogSchema>;
export type AnalyticsEventLogQuery = z.infer<typeof AnalyticsEventLogQuerySchema>;

export type UserStatistics = z.infer<typeof UserStatisticsSchema>;
export type CreateUserStatistics = z.infer<typeof CreateUserStatisticsSchema>;
export type UpdateUserStatistics = z.infer<typeof UpdateUserStatisticsSchema>;
export type UserStatisticsQuery = z.infer<typeof UserStatisticsQuerySchema>;
