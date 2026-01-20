import { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import * as notificationService from '@/services/notification';
import {
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationQuerySchema,
  MarkNotificationReadSchema,
  BulkMarkReadSchema,
  CreateSystemConfigSchema,
  UpdateSystemConfigSchema,
  SystemConfigQuerySchema,
  CreateAuditLogSchema,
  AuditLogQuerySchema,
  CreateDeviceTokenSchema,
  UpdateDeviceTokenSchema,
  DeviceTokenQuerySchema,
} from '@/schemas/notification';

// =========================
// NOTIFICATION CONTROLLERS
// =========================

/**
 * Create a new notification
 */
export const createNotification = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const parsed = CreateNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    if (!validate(parsed.data.userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const data = await notificationService.createNotification(parsed.data);
    return res.status(201).json({ data });
  } catch (error: any) {
    console.error('Error in createNotification controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notification = await notificationService.getNotificationById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ data: notification });
  } catch (error: any) {
    console.error('Error in getNotificationById controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get notifications with filtering and pagination
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const parsed = NotificationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    if (parsed.data.userId && !validate(parsed.data.userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const result = await notificationService.getNotifications(parsed.data);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in getNotifications controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Update notification
 */
export const updateNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const parsed = UpdateNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const updated = await notificationService.updateNotification(id, parsed.data);
    return res.json({ data: updated });
  } catch (error: any) {
    console.error('Error in updateNotification controller:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    await notificationService.deleteNotification(id);
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error in deleteNotification controller:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const parsed = MarkNotificationReadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const result = await notificationService.markNotificationAsRead(id);
    return res.json({ data: result });
  } catch (error: any) {
    console.error('Error in markNotificationAsRead controller:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Bulk mark notifications as read
 */
export const bulkMarkAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const parsed = BulkMarkReadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    // Validate all UUIDs
    for (const id of parsed.data.notificationIds) {
      if (!validate(id)) {
        return res.status(400).json({ error: `Invalid notification ID: ${id}` });
      }
    }

    const result = await notificationService.bulkMarkAsRead(parsed.data);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in bulkMarkAsRead controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId || !validate(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await notificationService.getUnreadCount(userId);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in getUnreadCount controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// =========================
// SYSTEM CONFIG CONTROLLERS
// =========================

/**
 * Create a new system config
 */
export const createSystemConfig = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const parsed = CreateSystemConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const data = await notificationService.createSystemConfig(parsed.data);
    return res.status(201).json({ data });
  } catch (error: any) {
    console.error('Error in createSystemConfig controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get system config by ID
 */
export const getSystemConfigById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid system config ID' });
    }

    const data = await notificationService.getSystemConfigById(id);
    if (!data) {
      return res.status(404).json({ error: 'System config not found' });
    }

    return res.json({ data });
  } catch (error: any) {
    console.error('Error in getSystemConfigById controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get system config by key
 */
export const getSystemConfigByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ error: 'Config key is required' });
    }

    const data = await notificationService.getSystemConfigByKey(key);
    if (!data) {
      return res.status(404).json({ error: 'System config not found' });
    }

    return res.json({ data });
  } catch (error: any) {
    console.error('Error in getSystemConfigByKey controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get system configs with filtering and pagination
 */
export const getSystemConfigs = async (req: Request, res: Response) => {
  try {
    const parsed = SystemConfigQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const result = await notificationService.getSystemConfigs(parsed.data);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in getSystemConfigs controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Update system config
 */
export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid system config ID' });
    }

    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const parsed = UpdateSystemConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const updated = await notificationService.updateSystemConfig(id, parsed.data);
    return res.json({ data: updated });
  } catch (error: any) {
    console.error('Error in updateSystemConfig controller:', error);
    if (error.message === 'System config not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Delete system config
 */
export const deleteSystemConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid system config ID' });
    }

    await notificationService.deleteSystemConfig(id);
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error in deleteSystemConfig controller:', error);
    if (error.message === 'System config not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// =========================
// AUDIT LOG CONTROLLERS
// =========================

/**
 * Create a new audit log
 */
export const createAuditLog = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const parsed = CreateAuditLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    if (!validate(parsed.data.recordId)) {
      return res.status(400).json({ error: 'Invalid recordId format' });
    }

    if (parsed.data.userId && !validate(parsed.data.userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const data = await notificationService.createAuditLog(parsed.data);
    return res.status(201).json({ data });
  } catch (error: any) {
    console.error('Error in createAuditLog controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get audit log by ID
 */
export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid audit log ID' });
    }

    const data = await notificationService.getAuditLogById(id);
    if (!data) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    return res.json({ data });
  } catch (error: any) {
    console.error('Error in getAuditLogById controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const parsed = AuditLogQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    if (parsed.data.recordId && !validate(parsed.data.recordId)) {
      return res.status(400).json({ error: 'Invalid recordId format' });
    }

    if (parsed.data.userId && !validate(parsed.data.userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const result = await notificationService.getAuditLogs(parsed.data);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in getAuditLogs controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Delete audit log
 */
export const deleteAuditLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid audit log ID' });
    }

    await notificationService.deleteAuditLog(id);
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error in deleteAuditLog controller:', error);
    if (error.message === 'Audit log not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// =========================
// DEVICE TOKEN CONTROLLERS
// =========================

/**
 * Create a new device token
 */
export const createDeviceToken = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const parsed = CreateDeviceTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    if (!validate(parsed.data.userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const data = await notificationService.createDeviceToken(parsed.data);
    return res.status(201).json({ data });
  } catch (error: any) {
    console.error('Error in createDeviceToken controller:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get device token by ID
 */
export const getDeviceTokenById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid device token ID' });
    }

    const data = await notificationService.getDeviceTokenById(id);
    if (!data) {
      return res.status(404).json({ error: 'Device token not found' });
    }

    return res.json({ data });
  } catch (error: any) {
    console.error('Error in getDeviceTokenById controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get device tokens with filtering and pagination
 */
export const getDeviceTokens = async (req: Request, res: Response) => {
  try {
    const parsed = DeviceTokenQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    if (parsed.data.userId && !validate(parsed.data.userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const result = await notificationService.getDeviceTokens(parsed.data);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in getDeviceTokens controller:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Update device token
 */
export const updateDeviceToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid device token ID' });
    }

    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const parsed = UpdateDeviceTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const updated = await notificationService.updateDeviceToken(id, parsed.data);
    return res.json({ data: updated });
  } catch (error: any) {
    console.error('Error in updateDeviceToken controller:', error);
    if (error.message === 'Device token not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Delete device token
 */
export const deleteDeviceToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !validate(id)) {
      return res.status(400).json({ error: 'Invalid device token ID' });
    }

    await notificationService.deleteDeviceToken(id);
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error in deleteDeviceToken controller:', error);
    if (error.message === 'Device token not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Delete device token by token string
 */
export const deleteDeviceTokenByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    await notificationService.deleteDeviceTokenByToken(token);
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error in deleteDeviceTokenByToken controller:', error);
    if (error.message === 'Device token not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
