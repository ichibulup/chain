import { Router } from 'express';
import * as analyticsController from '@/controllers/analytics';

const router = Router();

// =========================
// REVENUE REPORT ROUTES
// =========================

/**
 * @route GET /api/analytics/revenue-reports
 * @desc Get all revenue reports with filtering and pagination
 * @access Private
 */
router.get('/revenue-reports', analyticsController.getRevenueReports);

/**
 * @route GET /api/analytics/revenue-reports/:id
 * @desc Get revenue report by ID
 * @access Private
 */
router.get('/revenue-reports/:id', analyticsController.getRevenueReportById);

/**
 * @route POST /api/analytics/revenue-reports
 * @desc Create a new revenue report
 * @access Private
 */
router.post('/revenue-reports', analyticsController.createRevenueReport);

/**
 * @route PUT /api/analytics/revenue-reports/:id
 * @desc Update revenue report
 * @access Private
 */
router.put('/revenue-reports/:id', analyticsController.updateRevenueReport);

/**
 * @route DELETE /api/analytics/revenue-reports/:id
 * @desc Delete revenue report
 * @access Private
 */
router.delete('/revenue-reports/:id', analyticsController.deleteRevenueReport);

// =========================
// KPI METRIC ROUTES
// =========================

/**
 * @route GET /api/analytics/kpi-metrics
 * @desc Get all KPI metrics with filtering and pagination
 * @access Private
 */
router.get('/kpi-metrics', analyticsController.getKpiMetrics);

/**
 * @route GET /api/analytics/kpi-metrics/:id
 * @desc Get KPI metric by ID
 * @access Private
 */
router.get('/kpi-metrics/:id', analyticsController.getKpiMetricById);

/**
 * @route POST /api/analytics/kpi-metrics
 * @desc Create a new KPI metric
 * @access Private
 */
router.post('/kpi-metrics', analyticsController.createKpiMetric);

/**
 * @route PUT /api/analytics/kpi-metrics/:id
 * @desc Update KPI metric
 * @access Private
 */
router.put('/kpi-metrics/:id', analyticsController.updateKpiMetric);

/**
 * @route DELETE /api/analytics/kpi-metrics/:id
 * @desc Delete KPI metric
 * @access Private
 */
router.delete('/kpi-metrics/:id', analyticsController.deleteKpiMetric);

// =========================
// ANALYTICS EVENT LOG ROUTES
// =========================

/**
 * @route GET /api/analytics/event-logs
 * @desc Get all analytics event logs with filtering and pagination
 * @access Private
 */
router.get('/event-logs', analyticsController.getAnalyticsEventLogs);

/**
 * @route GET /api/analytics/event-logs/:id
 * @desc Get analytics event log by ID
 * @access Private
 */
router.get('/event-logs/:id', analyticsController.getAnalyticsEventLogById);

/**
 * @route POST /api/analytics/event-logs
 * @desc Create a new analytics event log
 * @access Private
 */
router.post('/event-logs', analyticsController.createAnalyticsEventLog);

/**
 * @route DELETE /api/analytics/event-logs/:id
 * @desc Delete analytics event log
 * @access Private
 */
router.delete('/event-logs/:id', analyticsController.deleteAnalyticsEventLog);

// =========================
// USER STATISTICS ROUTES
// =========================

/**
 * @route GET /api/analytics/user-statistics
 * @desc Get all user statistics with filtering and pagination
 * @access Private
 */
router.get('/user-statistics', analyticsController.getUserStatistics);

/**
 * @route GET /api/analytics/user-statistics/:id
 * @desc Get user statistics by ID
 * @access Private
 */
router.get('/user-statistics/:id', analyticsController.getUserStatisticsById);

/**
 * @route GET /api/analytics/users/:userId/statistics
 * @desc Get user statistics by user ID
 * @access Private
 */
router.get('/users/:userId/statistics', analyticsController.getUserStatisticsByUserId);

/**
 * @route POST /api/analytics/user-statistics
 * @desc Create user statistics
 * @access Private
 */
router.post('/user-statistics', analyticsController.createUserStatistics);

/**
 * @route PUT /api/analytics/user-statistics/:id
 * @desc Update user statistics
 * @access Private
 */
router.put('/user-statistics/:id', analyticsController.updateUserStatistics);

/**
 * @route DELETE /api/analytics/user-statistics/:id
 * @desc Delete user statistics
 * @access Private
 */
router.delete('/user-statistics/:id', analyticsController.deleteUserStatistics);

export default router;
