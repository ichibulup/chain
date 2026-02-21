import { prisma } from '@/lib/prisma';

export const User = prisma.user
export const Organization = prisma.organization
export const OrganizationMembership = prisma.organizationMembership
export const RestaurantChain = prisma.restaurantChain
export const Restaurant = prisma.restaurant
export const RestaurantUserRole = prisma.restaurantUserRole
