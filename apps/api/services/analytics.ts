import type {
  CreateRevenueReport,
  UpdateRevenueReport,
  RevenueReportQuery,
  CreateKpiMetric,
  UpdateKpiMetric,
  KpiMetricQuery,
  CreateAnalyticsEventLog,
  AnalyticsEventLogQuery,
  CreateUserStatistics,
  UpdateUserStatistics,
  UserStatisticsQuery,
} from '@/schemas/analytics';
import {
  RevenueReport,
  KpiMetric,
  AnalyticsEventLog,
  UserStatistics,
} from "@/models/analytics"
import {
  checkUserExists,
  checkRestaurantExists
} from '@/services/helper'

// =========================
// REVENUE REPORT SERVICES
// =========================

/**
 * Create a new revenue report
 */
export const createRevenueReport = async (data: CreateRevenueReport) => {
  try {
    // Verify restaurant exists
    const restaurantExists = await checkRestaurantExists(data.restaurantId);
    if (!restaurantExists) {
      throw new Error('Restaurant not found');
    }

    const report = await RevenueReport.create({
      data: {
        restaurantId: data.restaurantId,
        reportDate: data.reportDate,
        reportType: data.reportType,
        totalRevenue: data.totalRevenue,
        totalOrders: data.totalOrders,
        totalCustomers: data.totalCustomers,
        avgOrderValue: data.avgOrderValue,
        dineInRevenue: data.dineInRevenue,
        takeawayRevenue: data.takeawayRevenue,
        deliveryRevenue: data.deliveryRevenue,
        popularItems: data.popularItems,
        paymentBreakdown: data.paymentBreakdown,
        hourlyBreakdown: data.hourlyBreakdown,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return report;
  } catch (error) {
    console.error('Error creating revenue report:', error);
    throw error;
  }
};

/**
 * Get revenue report by ID
 */
export const getRevenueReportById = async (id: string) => {
  try {
    const report = await RevenueReport.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return report;
  } catch (error) {
    console.error('Error getting revenue report:', error);
    throw error;
  }
};

/**
 * Get revenue reports with filtering and pagination
 */
export const getRevenueReports = async (query: RevenueReportQuery) => {
  try {
    const {
      restaurantId,
      reportType,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (reportType) {
      where.reportType = reportType;
    }

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        where.reportDate.gte = startDate;
      }
      if (endDate) {
        where.reportDate.lte = endDate;
      }
    }

    // Execute query
    const [reports, total] = await Promise.all([
      RevenueReport.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      RevenueReport.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting revenue reports:', error);
    throw error;
  }
};

/**
 * Update revenue report
 */
export const updateRevenueReport = async (id: string, data: UpdateRevenueReport) => {
  try {
    // Check if report exists
    const exists = await RevenueReport.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('Revenue report not found');
    }

    const report = await RevenueReport.update({
      where: { id },
      data,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return report;
  } catch (error) {
    console.error('Error updating revenue report:', error);
    throw error;
  }
};

/**
 * Delete revenue report
 */
export const deleteRevenueReport = async (id: string) => {
  try {
    // Check if report exists
    const exists = await RevenueReport.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('Revenue report not found');
    }

    await RevenueReport.delete({
      where: { id },
    });

    return { message: 'Revenue report deleted successfully' };
  } catch (error) {
    console.error('Error deleting revenue report:', error);
    throw error;
  }
};

// =========================
// KPI METRIC SERVICES
// =========================

/**
 * Create a new KPI metric
 */
export const createKpiMetric = async (data: CreateKpiMetric) => {
  try {
    // Verify restaurant exists
    const restaurantExists = await checkRestaurantExists(data.restaurantId);
    if (!restaurantExists) {
      throw new Error('Restaurant not found');
    }

    const metric = await KpiMetric.create({
      data: {
        restaurantId: data.restaurantId,
        metricName: data.metricName,
        metricValue: data.metricValue,
        metricDate: data.metricDate,
        periodType: data.periodType,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return metric;
  } catch (error) {
    console.error('Error creating KPI metric:', error);
    throw error;
  }
};

/**
 * Get KPI metric by ID
 */
export const getKpiMetricById = async (id: string) => {
  try {
    const metric = await KpiMetric.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return metric;
  } catch (error) {
    console.error('Error getting KPI metric:', error);
    throw error;
  }
};

/**
 * Get KPI metrics with filtering and pagination
 */
export const getKpiMetrics = async (query: KpiMetricQuery) => {
  try {
    const {
      restaurantId,
      metricName,
      periodType,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (metricName) {
      where.metricName = { contains: metricName, mode: 'insensitive' };
    }

    if (periodType) {
      where.periodType = periodType;
    }

    if (startDate || endDate) {
      where.metricDate = {};
      if (startDate) {
        where.metricDate.gte = startDate;
      }
      if (endDate) {
        where.metricDate.lte = endDate;
      }
    }

    // Execute query
    const [metrics, total] = await Promise.all([
      KpiMetric.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      KpiMetric.count({ where }),
    ]);

    return {
      data: metrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting KPI metrics:', error);
    throw error;
  }
};

/**
 * Update KPI metric
 */
export const updateKpiMetric = async (id: string, data: UpdateKpiMetric) => {
  try {
    // Check if metric exists
    const exists = await KpiMetric.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('KPI metric not found');
    }

    const metric = await KpiMetric.update({
      where: { id },
      data,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return metric;
  } catch (error) {
    console.error('Error updating KPI metric:', error);
    throw error;
  }
};

/**
 * Delete KPI metric
 */
export const deleteKpiMetric = async (id: string) => {
  try {
    // Check if metric exists
    const exists = await KpiMetric.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('KPI metric not found');
    }

    await KpiMetric.delete({
      where: { id },
    });

    return { message: 'KPI metric deleted successfully' };
  } catch (error) {
    console.error('Error deleting KPI metric:', error);
    throw error;
  }
};

// =========================
// ANALYTICS EVENT LOG SERVICES
// =========================

/**
 * Create a new analytics event log
 */
export const createAnalyticsEventLog = async (data: CreateAnalyticsEventLog) => {
  try {
    // Verify restaurant exists if provided
    if (data.restaurantId) {
      const restaurantExists = await checkRestaurantExists(data.restaurantId);
      if (!restaurantExists) {
        throw new Error('Restaurant not found');
      }
    }

    // Verify user exists if provided
    if (data.userId) {
      const userExists = await checkUserExists(data.userId);
      if (!userExists) {
        throw new Error('User not found');
      }
    }

    const log = await AnalyticsEventLog.create({
      data: {
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
        restaurantId: data.restaurantId,
        userId: data.userId,
        metadata: data.metadata,
      },
    });

    return log;
  } catch (error) {
    console.error('Error creating analytics event log:', error);
    throw error;
  }
};

/**
 * Get analytics event log by ID
 */
export const getAnalyticsEventLogById = async (id: string) => {
  try {
    const log = await AnalyticsEventLog.findUnique({
      where: { id },
    });

    return log;
  } catch (error) {
    console.error('Error getting analytics event log:', error);
    throw error;
  }
};

/**
 * Get analytics event logs with filtering and pagination
 */
export const getAnalyticsEventLogs = async (query: AnalyticsEventLogQuery) => {
  try {
    const {
      eventType,
      entityType,
      entityId,
      restaurantId,
      userId,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (entityType) {
      where.entityType = { contains: entityType, mode: 'insensitive' };
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Execute query
    const [logs, total] = await Promise.all([
      AnalyticsEventLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      AnalyticsEventLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting analytics event logs:', error);
    throw error;
  }
};

/**
 * Delete analytics event log
 */
export const deleteAnalyticsEventLog = async (id: string) => {
  try {
    // Check if log exists
    const exists = await AnalyticsEventLog.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('Analytics event log not found');
    }

    await AnalyticsEventLog.delete({
      where: { id },
    });

    return { message: 'Analytics event log deleted successfully' };
  } catch (error) {
    console.error('Error deleting analytics event log:', error);
    throw error;
  }
};

// =========================
// USER STATISTICS SERVICES
// =========================

/**
 * Create user statistics
 */
export const createUserStatistics = async (data: CreateUserStatistics) => {
  try {
    // Verify user exists
    const userExists = await checkUserExists(data.userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Verify favorite restaurant exists if provided
    if (data.favoriteRestaurantId) {
      const restaurantExists = await checkRestaurantExists(data.favoriteRestaurantId);
      if (!restaurantExists) {
        throw new Error('Favorite restaurant not found');
      }
    }

    const stats = await UserStatistics.create({
      data: {
        userId: data.userId,
        totalReservations: data.totalReservations,
        successfulReservations: data.successfulReservations,
        cancelledReservations: data.cancelledReservations,
        noShowReservations: data.noShowReservations,
        totalOrders: data.totalOrders,
        completedOrders: data.completedOrders,
        cancelledOrders: data.cancelledOrders,
        totalSpent: data.totalSpent,
        loyaltyPoints: data.loyaltyPoints,
        favoriteRestaurantId: data.favoriteRestaurantId,
        lastOrderDate: data.lastOrderDate,
        lastReservationDate: data.lastReservationDate,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return stats;
  } catch (error) {
    console.error('Error creating user statistics:', error);
    throw error;
  }
};

/**
 * Get user statistics by ID
 */
export const getUserStatisticsById = async (id: string) => {
  try {
    const stats = await UserStatistics.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return stats;
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
};

/**
 * Get user statistics by user ID
 */
export const getUserStatisticsByUserId = async (userId: string) => {
  try {
    const stats = await UserStatistics.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return stats;
  } catch (error) {
    console.error('Error getting user statistics by user ID:', error);
    throw error;
  }
};

/**
 * Get user statistics with filtering and pagination
 */
export const getUserStatistics = async (query: UserStatisticsQuery) => {
  try {
    const {
      userId,
      minTotalSpent,
      maxTotalSpent,
      minLoyaltyPoints,
      favoriteRestaurantId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (minTotalSpent !== undefined || maxTotalSpent !== undefined) {
      where.totalSpent = {};
      if (minTotalSpent !== undefined) {
        where.totalSpent.gte = minTotalSpent;
      }
      if (maxTotalSpent !== undefined) {
        where.totalSpent.lte = maxTotalSpent;
      }
    }

    if (minLoyaltyPoints !== undefined) {
      where.loyaltyPoints = { gte: minLoyaltyPoints };
    }

    if (favoriteRestaurantId) {
      where.favoriteRestaurantId = favoriteRestaurantId;
    }

    // Execute query
    const [statistics, total] = await Promise.all([
      UserStatistics.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      UserStatistics.count({ where }),
    ]);

    return {
      data: statistics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
};

/**
 * Update user statistics
 */
export const updateUserStatistics = async (id: string, data: UpdateUserStatistics) => {
  try {
    // Check if statistics exist
    const exists = await UserStatistics.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('User statistics not found');
    }

    // Verify favorite restaurant exists if provided
    if (data.favoriteRestaurantId) {
      const restaurantExists = await checkRestaurantExists(data.favoriteRestaurantId);
      if (!restaurantExists) {
        throw new Error('Favorite restaurant not found');
      }
    }

    const stats = await UserStatistics.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return stats;
  } catch (error) {
    console.error('Error updating user statistics:', error);
    throw error;
  }
};

/**
 * Delete user statistics
 */
export const deleteUserStatistics = async (id: string) => {
  try {
    // Check if statistics exist
    const exists = await UserStatistics.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('User statistics not found');
    }

    await UserStatistics.delete({
      where: { id },
    });

    return { message: 'User statistics deleted successfully' };
  } catch (error) {
    console.error('Error deleting user statistics:', error);
    throw error;
  }
};
