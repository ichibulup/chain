import {
  CreateDeliveryStaff,
  UpdateDeliveryStaff,
  DeliveryStaffQuery,
  CreateDelivery,
  UpdateDelivery,
  DeliveryQuery,
  CreateDeliveryLocation,
  UpdateDeliveryLocation,
  DeliveryLocationQuery,
  CreateDeliveryZone,
  UpdateDeliveryZone,
  DeliveryZoneQuery,
  BulkUpdateDeliveryStaffStatus,
  BulkUpdateDeliveryStatus,
  DeliveryStaffAvailabilityQuery,
  DeliveryTrackingQuery,
  DeliveryZoneCoverageQuery,
  DeliveryStatisticsQuery,
  DeliveryPerformanceQuery,
} from '@/schemas/delivery';
import {
  Delivery,
  DeliveryLocation,
  DeliveryStaff,
  DeliveryZone,
} from '@/models/delivery';
import { Order } from '@/models/order';
import { Restaurant, User } from '@/models/organization';

// =========================
// DELIVERY STAFF SERVICES
// =========================

/**
 * Create a new delivery staff
 */
export const createDeliveryStaff = async (data: CreateDeliveryStaff) => {
  try {
    // Check if user exists
    const user = await User.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if delivery staff already exists for this user
    const existingStaff = await DeliveryStaff.findUnique({
      where: { userId: data.userId }
    });

    if (existingStaff) {
      throw new Error('Delivery staff already exists for this user');
    }

    const deliveryStaff = await DeliveryStaff.create({
      data: {
        userId: data.userId,
        vehicleType: data.vehicleType,
        licensePlate: data.licensePlate,
        status: data.status,
        currentZone: data.currentZone,
        maxCapacity: data.maxCapacity,
        rating: data.rating,
        totalDeliveries: data.totalDeliveries,
        totalDistanceKm: data.totalDistanceKm,
        totalEarnings: data.totalEarnings,
      },
      include: {
        user: true,
        deliveries: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return deliveryStaff;
  } catch (error) {
    console.error('Error creating delivery staff:', error);
    throw new Error('Failed to create delivery staff');
  }
};

/**
 * Get delivery staff by ID
 */
export const getDeliveryStaffById = async (id: string) => {
  try {
    const deliveryStaff = await DeliveryStaff.findUnique({
      where: { id },
      include: {
        user: true,
        deliveries: {
          include: {
            order: true,
            restaurant: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return deliveryStaff;
  } catch (error) {
    console.error('Error getting delivery staff by ID:', error);
    throw new Error('Failed to get delivery staff');
  }
};

/**
 * Get all delivery staff with filtering and pagination
 */
export const getDeliveryStaff = async (query: DeliveryStaffQuery) => {
  try {
    const {
      userId,
      vehicleType,
      status,
      currentZone,
      minRating,
      maxRating,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    if (status) {
      where.status = status;
    }

    if (currentZone) {
      where.currentZone = currentZone;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.rating.lte = maxRating;
      }
    }

    if (search) {
      where.OR = [
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { currentZone: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [deliveryStaff, total] = await Promise.all([
      DeliveryStaff.findMany({
        where,
        include: {
          user: true,
          deliveries: {
            where: {
              status: { in: ['assigned', 'accepted', 'pickedUp', 'inTransit'] },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      DeliveryStaff.count({ where }),
    ]);

    return {
      data: deliveryStaff,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting delivery staff:', error);
    throw new Error('Failed to get delivery staff');
  }
};

/**
 * Update delivery staff
 */
export const updateDeliveryStaff = async (id: string, data: UpdateDeliveryStaff) => {
  try {
    const deliveryStaff = await DeliveryStaff.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        deliveries: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return deliveryStaff;
  } catch (error) {
    console.error('Error updating delivery staff:', error);
    throw new Error('Failed to update delivery staff');
  }
};

/**
 * Delete delivery staff
 */
export const deleteDeliveryStaff = async (id: string) => {
  try {
    // Check if delivery staff has active deliveries
    const activeDeliveries = await Delivery.count({
      where: {
        deliveryStaffId: id,
        status: { in: ['assigned', 'accepted', 'pickedUp', 'inTransit'] },
      },
    });

    if (activeDeliveries > 0) {
      throw new Error('Cannot delete delivery staff with active deliveries');
    }

    await DeliveryStaff.delete({
      where: { id },
    });

    return { message: 'Delivery staff deleted successfully' };
  } catch (error) {
    console.error('Error deleting delivery staff:', error);
    throw new Error('Failed to delete delivery staff');
  }
};

// =========================
// DELIVERY SERVICES
// =========================

/**
 * Create a new delivery
 */
export const createDelivery = async (data: CreateDelivery) => {
  try {
    // Check if order exists
    const order = await Order.findUnique({
      where: { id: data.orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Check if delivery staff exists (if provided)
    if (data.deliveryStaffId) {
      const deliveryStaff = await DeliveryStaff.findUnique({
        where: { id: data.deliveryStaffId }
      });

      if (!deliveryStaff) {
        throw new Error('Delivery staff not found');
      }
    }

    // Check if delivery already exists for this order
    const existingDelivery = await Delivery.findUnique({
      where: { orderId: data.orderId }
    });

    if (existingDelivery) {
      throw new Error('Delivery already exists for this order');
    }

    // Generate tracking code if not provided
    const trackingCode = data.trackingCode || `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const delivery = await Delivery.create({
      data: {
        orderId: data.orderId,
        restaurantId: data.restaurantId,
        deliveryStaffId: data.deliveryStaffId,
        status: data.status,
        estimatedTimeMin: data.estimatedTimeMin,
        deliveryFee: data.deliveryFee,
        distanceKm: data.distanceKm,
        destinationLatitude: data.destinationLatitude,
        destinationLongitude: data.destinationLongitude,
        notes: data.notes,
        trackingCode,
        estimatedArrival: data.estimatedArrival,
        assignedAt: data.deliveryStaffId ? new Date() : null,
      },
      include: {
        order: {
          include: {
            customer: true,
            address: true,
          },
        },
        restaurant: true,
        deliveryStaff: {
          include: {
            user: true,
          },
        },
        locations: {
          orderBy: {
            capturedAt: 'desc',
          },
        },
      },
    });

    return delivery;
  } catch (error) {
    console.log('Error creating delivery:', error);
    throw new Error('Failed to create delivery');
  }
};

/**
 * Get delivery by ID
 */
export const getDeliveryById = async (id: string) => {
  try {
    const delivery = await Delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            address: true,
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        restaurant: true,
        deliveryStaff: {
          include: {
            user: true,
          },
        },
        locations: {
          orderBy: {
            capturedAt: 'desc',
          },
        },
      },
    });

    return delivery;
  } catch (error) {
    console.error('Error getting delivery by ID:', error);
    throw new Error('Failed to get delivery');
  }
};

/**
 * Get all deliveries with filtering and pagination
 */
export const getDeliveries = async (query: DeliveryQuery) => {
  try {
    const {
      orderId,
      restaurantId,
      deliveryStaffId,
      status,
      startDate,
      endDate,
      minRating,
      maxRating,
      isTrackingActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (deliveryStaffId) {
      where.deliveryStaffId = deliveryStaffId;
    }

    if (status) {
      where.status = status;
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

    if (minRating !== undefined || maxRating !== undefined) {
      where.customerRating = {};
      if (minRating !== undefined) {
        where.customerRating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.customerRating.lte = maxRating;
      }
    }

    if (isTrackingActive !== undefined) {
      where.isTrackingActive = isTrackingActive;
    }

    if (search) {
      where.OR = [
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { customerFeedback: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [deliveries, total] = await Promise.all([
      Delivery.findMany({
        where,
        include: {
          order: {
            include: {
              customer: true,
              address: true,
            },
          },
          restaurant: true,
          deliveryStaff: {
            include: {
              user: true,
            },
          },
          locations: {
            orderBy: {
              capturedAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      Delivery.count({ where }),
    ]);

    return {
      data: deliveries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting deliveries:', error);
    throw new Error('Failed to get deliveries');
  }
};

/**
 * Update delivery
 */
export const updateDelivery = async (id: string, data: UpdateDelivery) => {
  try {
    const existing = await Delivery.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Delivery not found');
    }

    const now = new Date();
    const updateData: UpdateDelivery & { assignedAt?: Date | null; pickedUpAt?: Date | null; deliveredAt?: Date | null; actualArrival?: Date | null; isTrackingActive?: boolean } = {
      ...data,
      updatedAt: now,
    };

    if (data.status) {
      if ((data.status === 'assigned' || data.status === 'accepted') && !existing.assignedAt) {
        updateData.assignedAt = now;
      }

      if ((data.status === 'pickedUp' || data.status === 'inTransit') && !existing.pickedUpAt) {
        updateData.pickedUpAt = now;
      }

      if (data.status === 'delivered' && !existing.deliveredAt) {
        updateData.deliveredAt = now;
        updateData.actualArrival = now;
        updateData.isTrackingActive = false;
      }

      if (data.status === 'failed' || data.status === 'cancelled') {
        updateData.isTrackingActive = false;
      }
    }

    const delivery = await Delivery.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: true,
            address: true,
          },
        },
        restaurant: true,
        deliveryStaff: {
          include: {
            user: true,
          },
        },
        locations: {
          orderBy: {
            capturedAt: 'desc',
          },
        },
      },
    });

    if (data.status === 'delivered') {
      await Order.update({
        where: { id: existing.orderId },
        data: {
          status: 'completed',
          deliveredAt: now,
        },
      });
    }

    const staffId = data.deliveryStaffId ?? existing.deliveryStaffId;
    if (staffId && data.status) {
      if (['assigned', 'accepted', 'pickedUp', 'inTransit'].includes(data.status)) {
        await DeliveryStaff.update({
          where: { id: staffId },
          data: {
            status: 'busy',
            updatedAt: now,
          },
        });
      }

      if (['delivered', 'failed', 'cancelled'].includes(data.status)) {
        if (data.status === 'delivered') {
          await DeliveryStaff.update({
            where: { id: staffId },
            data: {
              totalDeliveries: { increment: 1 },
              totalEarnings: { increment: existing.deliveryFee },
              updatedAt: now,
            },
          });
        }

        const activeCount = await Delivery.count({
          where: {
            deliveryStaffId: staffId,
            status: { in: ['assigned', 'accepted', 'pickedUp', 'inTransit'] },
          },
        });

        if (activeCount === 0) {
          await DeliveryStaff.update({
            where: { id: staffId },
            data: {
              status: 'available',
              updatedAt: now,
            },
          });
        }
      }
    }

    return delivery;
  } catch (error) {
    console.error('Error updating delivery:', error);
    throw new Error('Failed to update delivery');
  }
};

/**
 * Delete delivery
 */
export const deleteDelivery = async (id: string) => {
  try {
    await Delivery.delete({
      where: { id },
    });

    return { message: 'Delivery deleted successfully' };
  } catch (error) {
    console.error('Error deleting delivery:', error);
    throw new Error('Failed to delete delivery');
  }
};

// =========================
// DELIVERY LOCATION SERVICES
// =========================

/**
 * Create a new delivery location
 */
export const createDeliveryLocation = async (data: CreateDeliveryLocation, socketId?: string) => {
  try {
    // Check if delivery exists
    const delivery = await Delivery.findUnique({
      where: { id: data.deliveryId }
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const deliveryLocation = await DeliveryLocation.create({
      data: {
        deliveryId: data.deliveryId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracyMeters: data.accuracyMeters,
        headingDegrees: data.headingDegrees,
        speedMetersPerSecond: data.speedMetersPerSecond,
        capturedAt: data.capturedAt || new Date(),
      },
      include: {
        delivery: true,
      },
    });

    // Update delivery current location and trackingCode
    await Delivery.update({
      where: { id: data.deliveryId },
      data: {
        currentLatitude: data.latitude,
        currentLongitude: data.longitude,
        lastLocationAt: deliveryLocation.capturedAt,
        trackingCode: socketId || delivery.trackingCode, // Set trackingCode = socketId
      },
    });

    return deliveryLocation;
  } catch (error) {
    console.error('Error creating delivery location:', error);
    throw new Error('Failed to create delivery location');
  }
};

/**
 * Get delivery location by ID
 */
export const getDeliveryLocationById = async (id: string) => {
  try {
    const deliveryLocation = await DeliveryLocation.findUnique({
      where: { id },
      include: {
        delivery: true,
      },
    });

    return deliveryLocation;
  } catch (error) {
    console.error('Error getting delivery location by ID:', error);
    throw new Error('Failed to get delivery location');
  }
};

/**
 * Get all delivery locations with filtering and pagination
 */
export const getDeliveryLocations = async (query: DeliveryLocationQuery) => {
  try {
    const {
      deliveryId,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (deliveryId) {
      where.deliveryId = deliveryId;
    }

    if (startDate || endDate) {
      where.capturedAt = {};
      if (startDate) {
        where.capturedAt.gte = startDate;
      }
      if (endDate) {
        where.capturedAt.lte = endDate;
      }
    }

    const [deliveryLocations, total] = await Promise.all([
      DeliveryLocation.findMany({
        where,
        include: {
          delivery: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      DeliveryLocation.count({ where }),
    ]);

    return {
      data: deliveryLocations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting delivery locations:', error);
    throw new Error('Failed to get delivery locations');
  }
};

/**
 * Update delivery location
 */
export const updateDeliveryLocation = async (id: string, data: UpdateDeliveryLocation) => {
  try {
    const deliveryLocation = await DeliveryLocation.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        delivery: true,
      },
    });

    return deliveryLocation;
  } catch (error) {
    console.error('Error updating delivery location:', error);
    throw new Error('Failed to update delivery location');
  }
};

/**
 * Delete delivery location
 */
export const deleteDeliveryLocation = async (id: string) => {
  try {
    await DeliveryLocation.delete({
      where: { id },
    });

    return { message: 'Delivery location deleted successfully' };
  } catch (error) {
    console.error('Error deleting delivery location:', error);
    throw new Error('Failed to delete delivery location');
  }
};

// =========================
// DELIVERY ZONE SERVICES
// =========================

/**
 * Create a new delivery zone
 */
export const createDeliveryZone = async (data: CreateDeliveryZone) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const deliveryZone = await DeliveryZone.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        polygonGeo: data.polygonGeo,
        deliveryFee: data.deliveryFee,
        minOrderAmount: data.minOrderAmount,
        maxDistanceKm: data.maxDistanceKm,
        isActive: data.isActive,
      },
      include: {
        restaurant: true,
        orders: true,
      },
    });

    return deliveryZone;
  } catch (error) {
    console.error('Error creating delivery zone:', error);
    throw new Error('Failed to create delivery zone');
  }
};

/**
 * Get delivery zone by ID
 */
export const getDeliveryZoneById = async (id: string) => {
  try {
    const deliveryZone = await DeliveryZone.findUnique({
      where: { id },
      include: {
        restaurant: true,
        orders: {
          include: {
            customer: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return deliveryZone;
  } catch (error) {
    console.error('Error getting delivery zone by ID:', error);
    throw new Error('Failed to get delivery zone');
  }
};

/**
 * Get all delivery zones with filtering and pagination
 */
export const getDeliveryZones = async (query: DeliveryZoneQuery) => {
  try {
    const {
      restaurantId,
      isActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [deliveryZones, total] = await Promise.all([
      DeliveryZone.findMany({
        where,
        include: {
          restaurant: true,
          orders: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      DeliveryZone.count({ where }),
    ]);

    return {
      data: deliveryZones,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting delivery zones:', error);
    throw new Error('Failed to get delivery zones');
  }
};

/**
 * Update delivery zone
 */
export const updateDeliveryZone = async (id: string, data: UpdateDeliveryZone) => {
  try {
    const deliveryZone = await DeliveryZone.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        restaurant: true,
        orders: true,
      },
    });

    return deliveryZone;
  } catch (error) {
    console.error('Error updating delivery zone:', error);
    throw new Error('Failed to update delivery zone');
  }
};

/**
 * Delete delivery zone
 */
export const deleteDeliveryZone = async (id: string) => {
  try {
    // Check if delivery zone has orders
    const orders = await Order.count({
      where: { deliveryZoneId: id }
    });

    if (orders > 0) {
      throw new Error('Cannot delete delivery zone with existing orders');
    }

    await DeliveryZone.delete({
      where: { id },
    });

    return { message: 'Delivery zone deleted successfully' };
  } catch (error) {
    console.error('Error deleting delivery zone:', error);
    throw new Error('Failed to delete delivery zone');
  }
};

// =========================
// BULK OPERATION SERVICES
// =========================

/**
 * Bulk update delivery staff status
 */
export const bulkUpdateDeliveryStaffStatus = async (data: BulkUpdateDeliveryStaffStatus) => {
  try {
    const { staffIds, status } = data;

    // Validate all staff exist
    const staff = await DeliveryStaff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true },
    });

    if (staff.length !== staffIds.length) {
      throw new Error('One or more delivery staff not found');
    }

    await DeliveryStaff.updateMany({
      where: { id: { in: staffIds } },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return { message: `${staffIds.length} delivery staff status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating delivery staff status:', error);
    throw new Error('Failed to bulk update delivery staff status');
  }
};

/**
 * Bulk update delivery status
 */
export const bulkUpdateDeliveryStatus = async (data: BulkUpdateDeliveryStatus) => {
  try {
    const { deliveryIds, status, notes } = data;

    // Validate all deliveries exist
    const deliveries = await Delivery.findMany({
      where: { id: { in: deliveryIds } },
      select: { id: true },
    });

    if (deliveries.length !== deliveryIds.length) {
      throw new Error('One or more deliveries not found');
    }

    await Delivery.updateMany({
      where: { id: { in: deliveryIds } },
      data: {
        status,
        notes,
        updatedAt: new Date(),
      },
    });

    return { message: `${deliveryIds.length} deliveries status updated successfully` };
  } catch (error) {
    console.error('Error bulk updating delivery status:', error);
    throw new Error('Failed to bulk update delivery status');
  }
};

// =========================
// SPECIAL QUERY SERVICES
// =========================

/**
 * Get delivery staff availability
 */
export const getDeliveryStaffAvailability = async (query: DeliveryStaffAvailabilityQuery) => {
  try {
    const { restaurantId, vehicleType, currentZone, minRating } = query;

    const where: any = {
      status: 'available',
    };

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    if (currentZone) {
      where.currentZone = currentZone;
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    const availableStaff = await DeliveryStaff.findMany({
      where,
      include: {
        user: true,
        deliveries: {
          where: {
            status: { in: ['assigned', 'accepted', 'pickedUp', 'inTransit'] },
            restaurantId,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // Filter staff with capacity
    const staffWithCapacity = availableStaff.filter(staff => 
      staff.deliveries.length < staff.maxCapacity
    );

    return staffWithCapacity;
  } catch (error) {
    console.error('Error getting delivery staff availability:', error);
    throw new Error('Failed to get delivery staff availability');
  }
};

/**
 * Get delivery by tracking code
 */
export const getDeliveryByTrackingCode = async (query: DeliveryTrackingQuery) => {
  try {
    const { trackingCode } = query;

    const delivery = await Delivery.findUnique({
      where: { trackingCode },
      include: {
        order: {
          include: {
            customer: true,
            address: true,
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        restaurant: true,
        deliveryStaff: {
          include: {
            user: true,
          },
        },
        locations: {
          orderBy: {
            capturedAt: 'desc',
          },
        },
      },
    });

    return delivery;
  } catch (error) {
    console.error('Error getting delivery by tracking code:', error);
    throw new Error('Failed to get delivery by tracking code');
  }
};

/**
 * Check delivery zone coverage
 */
export const checkDeliveryZoneCoverage = async (query: DeliveryZoneCoverageQuery) => {
  try {
    const { restaurantId, latitude, longitude } = query;

    const deliveryZones = await DeliveryZone.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      include: {
        restaurant: true,
      },
    });

    // This is a simplified check - in a real implementation, you would use
    // a proper point-in-polygon algorithm to check if the coordinates
    // fall within the polygonGeo boundaries
    const coveredZones = deliveryZones.filter(zone => {
      // For now, return all zones as covered
      // In production, implement proper polygon checking
      return true;
    });

    return {
      isCovered: coveredZones.length > 0,
      zones: coveredZones,
    };
  } catch (error) {
    console.error('Error checking delivery zone coverage:', error);
    throw new Error('Failed to check delivery zone coverage');
  }
};

/**
 * Get delivery statistics
 */
export const getDeliveryStatistics = async (query: DeliveryStatisticsQuery) => {
  try {
    const { restaurantId, deliveryStaffId, startDate, endDate, groupBy } = query;

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (deliveryStaffId) {
      where.deliveryStaffId = deliveryStaffId;
    }

    const deliveries = await Delivery.findMany({
      where,
      select: {
        id: true,
        status: true,
        deliveryFee: true,
        distanceKm: true,
        customerRating: true,
        createdAt: true,
        deliveredAt: true,
      },
    });

    // Group by date
    const groupedData: { [key: string]: any } = {};

    deliveries.forEach(delivery => {
      const date = new Date(delivery.createdAt);
      let dateKey: string = '';

      switch (groupBy) {
        case 'day':
          dateKey = date.toISOString().split('T')[0] || '';
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          dateKey = weekStart.toISOString().split('T')[0] || '';
          break;
        case 'month':
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          dateKey = date.toISOString().split('T')[0] || '';
      }

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          totalDeliveries: 0,
          completedDeliveries: 0,
          totalRevenue: 0,
          totalDistance: 0,
          averageRating: 0,
          averageDeliveryTime: 0,
        };
      }

      groupedData[dateKey].totalDeliveries++;
      groupedData[dateKey].totalRevenue += Number(delivery.deliveryFee);
      groupedData[dateKey].totalDistance += Number(delivery.distanceKm || 0);

      if (delivery.status === 'delivered') {
        groupedData[dateKey].completedDeliveries++;
      }

      if (delivery.customerRating) {
        groupedData[dateKey].averageRating += delivery.customerRating;
      }
    });

    // Calculate averages
    Object.values(groupedData).forEach((data: any) => {
      if (data.totalDeliveries > 0) {
        data.averageRating = data.averageRating / data.totalDeliveries;
      }
    });

    return Object.values(groupedData);
  } catch (error) {
    console.error('Error getting delivery statistics:', error);
    throw new Error('Failed to get delivery statistics');
  }
};

/**
 * Get delivery performance
 */
export const getDeliveryPerformance = async (query: DeliveryPerformanceQuery) => {
  try {
    const { restaurantId, deliveryStaffId, startDate, endDate } = query;

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (deliveryStaffId) {
      where.deliveryStaffId = deliveryStaffId;
    }

    const deliveries = await Delivery.findMany({
      where,
      include: {
        deliveryStaff: {
          include: {
            user: true,
          },
        },
      },
    });

    const performance = {
      totalDeliveries: deliveries.length,
      completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
      cancelledDeliveries: deliveries.filter(d => d.status === 'cancelled').length,
      failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
      totalRevenue: deliveries.reduce((sum, d) => sum + Number(d.deliveryFee), 0),
      totalDistance: deliveries.reduce((sum, d) => sum + Number(d.distanceKm || 0), 0),
      averageRating: 0,
      averageDeliveryTime: 0,
      onTimeDeliveries: 0,
      staffPerformance: {} as { [key: string]: any },
    };

    // Calculate averages
    const ratedDeliveries = deliveries.filter(d => d.customerRating);
    if (ratedDeliveries.length > 0) {
      performance.averageRating = ratedDeliveries.reduce((sum, d) => sum + (d.customerRating || 0), 0) / ratedDeliveries.length;
    }

    const completedDeliveries = deliveries.filter(d => d.status === 'delivered' && d.actualTimeMin);
    if (completedDeliveries.length > 0) {
      performance.averageDeliveryTime = completedDeliveries.reduce((sum, d) => sum + (d.actualTimeMin || 0), 0) / completedDeliveries.length;
    }

    // Group by staff
    deliveries.forEach(delivery => {
      if (delivery.deliveryStaffId) {
        const staffId = delivery.deliveryStaffId;
        if (!performance.staffPerformance[staffId]) {
          performance.staffPerformance[staffId] = {
            staffName: delivery.deliveryStaff?.user?.fullName || 'Unknown',
            totalDeliveries: 0,
            completedDeliveries: 0,
            totalRevenue: 0,
            averageRating: 0,
          };
        }

        performance.staffPerformance[staffId].totalDeliveries++;
        performance.staffPerformance[staffId].totalRevenue += Number(delivery.deliveryFee);

        if (delivery.status === 'delivered') {
          performance.staffPerformance[staffId].completedDeliveries++;
        }

        if (delivery.customerRating) {
          performance.staffPerformance[staffId].averageRating += delivery.customerRating;
        }
      }
    });

    // Calculate staff averages
    Object.values(performance.staffPerformance).forEach((staff: any) => {
      if (staff.totalDeliveries > 0) {
        staff.averageRating = staff.averageRating / staff.totalDeliveries;
      }
    });

    return performance;
  } catch (error) {
    console.error('Error getting delivery performance:', error);
    throw new Error('Failed to get delivery performance');
  }
};

/**
 * Check if order exists
 */
export const checkOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    const order = await Order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    return !!order;
  } catch (error) {
    console.error('Error checking order existence:', error);
    return false;
  }
};

/**
 * Resolve delivery ID by delivery ID or order ID
 */
export const resolveDeliveryId = async (deliveryIdOrOrderId: string): Promise<string | null> => {
  try {
    const delivery = await Delivery.findFirst({
      where: {
        OR: [
          { id: deliveryIdOrOrderId },
          { orderId: deliveryIdOrOrderId },
        ],
      },
      select: { id: true },
    });
    return delivery?.id ?? null;
  } catch (error) {
    console.error('Error resolving delivery ID:', error);
    return null;
  }
};

/**
 * Check if delivery staff exists
 */
export const checkDeliveryStaffExists = async (staffId: string): Promise<boolean> => {
  try {
    const staff = await DeliveryStaff.findUnique({
      where: { id: staffId },
      select: { id: true },
    });
    return !!staff;
  } catch (error) {
    console.error('Error checking delivery staff existence:', error);
    return false;
  }
};

/**
 * Check if delivery exists
 */
export const checkDeliveryExists = async (deliveryId: string): Promise<boolean> => {
  try {
    const delivery = await Delivery.findUnique({
      where: { id: deliveryId },
      select: { id: true },
    });
    return !!delivery;
  } catch (error) {
    console.error('Error checking delivery existence:', error);
    return false;
  }
};

/**
 * Check if delivery zone exists
 */
export const checkDeliveryZoneExists = async (zoneId: string): Promise<boolean> => {
  try {
    const zone = await DeliveryZone.findUnique({
      where: { id: zoneId },
      select: { id: true },
    });
    return !!zone;
  } catch (error) {
    console.error('Error checking delivery zone existence:', error);
    return false;
  }
};
