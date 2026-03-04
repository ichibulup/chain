import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import {
  CreateRevenueReportSchema,
  UpdateRevenueReportSchema,
  RevenueReportQuerySchema,
  CreateKpiMetricSchema,
  UpdateKpiMetricSchema,
  KpiMetricQuerySchema,
  CreateAnalyticsEventLogSchema,
  AnalyticsEventLogQuerySchema,
  CreateUserStatisticsSchema,
  UpdateUserStatisticsSchema,
  UserStatisticsQuerySchema,
} from '@/schemas/analytics';
import * as analyticsService from '@/services/analytics';

// =========================
// REVENUE REPORT CONTROLLERS
// =========================

/**
 * Create a new revenue report
 */
export const createRevenueReport = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = CreateRevenueReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const report = await analyticsService.createRevenueReport(validation.data);

    return res.status(201).json({
      success: true,
      message: 'Revenue report created successfully',
      data: report,
    });
  } catch (error: any) {
    console.error('Error in createRevenueReport controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create revenue report',
    });
  }
};

/**
 * Get revenue report by ID
 */
export const getRevenueReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    const report = await analyticsService.getRevenueReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Revenue report not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error in getRevenueReportById controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get revenue report',
    });
  }
};

/**
 * Get revenue reports with filtering and pagination
 */
export const getRevenueReports = async (req: Request, res: Response) => {
  try {
    const validation = RevenueReportQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await analyticsService.getRevenueReports(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in getRevenueReports controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get revenue reports',
    });
  }
};

/**
 * Update revenue report
 */
export const updateRevenueReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = UpdateRevenueReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const report = await analyticsService.updateRevenueReport(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Revenue report updated successfully',
      data: report,
    });
  } catch (error: any) {
    console.error('Error in updateRevenueReport controller:', error);
    const statusCode = error.message === 'Revenue report not found' ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update revenue report',
    });
  }
};

/**
 * Delete revenue report
 */
export const deleteRevenueReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    const result = await analyticsService.deleteRevenueReport(id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in deleteRevenueReport controller:', error);
    const statusCode = error.message === 'Revenue report not found' ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete revenue report',
    });
  }
};

// =========================
// KPI METRIC CONTROLLERS
// =========================

/**
 * Create a new KPI metric
 */
export const createKpiMetric = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = CreateKpiMetricSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const metric = await analyticsService.createKpiMetric(validation.data);

    return res.status(201).json({
      success: true,
      message: 'KPI metric created successfully',
      data: metric,
    });
  } catch (error: any) {
    console.error('Error in createKpiMetric controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create KPI metric',
    });
  }
};

/**
 * Get KPI metric by ID
 */
export const getKpiMetricById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Metric ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric ID format',
      });
    }

    const metric = await analyticsService.getKpiMetricById(id);

    if (!metric) {
      return res.status(404).json({
        success: false,
        message: 'KPI metric not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: metric,
    });
  } catch (error: any) {
    console.error('Error in getKpiMetricById controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get KPI metric',
    });
  }
};

/**
 * Get KPI metrics with filtering and pagination
 */
export const getKpiMetrics = async (req: Request, res: Response) => {
  try {
    const validation = KpiMetricQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await analyticsService.getKpiMetrics(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in getKpiMetrics controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get KPI metrics',
    });
  }
};

/**
 * Update KPI metric
 */
export const updateKpiMetric = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Metric ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric ID format',
      });
    }

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = UpdateKpiMetricSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const metric = await analyticsService.updateKpiMetric(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'KPI metric updated successfully',
      data: metric,
    });
  } catch (error: any) {
    console.error('Error in updateKpiMetric controller:', error);
    const statusCode = error.message === 'KPI metric not found' ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update KPI metric',
    });
  }
};

/**
 * Delete KPI metric
 */
export const deleteKpiMetric = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Metric ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric ID format',
      });
    }

    const result = await analyticsService.deleteKpiMetric(id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in deleteKpiMetric controller:', error);
    const statusCode = error.message === 'KPI metric not found' ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete KPI metric',
    });
  }
};

// =========================
// ANALYTICS EVENT LOG CONTROLLERS
// =========================

/**
 * Create a new analytics event log
 */
export const createAnalyticsEventLog = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = CreateAnalyticsEventLogSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const log = await analyticsService.createAnalyticsEventLog(validation.data);

    return res.status(201).json({
      success: true,
      message: 'Analytics event log created successfully',
      data: log,
    });
  } catch (error: any) {
    console.error('Error in createAnalyticsEventLog controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create analytics event log',
    });
  }
};

/**
 * Get analytics event log by ID
 */
export const getAnalyticsEventLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Log ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log ID format',
      });
    }

    const log = await analyticsService.getAnalyticsEventLogById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Analytics event log not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Error in getAnalyticsEventLogById controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get analytics event log',
    });
  }
};

/**
 * Get analytics event logs with filtering and pagination
 */
export const getAnalyticsEventLogs = async (req: Request, res: Response) => {
  try {
    const validation = AnalyticsEventLogQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await analyticsService.getAnalyticsEventLogs(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in getAnalyticsEventLogs controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get analytics event logs',
    });
  }
};

/**
 * Delete analytics event log
 */
export const deleteAnalyticsEventLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Log ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log ID format',
      });
    }

    const result = await analyticsService.deleteAnalyticsEventLog(id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in deleteAnalyticsEventLog controller:', error);
    const statusCode = error.message === 'Analytics event log not found' ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete analytics event log',
    });
  }
};

// =========================
// USER STATISTICS CONTROLLERS
// =========================

/**
 * Create user statistics
 */
export const createUserStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = CreateUserStatisticsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const stats = await analyticsService.createUserStatistics(validation.data);

    return res.status(201).json({
      success: true,
      message: 'User statistics created successfully',
      data: stats,
    });
  } catch (error: any) {
    console.error('Error in createUserStatistics controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user statistics',
    });
  }
};

/**
 * Get user statistics by ID
 */
export const getUserStatisticsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Statistics ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid statistics ID format',
      });
    }

    const stats = await analyticsService.getUserStatisticsById(id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'User statistics not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error in getUserStatisticsById controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user statistics',
    });
  }
};

/**
 * Get user statistics by user ID
 */
export const getUserStatisticsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!validate(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const stats = await analyticsService.getUserStatisticsByUserId(userId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'User statistics not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error in getUserStatisticsByUserId controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user statistics',
    });
  }
};

/**
 * Get user statistics with filtering and pagination
 */
export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const validation = UserStatisticsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await analyticsService.getUserStatistics(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in getUserStatistics controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user statistics',
    });
  }
};

/**
 * Update user statistics
 */
export const updateUserStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Statistics ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid statistics ID format',
      });
    }

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = UpdateUserStatisticsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const stats = await analyticsService.updateUserStatistics(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'User statistics updated successfully',
      data: stats,
    });
  } catch (error: any) {
    console.error('Error in updateUserStatistics controller:', error);
    const statusCode = error.message === 'User statistics not found' ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update user statistics',
    });
  }
};

/**
 * Delete user statistics
 */
export const deleteUserStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Statistics ID is required',
      });
    }

    if (!validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid statistics ID format',
      });
    }

    const result = await analyticsService.deleteUserStatistics(id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in deleteUserStatistics controller:', error);
    const statusCode = error.message === 'User statistics not found' ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete user statistics',
    });
  }
};
