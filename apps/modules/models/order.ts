import { prisma } from '@/lib/prisma';

export const Order = prisma.order
export const OrderItem = prisma.orderItem
export const OrderItemOption = prisma.orderItemOption
export const OrderStatusHistory = prisma.orderStatusHistory
export const Payment = prisma.payment
export const Refund = prisma.refund
export const PaymentIntent = prisma.paymentIntent
