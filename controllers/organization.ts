import { Request, Response } from 'express';
import { requireUserIdFromRequest } from '@/lib/utils/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/interfaces';
import {
  getActorOrThrow,
  isAdminRole,
  requireOrganizationAdminOrSupplierLeader,
  requireManagerForRestaurant,
  requireManagerOrAdminForRestaurant,
} from '@/lib/utils/permissions';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationQuerySchema,
  CreateOrganizationMembershipSchema,
  UpdateOrganizationMembershipSchema,
  OrganizationMembershipQuerySchema,
  CreateRestaurantChainSchema,
  UpdateRestaurantChainSchema,
  RestaurantChainQuerySchema,
  CreateRestaurantUserRoleSchema,
  UpdateRestaurantUserRoleSchema,
  RestaurantUserRoleQuerySchema,
  BulkAddMembersSchema,
  BulkUpdateMemberRolesSchema,
  BulkAddStaffSchema,
  TransferOwnershipSchema, CreateRestaurantSchema, RestaurantQuerySchema, UpdateRestaurantSchema,
  TransferRestaurantStaffSchema,
} from '@/schemas/organization';
import * as organizationService from '@/services/organization';

// =========================
// ORGANIZATION CONTROLLERS
// =========================

/**
 * Create a new organization
 * POST /api/organizations
 */
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const validation = CreateOrganizationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const actor = await getActorOrThrow(userId);

    if (!isAdminRole(actor.role) && actor.role !== UserRole.supplier) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    if (actor.role === UserRole.supplier && actor.id !== validation.data.ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Supplier can only create their own organization',
      });
    }

    const organization = await organizationService.createOrganization(validation.data, userId);

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get organization by ID
 * GET /api/organizations/:id
 */
export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    const organization = await organizationService.getOrganizationById(id);

    return res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Error getting organization:', error);
    
    if (error instanceof Error && error.message === 'Organization not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all organizations with filtering and pagination
 * GET /api/organizations
 */
export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const validation = OrganizationQuerySchema.safeParse({
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await organizationService.getOrganizations(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting organizations:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update organization
 * PUT /api/organizations/:id
 */
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    const validation = UpdateOrganizationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireOrganizationAdminOrSupplierLeader(userId, id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const organization = await organizationService.updateOrganization(id, validation.data, userId);

    return res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Organization not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete organization
 * DELETE /api/organizations/:id
 */
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireOrganizationAdminOrSupplierLeader(userId, id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.deleteOrganization(id, userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    
    if (error instanceof Error && error.message === 'Organization not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Transfer organization ownership
 * POST /api/organizations/transfer-ownership
 */
export const transferOwnership = async (req: Request, res: Response) => {
  try {
    const validation = TransferOwnershipSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireOrganizationAdminOrSupplierLeader(userId, validation.data.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const organization = await organizationService.transferOwnership(validation.data);

    return res.status(200).json({
      success: true,
      message: 'Ownership transferred successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Error transferring ownership:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get organization statistics
 * GET /api/organizations/:id/statistics
 */
export const getOrganizationStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    const statistics = await organizationService.getOrganizationStatistics(id);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error getting organization statistics:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// =========================
// ORGANIZATION MEMBERSHIP CONTROLLERS
// =========================

/**
 * Create organization membership
 * POST /api/organization-memberships
 */
export const createOrganizationMembership = async (req: Request, res: Response) => {
  try {
    const validation = CreateOrganizationMembershipSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireOrganizationAdminOrSupplierLeader(userId, validation.data.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const membership = await organizationService.createOrganizationMembership(validation.data);

    return res.status(201).json({
      success: true,
      message: 'Membership created successfully',
      data: membership,
    });
  } catch (error) {
    console.error('Error creating membership:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get membership by ID
 * GET /api/organization-memberships/:id
 */
export const getOrganizationMembershipById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Membership ID is required',
      });
    }

    const membership = await organizationService.getOrganizationMembershipById(id);

    return res.status(200).json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error('Error getting membership:', error);
    
    if (error instanceof Error && error.message === 'Membership not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get organization memberships with filtering
 * GET /api/organization-memberships
 */
export const getOrganizationMemberships = async (req: Request, res: Response) => {
  try {
    const validation = OrganizationMembershipQuerySchema.safeParse({
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await organizationService.getOrganizationMemberships(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting memberships:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update organization membership
 * PUT /api/organization-memberships/:id
 */
export const updateOrganizationMembership = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Membership ID is required',
      });
    }

    const validation = UpdateOrganizationMembershipSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const membershipRecord = await prisma.organizationMembership.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!membershipRecord) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found',
      });
    }

    try {
      await requireOrganizationAdminOrSupplierLeader(userId, membershipRecord.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const membership = await organizationService.updateOrganizationMembership(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Membership updated successfully',
      data: membership,
    });
  } catch (error) {
    console.error('Error updating membership:', error);
    
    if (error instanceof Error && error.message === 'Membership not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete organization membership
 * DELETE /api/organization-memberships/:id
 */
export const deleteOrganizationMembership = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Membership ID is required',
      });
    }

    const userId = requireUserIdFromRequest(req);
    const membershipRecord = await prisma.organizationMembership.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!membershipRecord) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found',
      });
    }

    try {
      await requireOrganizationAdminOrSupplierLeader(userId, membershipRecord.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.deleteOrganizationMembership(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting membership:', error);
    
    if (error instanceof Error && error.message === 'Membership not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Bulk add members to organization
 * POST /api/organization-memberships/bulk-add
 */
export const bulkAddMembers = async (req: Request, res: Response) => {
  try {
    const validation = BulkAddMembersSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireOrganizationAdminOrSupplierLeader(userId, validation.data.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.bulkAddMembers(validation.data);

    return res.status(201).json({
      success: true,
      message: `${result.added} members added successfully`,
      data: result,
    });
  } catch (error) {
    console.error('Error bulk adding members:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Bulk update member roles
 * PATCH /api/organization-memberships/bulk-update-roles
 */
export const bulkUpdateMemberRoles = async (req: Request, res: Response) => {
  try {
    const validation = BulkUpdateMemberRolesSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireOrganizationAdminOrSupplierLeader(userId, validation.data.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.bulkUpdateMemberRoles(validation.data);

    return res.status(200).json({
      success: true,
      message: `${result.updated} member roles updated successfully`,
      data: result,
    });
  } catch (error) {
    console.error('Error bulk updating member roles:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// =========================
// RESTAURANT CONTROLLERS
// =========================

/**
 * Create a new restaurant
 * POST /api/restaurant
 */
export const createRestaurant = async (req: Request, res: Response) => {
  try {
    const validation = CreateRestaurantSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireOrganizationAdminOrSupplierLeader(userId, validation.data.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const restaurant = await organizationService.createRestaurant(validation.data, userId);

    return res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant,
    });
  } catch (error) {
    console.error('Error creating organization:', error);

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get restaurant by ID
 * GET /api/restaurant/:id
 */
export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const restaurant = await organizationService.getRestaurantById(id);

    return res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error('Error getting restaurant:', error);

    if (error instanceof Error && error.message === 'Restaurant not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all restaurant with filtering and pagination
 * GET /api/restaurant
 */
export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const validation = RestaurantQuerySchema.safeParse({
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await organizationService.getRestaurants(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting organizations:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update restaurant
 * PUT /api/restaurant/:id
 */
export const updateRestaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    const validation = UpdateRestaurantSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const restaurantRecord = await prisma.restaurant.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!restaurantRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    try {
      await requireOrganizationAdminOrSupplierLeader(userId, restaurantRecord.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const organization = await organizationService.updateRestaurant(id, validation.data, userId);

    return res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Error updating organization:', error);

    if (error instanceof Error) {
      if (error.message === 'Restaurant not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete restaurant
 * DELETE /api/restaurant/:id
 */
export const deleteRestaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const userId = requireUserIdFromRequest(req);
    const restaurantRecord = await prisma.restaurant.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!restaurantRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    try {
      await requireOrganizationAdminOrSupplierLeader(userId, restaurantRecord.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.deleteRestaurant(id, userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting restaurant:', error);

    if (error instanceof Error && error.message === 'Restaurant not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get restaurant statistics
 * GET /api/restaurant/:id/statistics
 */
export const getRestaurantStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const statistics = await organizationService.getRestaurantStaffStatistics(id);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error getting restaurant statistics:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// =========================
// RESTAURANT CHAIN CONTROLLERS
// =========================

/**
 * Create restaurant chain
 * POST /api/restaurant-chains
 */
export const createRestaurantChain = async (req: Request, res: Response) => {
  try {
    const validation = CreateRestaurantChainSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireOrganizationAdminOrSupplierLeader(userId, validation.data.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const chain = await organizationService.createRestaurantChain(validation.data, userId);

    return res.status(201).json({
      success: true,
      message: 'Restaurant chain created successfully',
      data: chain,
    });
  } catch (error) {
    console.error('Error creating restaurant chain:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get restaurant chain by ID
 * GET /api/restaurant-chains/:id
 */
export const getRestaurantChainById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant chain ID is required',
      });
    }

    const chain = await organizationService.getRestaurantChainById(id);

    return res.status(200).json({
      success: true,
      data: chain,
    });
  } catch (error) {
    console.error('Error getting restaurant chain:', error);
    
    if (error instanceof Error && error.message === 'Restaurant chain not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get restaurant chains with filtering
 * GET /api/restaurant-chains
 */
export const getRestaurantChains = async (req: Request, res: Response) => {
  try {
    const validation = RestaurantChainQuerySchema.safeParse({
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await organizationService.getRestaurantChains(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting restaurant chains:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update restaurant chain
 * PUT /api/restaurant-chains/:id
 */
export const updateRestaurantChain = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant chain ID is required',
      });
    }

    const validation = UpdateRestaurantChainSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const chainRecord = await prisma.restaurantChain.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!chainRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant chain not found',
      });
    }

    try {
      await requireOrganizationAdminOrSupplierLeader(userId, chainRecord.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const chain = await organizationService.updateRestaurantChain(id, validation.data, userId);

    return res.status(200).json({
      success: true,
      message: 'Restaurant chain updated successfully',
      data: chain,
    });
  } catch (error) {
    console.error('Error updating restaurant chain:', error);
    
    if (error instanceof Error && error.message === 'Restaurant chain not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete restaurant chain
 * DELETE /api/restaurant-chains/:id
 */
export const deleteRestaurantChain = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant chain ID is required',
      });
    }

    const userId = requireUserIdFromRequest(req);
    const chainRecord = await prisma.restaurantChain.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!chainRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant chain not found',
      });
    }

    try {
      await requireOrganizationAdminOrSupplierLeader(userId, chainRecord.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.deleteRestaurantChain(id, userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting restaurant chain:', error);
    
    if (error instanceof Error && error.message === 'Restaurant chain not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// =========================
// RESTAURANT USER ROLE CONTROLLERS
// =========================

/**
 * Create restaurant user role
 * POST /api/restaurant-user-roles
 */
export const createRestaurantUserRole = async (req: Request, res: Response) => {
  try {
    const validation = CreateRestaurantUserRoleSchema.safeParse(req.body);

    console.log(1, req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const restaurantRecord = await prisma.restaurant.findUnique({
      where: { id: validation.data.restaurantId },
      select: { organizationId: true },
    });

    if (!restaurantRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    try {
      await requireManagerOrAdminForRestaurant(userId, validation.data.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const role = await organizationService.createRestaurantUserRole(validation.data);

    return res.status(201).json({
      success: true,
      message: 'Restaurant user role created successfully',
      data: role,
    });
  } catch (error) {
    console.error('Error creating restaurant user role:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get restaurant user role by ID
 * GET /api/restaurant-user-roles/:id
 */
export const getRestaurantUserRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant user role ID is required',
      });
    }

    const userId = requireUserIdFromRequest(req);
    const role = await organizationService.getRestaurantUserRoleById(id);

    try {
      await requireManagerOrAdminForRestaurant(userId, role.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('Error getting restaurant user role:', error);
    
    if (error instanceof Error && error.message === 'Restaurant user role not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get restaurant user roles with filtering
 * GET /api/restaurant-user-roles
 */
export const getRestaurantUserRoles = async (req: Request, res: Response) => {
  try {
    const validation = RestaurantUserRoleQuerySchema.safeParse({
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const actor = await getActorOrThrow(userId);

    if (validation.data.restaurantId) {
      try {
        await requireManagerOrAdminForRestaurant(userId, validation.data.restaurantId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Forbidden';
        const status = message === 'Restaurant not found' ? 404 : 403;
        return res.status(status).json({
          success: false,
          message,
        });
      }
    } else if (!isAdminRole(actor.role)) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const result = await organizationService.getRestaurantUserRoles(validation.data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting restaurant user roles:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update restaurant user role
 * PUT /api/restaurant-user-roles/:id
 */
export const updateRestaurantUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant user role ID is required',
      });
    }

    const validation = UpdateRestaurantUserRoleSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const roleRecord = await prisma.restaurantUserRole.findUnique({
      where: { id },
      select: { restaurantId: true },
    });

    if (!roleRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant user role not found',
      });
    }

    const restaurantRecord = await prisma.restaurant.findUnique({
      where: { id: roleRecord.restaurantId },
      select: { organizationId: true },
    });

    if (!restaurantRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    try {
      await requireManagerForRestaurant(userId, roleRecord.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const role = await organizationService.updateRestaurantUserRole(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Restaurant user role updated successfully',
      data: role,
    });
  } catch (error) {
    console.error('Error updating restaurant user role:', error);
    
    if (error instanceof Error && error.message === 'Restaurant user role not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete restaurant user role
 * DELETE /api/restaurant-user-roles/:id
 */
export const deleteRestaurantUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant user role ID is required',
      });
    }

    const userId = requireUserIdFromRequest(req);
    const roleRecord = await prisma.restaurantUserRole.findUnique({
      where: { id },
      select: { restaurantId: true },
    });

    if (!roleRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant user role not found',
      });
    }

    const restaurantRecord = await prisma.restaurant.findUnique({
      where: { id: roleRecord.restaurantId },
      select: { organizationId: true },
    });

    if (!restaurantRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    try {
      await requireOrganizationAdminOrSupplierLeader(userId, restaurantRecord.organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Organization not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.deleteRestaurantUserRole(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting restaurant user role:', error);
    
    if (error instanceof Error && error.message === 'Restaurant user role not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Bulk add staff to restaurant
 * POST /api/restaurant-user-roles/bulk-add
 */
export const bulkAddStaff = async (req: Request, res: Response) => {
  try {
    const validation = BulkAddStaffSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const restaurantRecord = await prisma.restaurant.findUnique({
      where: { id: validation.data.restaurantId },
      select: { organizationId: true },
    });

    if (!restaurantRecord) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    try {
      await requireManagerOrAdminForRestaurant(userId, validation.data.restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.bulkAddStaff(validation.data);

    return res.status(201).json({
      success: true,
      message: `${result.added} staff members added successfully`,
      data: result,
    });
  } catch (error) {
    console.error('Error bulk adding staff:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Transfer staff to another restaurant
 * POST /api/restaurant-user-roles/transfer
 */
export const transferRestaurantStaff = async (req: Request, res: Response) => {
  try {
    const validation = TransferRestaurantStaffSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireManagerOrAdminForRestaurant(userId, validation.data.fromRestaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const result = await organizationService.transferRestaurantStaff(validation.data);

    return res.status(200).json({
      success: true,
      message: 'Staff transferred successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error transferring staff:', error);

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get restaurant staff statistics
 * GET /api/restaurant-user-roles/restaurants/:restaurantId/statistics
 */
export const getRestaurantStaffStatistics = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const userId = requireUserIdFromRequest(req);
    try {
      await requireManagerOrAdminForRestaurant(userId, restaurantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Forbidden';
      const status = message === 'Restaurant not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        message,
      });
    }

    const statistics = await organizationService.getRestaurantStaffStatistics(restaurantId);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error getting restaurant staff statistics:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
