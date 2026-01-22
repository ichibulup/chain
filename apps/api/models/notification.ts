import { prisma } from '@/lib/prisma';

export const Notification = prisma.notification
export const SystemConfig = prisma.systemConfig
export const AuditLog = prisma.auditLog
export const DeviceToken = prisma.deviceToken
