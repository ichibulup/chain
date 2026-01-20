import { Router } from 'express';
import {
  // Notification controllers
  createNotification,
  getNotificationById,
  getNotifications,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
  bulkMarkAsRead,
  getUnreadCount,
  // System Config controllers
  createSystemConfig,
  getSystemConfigById,
  getSystemConfigByKey,
  getSystemConfigs,
  updateSystemConfig,
  deleteSystemConfig,
  // Audit Log controllers
  createAuditLog,
  getAuditLogById,
  getAuditLogs,
  deleteAuditLog,
  // Device Token controllers
  createDeviceToken,
  getDeviceTokenById,
  getDeviceTokens,
  updateDeviceToken,
  deleteDeviceToken,
  deleteDeviceTokenByToken
} from '@/controllers/notification';

const router = Router();

// ============================================================================
// NOTIFICATION ROUTES
// ============================================================================

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications with filtering and pagination
 * @access  Private
 */
router.get('/notifications', getNotifications);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/notifications/:id', getNotificationById);

/**
 * @route   POST /api/notifications
 * @desc    Create new notification
 * @access  Private
 */
router.post('/notifications', createNotification);

/**
 * @route   PUT /api/notifications/:id
 * @desc    Update notification
 * @access  Private
 */
router.put('/notifications/:id', updateNotification);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/notifications/:id', deleteNotification);

/**
 * @route   POST /api/notifications/:id/mark-read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/notifications/:id/mark-read', markNotificationAsRead);

/**
 * @route   POST /api/notifications/bulk-mark-read
 * @desc    Bulk mark notifications as read
 * @access  Private
 */
router.post('/notifications/bulk-mark-read', bulkMarkAsRead);

/**
 * @route   GET /api/notifications/unread-count/:userId
 * @desc    Get unread notification count for user
 * @access  Private
 */
router.get('/notifications/unread-count/:userId', getUnreadCount);

// ============================================================================
// SYSTEM CONFIG ROUTES
// ============================================================================

/**
 * @route   GET /api/system-configs
 * @desc    Get all system configs with filtering and pagination
 * @access  Private
 */
router.get('/system-configs', getSystemConfigs);

/**
 * @route   GET /api/system-configs/:id
 * @desc    Get system config by ID
 * @access  Private
 */
router.get('/system-configs/:id', getSystemConfigById);

/**
 * @route   GET /api/system-configs/key/:key
 * @desc    Get system config by key
 * @access  Private
 */
router.get('/system-configs/key/:key', getSystemConfigByKey);

/**
 * @route   POST /api/system-configs
 * @desc    Create new system config
 * @access  Private
 */
router.post('/system-configs', createSystemConfig);

/**
 * @route   PUT /api/system-configs/:id
 * @desc    Update system config
 * @access  Private
 */
router.put('/system-configs/:id', updateSystemConfig);

/**
 * @route   DELETE /api/system-configs/:id
 * @desc    Delete system config
 * @access  Private
 */
router.delete('/system-configs/:id', deleteSystemConfig);

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================

/**
 * @route   GET /api/audit-logs
 * @desc    Get all audit logs with filtering and pagination
 * @access  Private
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Get audit log by ID
 * @access  Private
 */
router.get('/audit-logs/:id', getAuditLogById);

/**
 * @route   POST /api/audit-logs
 * @desc    Create new audit log
 * @access  Private
 */
router.post('/audit-logs', createAuditLog);

/**
 * @route   DELETE /api/audit-logs/:id
 * @desc    Delete audit log
 * @access  Private
 */
router.delete('/audit-logs/:id', deleteAuditLog);

// ============================================================================
// DEVICE TOKEN ROUTES
// ============================================================================

/**
 * @route   GET /api/device-tokens
 * @desc    Get all device tokens with filtering and pagination
 * @access  Private
 */
router.get('/device-tokens', getDeviceTokens);

/**
 * @route   GET /api/device-tokens/:id
 * @desc    Get device token by ID
 * @access  Private
 */
router.get('/device-tokens/:id', getDeviceTokenById);

/**
 * @route   POST /api/device-tokens
 * @desc    Create new device token
 * @access  Private
 */
router.post('/device-tokens', createDeviceToken);

/**
 * @route   PUT /api/device-tokens/:id
 * @desc    Update device token
 * @access  Private
 */
router.put('/device-tokens/:id', updateDeviceToken);

/**
 * @route   DELETE /api/device-tokens/:id
 * @desc    Delete device token by ID
 * @access  Private
 */
router.delete('/device-tokens/:id', deleteDeviceToken);

/**
 * @route   DELETE /api/device-tokens/token/:token
 * @desc    Delete device token by token string
 * @access  Private
 */
router.delete('/device-tokens/token/:token', deleteDeviceTokenByToken);

export default router;
