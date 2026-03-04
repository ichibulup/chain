import type {
  CreateNotification,
  UpdateNotification,
  NotificationQuery,
  BulkMarkRead,
  CreateSystemConfig,
  UpdateSystemConfig,
  SystemConfigQuery,
  CreateAuditLog,
  AuditLogQuery,
  CreateDeviceToken,
  UpdateDeviceToken,
  DeviceTokenQuery,
} from '@/schemas/notification';
import {
  AuditLog,
  DeviceToken,
  Notification,
  SystemConfig,
} from '@/models/notification';
import {
  checkUserExists,
} from '@/services/helper'

// =========================
// NOTIFICATION SERVICES
// =========================

/**
 * Create a new notification
 */
export const createNotification = async (data: CreateNotification) => {
  try {
    // Verify user exists
    const userExists = await checkUserExists(data.userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    const notification = await Notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        status: data.status || 'unread',
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
        scheduledAt: data.scheduledAt,
        expiresAt: data.expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error('Error in createNotification service:', error);
    throw error;
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (id: string) => {
  try {
    const notification = await Notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error('Error in getNotificationById service:', error);
    throw error;
  }
};

/**
 * Get notifications with filtering and pagination
 */
export const getNotifications = async (query: NotificationQuery) => {
  try {
    const {
      userId,
      type,
      priority,
      status,
      relatedType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (relatedType) {
      where.relatedType = {
        contains: relatedType,
        mode: 'insensitive',
      };
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

    // Execute query with pagination
    const [data, total] = await Promise.all([
      Notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      Notification.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getNotifications service:', error);
    throw error;
  }
};

/**
 * Update notification
 */
export const updateNotification = async (id: string, data: UpdateNotification) => {
  try {
    // Check if notification exists
    const existingNotification = await Notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new Error('Notification not found');
    }

    const notification = await Notification.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error('Error in updateNotification service:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (id: string) => {
  try {
    // Check if notification exists
    const existingNotification = await Notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new Error('Notification not found');
    }

    await Notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted successfully' };
  } catch (error) {
    console.error('Error in deleteNotification service:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (id: string) => {
  try {
    // Check if notification exists
    const existingNotification = await Notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new Error('Notification not found');
    }

    const notification = await Notification.update({
      where: { id },
      data: {
        status: 'read',
        readAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error('Error in markNotificationAsRead service:', error);
    throw error;
  }
};

/**
 * Bulk mark notifications as read
 */
export const bulkMarkAsRead = async (data: BulkMarkRead) => {
  try {
    const result = await Notification.updateMany({
      where: {
        id: {
          in: data.notificationIds,
        },
      },
      data: {
        status: 'read',
        readAt: new Date(),
      },
    });

    return {
      message: `${result.count} notifications marked as read`,
      count: result.count,
    };
  } catch (error) {
    console.error('Error in bulkMarkAsRead service:', error);
    throw error;
  }
};

/**
 * Get unread notification count for user
 */
export const getUnreadCount = async (userId: string) => {
  try {
    const count = await Notification.count({
      where: {
        userId,
        status: 'unread',
      },
    });

    return { count };
  } catch (error) {
    console.error('Error in getUnreadCount service:', error);
    throw error;
  }
};

// =========================
// SYSTEM CONFIG SERVICES
// =========================

/**
 * Create a new system config
 */
export const createSystemConfig = async (data: CreateSystemConfig) => {
  try {
    const systemConfig = await SystemConfig.create({
      data: {
        configKey: data.configKey,
        configValue: data.configValue,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });

    return systemConfig;
  } catch (error) {
    console.error('Error in createSystemConfig service:', error);
    throw error;
  }
};

/**
 * Get system config by ID
 */
export const getSystemConfigById = async (id: string) => {
  try {
    const systemConfig = await SystemConfig.findUnique({
      where: { id },
    });

    return systemConfig;
  } catch (error) {
    console.error('Error in getSystemConfigById service:', error);
    throw error;
  }
};

/**
 * Get system config by key
 */
export const getSystemConfigByKey = async (configKey: string) => {
  try {
    const systemConfig = await SystemConfig.findUnique({
      where: { configKey },
    });

    return systemConfig;
  } catch (error) {
    console.error('Error in getSystemConfigByKey service:', error);
    throw error;
  }
};

/**
 * Get system configs with filtering and pagination
 */
export const getSystemConfigs = async (query: SystemConfigQuery) => {
  try {
    const {
      configKey,
      isActive,
      search,
      page = 1,
      limit = 10,
      sortBy = 'configKey',
      sortOrder = 'asc',
    } = query;

    // Build where clause
    const where: any = {};

    if (configKey) {
      where.configKey = {
        contains: configKey,
        mode: 'insensitive',
      };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        {
          configKey: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      SystemConfig.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      SystemConfig.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getSystemConfigs service:', error);
    throw error;
  }
};

/**
 * Update system config
 */
export const updateSystemConfig = async (id: string, data: UpdateSystemConfig) => {
  try {
    // Check if system config exists
    const existingConfig = await SystemConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new Error('System config not found');
    }

    const systemConfig = await SystemConfig.update({
      where: { id },
      data,
    });

    return systemConfig;
  } catch (error) {
    console.error('Error in updateSystemConfig service:', error);
    throw error;
  }
};

/**
 * Delete system config
 */
export const deleteSystemConfig = async (id: string) => {
  try {
    // Check if system config exists
    const existingConfig = await SystemConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new Error('System config not found');
    }

    await SystemConfig.delete({
      where: { id },
    });

    return { message: 'System config deleted successfully' };
  } catch (error) {
    console.error('Error in deleteSystemConfig service:', error);
    throw error;
  }
};

// =========================
// AUDIT LOG SERVICES
// =========================

/**
 * Create a new audit log
 */
export const createAuditLog = async (data: CreateAuditLog) => {
  try {
    const auditLog = await AuditLog.create({
      data: {
        tableName: data.tableName,
        recordId: data.recordId,
        action: data.action,
        oldValues: data.oldValues,
        newValues: data.newValues,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    return auditLog;
  } catch (error) {
    console.error('Error in createAuditLog service:', error);
    throw error;
  }
};

/**
 * Get audit log by ID
 */
export const getAuditLogById = async (id: string) => {
  try {
    const auditLog = await AuditLog.findUnique({
      where: { id },
    });

    return auditLog;
  } catch (error) {
    console.error('Error in getAuditLogById service:', error);
    throw error;
  }
};

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (query: AuditLogQuery) => {
  try {
    const {
      tableName,
      recordId,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: any = {};

    if (tableName) {
      where.tableName = {
        contains: tableName,
        mode: 'insensitive',
      };
    }

    if (recordId) {
      where.recordId = recordId;
    }

    if (action) {
      where.action = action;
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

    // Execute query with pagination
    const [data, total] = await Promise.all([
      AuditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      AuditLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getAuditLogs service:', error);
    throw error;
  }
};

/**
 * Delete audit log
 */
export const deleteAuditLog = async (id: string) => {
  try {
    // Check if audit log exists
    const existingLog = await AuditLog.findUnique({
      where: { id },
    });

    if (!existingLog) {
      throw new Error('Audit log not found');
    }

    await AuditLog.delete({
      where: { id },
    });

    return { message: 'Audit log deleted successfully' };
  } catch (error) {
    console.error('Error in deleteAuditLog service:', error);
    throw error;
  }
};

// =========================
// DEVICE TOKEN SERVICES
// =========================

/**
 * Create a new device token
 */
export const createDeviceToken = async (data: CreateDeviceToken) => {
  try {
    // Verify user exists
    const userExists = await checkUserExists(data.userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Check if token already exists
    const existingToken = await DeviceToken.findUnique({
      where: { token: data.token },
    });

    if (existingToken) {
      // Update existing token
      return await DeviceToken.update({
        where: { token: data.token },
        data: {
          userId: data.userId,
          platform: data.platform,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });
    }

    const deviceToken = await DeviceToken.create({
      data: {
        userId: data.userId,
        token: data.token,
        platform: data.platform,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return deviceToken;
  } catch (error) {
    console.error('Error in createDeviceToken service:', error);
    throw error;
  }
};

/**
 * Get device token by ID
 */
export const getDeviceTokenById = async (id: string) => {
  try {
    const deviceToken = await DeviceToken.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return deviceToken;
  } catch (error) {
    console.error('Error in getDeviceTokenById service:', error);
    throw error;
  }
};

/**
 * Get device tokens with filtering and pagination
 */
export const getDeviceTokens = async (query: DeviceTokenQuery) => {
  try {
    const {
      userId,
      platform,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (platform) {
      where.platform = platform;
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      DeviceToken.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      DeviceToken.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getDeviceTokens service:', error);
    throw error;
  }
};

/**
 * Update device token
 */
export const updateDeviceToken = async (id: string, data: UpdateDeviceToken) => {
  try {
    // Check if device token exists
    const existingToken = await DeviceToken.findUnique({
      where: { id },
    });

    if (!existingToken) {
      throw new Error('Device token not found');
    }

    const deviceToken = await DeviceToken.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return deviceToken;
  } catch (error) {
    console.error('Error in updateDeviceToken service:', error);
    throw error;
  }
};

/**
 * Delete device token
 */
export const deleteDeviceToken = async (id: string) => {
  try {
    // Check if device token exists
    const existingToken = await DeviceToken.findUnique({
      where: { id },
    });

    if (!existingToken) {
      throw new Error('Device token not found');
    }

    await DeviceToken.delete({
      where: { id },
    });

    return { message: 'Device token deleted successfully' };
  } catch (error) {
    console.error('Error in deleteDeviceToken service:', error);
    throw error;
  }
};

/**
 * Delete device token by token string
 */
export const deleteDeviceTokenByToken = async (token: string) => {
  try {
    const existingToken = await DeviceToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      throw new Error('Device token not found');
    }

    await DeviceToken.delete({
      where: { token },
    });

    return { message: 'Device token deleted successfully' };
  } catch (error) {
    console.error('Error in deleteDeviceTokenByToken service:', error);
    throw error;
  }
};
