import { prisma } from '@/lib/prisma';

export const Table = prisma.table
export const Reservation = prisma.reservation
export const TableOrder = prisma.tableOrder
export const StaffSchedule = prisma.staffSchedule
export const StaffAttendance = prisma.staffAttendance
