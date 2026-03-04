import type { Request, Response } from 'express';
import { validate } from '@/schemas/helper';
import {
  createAddress as createAddressService,
  getAddressById as getAddressByIdService,
  getAddresses as getAddressesService,
  updateAddress as updateAddressService,
  deleteAddress as deleteAddressService,
  setDefaultAddress as setDefaultAddressService,
  getDefaultAddress as getDefaultAddressService,

  createUser as createUserService,
  deleteUser as deleteUserService,
  getUser as getUserService,
  getUserById as getUserByIdService,
  getUserByIdentifier as getUserByIdentifierService,
  updateUser as updateUserService,
  updateUserActivity as updateUserActivityService,
  updateUserStatus as updateUserStatusService,
  syncUser as syncUserService,
  resetUser as resetUserService,
  syncUserDbToAuth as syncUserDbToAuthService,
  syncUserAuthToDb as syncUserAuthToDbService,
} from '@/services/user';
import {
  CreateAddressSchema,
  UpdateAddressSchema,
  AddressQuerySchema,
  CreateUserSchema,
  UpdateUserSchema,
  GetUserQuerySchema,
  UpdateUserStatusSchema,
  UpdateUserActivitySchema,
  syncFromSupabaseSchema,
} from '@/schemas/user';
import { requireUserIdFromRequest } from '@/lib/utils/auth';
import { getActorOrThrow, isAdminRole } from '@/lib/utils/permissions';

// =========================
// ADDRESS CONTROLLERS
// =========================

/**
 * @route POST /api/customer/addresses
 * @desc Create a new address
 * @access Private
 */
export const createAddress = async (req: Request, res: Response) => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = CreateAddressSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const address = await createAddressService(validation.data);

    return res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address,
    });
  } catch (error: any) {
    console.error('Error in createAddress controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @route GET /api/customer/addresses/:id
 * @desc Get address by ID
 * @access Private
 */
export const getAddressById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID',
      });
    }

    const address = await getAddressByIdService(id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    console.error('Error in getAddressById controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @route GET /api/customer/addresses
 * @desc Get all addresses with filtering and pagination
 * @access Private
 */
export const getAddresses = async (req: Request, res: Response) => {
  try {
    const validation = AddressQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.issues,
      });
    }

    const result = await getAddressesService(validation.data);

    return res.status(200).json({
      success: true,
      message: 'Addresses retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error in getAddresses controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @route PUT /api/customer/addresses/:id
 * @desc Update address by ID
 * @access Private
 */
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID',
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = UpdateAddressSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const address = await updateAddressService(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error: any) {
    console.error('Error in updateAddress controller:', error);

    if (error.message === 'Address not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @route DELETE /api/customer/addresses/:id
 * @desc Delete address by ID
 * @access Private
 */
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID',
      });
    }

    await deleteAddressService(id);

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in deleteAddress controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @route PUT /api/customer/addresses/:id/set-default
 * @desc Set address as default
 * @access Private
 */
export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID',
      });
    }

    const address = await setDefaultAddressService(id);

    return res.status(200).json({
      success: true,
      message: 'Default address set successfully',
      data: address,
    });
  } catch (error: any) {
    console.error('Error in setDefaultAddress controller:', error);

    if (error.message === 'Address not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @route GET /api/customer/users/:userId/default-address
 * @desc Get user's default address
 * @access Private
 */
export const getDefaultAddress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate UUID
    if (!userId || !validate(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const address = await getDefaultAddressService(userId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Default address not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    console.error('Error in getDefaultAddress controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// =========================
// USER CONTROLLERS
// =========================

/**
 * @route GET /api/v1/user
 * @desc Get all users with filtering and pagination
 * @access Private (Admin/Manager)
 */
export async function getUser(req: Request, res: Response) {
  try {
    // Validate query parameters
    const validation = GetUserQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.issues,
      });
    }

    const result = await getUserService(validation.data);

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error in getUser controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route GET /api/v1/user/:id
 * @desc Get user by ID
 * @access Private
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await getUserByIdService(id);

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error in getUserById controller:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route GET /user/me
 * @desc Get current user by DB ID
 * @access Private
 */
export async function getMe(req: Request, res: Response) {
  try {
    const auth = (req as any).auth;
    const dbUser = (req as any).dbUser;
    const userId = dbUser?.id ?? auth?.userId;

    if (!userId || !validate(userId)) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const user = await getUserByIdentifierService({ id: userId });

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error in getMe controller:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route POST /api/v1/user
 * @desc Create new user
 * @access Private (Admin)
 */
export async function createUser(req: Request, res: Response) {
  try {
    const dbUser = (req as any).dbUser;

    if (!dbUser?.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!isAdminRole(dbUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = CreateUserSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const user = await createUserService(validation.data, { creatorId: dbUser.id });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error in createUser controller:', error);

    if (error.message === 'User not authenticated') {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('already exists') || error.message.includes('already taken')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === 'Role not allowed for admin creation' ||
      error.message === 'Organization not found for creator' ||
      error.message === 'Creator is required' ||
      error.message === 'Restaurant not found for organization' ||
      error.message === 'Restaurant not found for creator'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route PUT /api/v1/user/:id
 * @desc Update user by ID
 * @access Private
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    // Add id to validation data
    const validation = UpdateUserSchema.safeParse({ ...req.body, id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const userId = requireUserIdFromRequest(req);
    const actor = await getActorOrThrow(userId);

    if (validation.data.role && !isAdminRole(actor.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    const user = await updateUserService(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error in updateUser controller:', error);

    if (error.message === 'User not authenticated') {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('already taken')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/v1/user/:id/status
 * @desc Update user status
 * @access Private (Admin/Manager)
 */
export async function updateUserStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = UpdateUserStatusSchema.safeParse({ ...req.body, id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const user = await updateUserStatusService(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error in updateUserStatus controller:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/v1/user/:id/activity
 * @desc Update user activity status
 * @access Private
 */
export async function updateUserActivity(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const validation = UpdateUserActivitySchema.safeParse({ ...req.body, id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const user = await updateUserActivityService(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'User activity updated successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error in updateUserActivity controller:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route DELETE /api/v1/user/:id
 * @desc Delete user (soft delete)
 * @access Private (Admin)
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const result = await deleteUserService(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in deleteUser controller:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route POST /user/sync
 * @desc Sync user from Supabase Auth to Database
 * @access Public (called by Next.js API route)
 */
export async function syncUser(req: Request, res: Response) {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const { session } = req.body;

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Session is required',
      });
    }

    if (!session.user) {
      return res.status(400).json({
        success: false,
        message: 'Session user is required',
      });
    }

    const sessionUserValidation = syncFromSupabaseSchema.safeParse(session.user);

    if (!sessionUserValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session user',
        errors: sessionUserValidation.error.issues,
      });
    }

    // Sync user to database
    const result = await syncUserService({
      session: {
        ...session,
        user: sessionUserValidation.data,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'User synced successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error in syncUser controller:', error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route POST /user/sync/db-to-auth
 * @desc Sync user from Database to Supabase Auth
 * @access Public (called by Next.js API route)
 */
export async function syncUserDbToAuth(req: Request, res: Response) {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const { session } = req.body;

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Session is required',
      });
    }

    if (!session.user) {
      return res.status(400).json({
        success: false,
        message: 'Session user is required',
      });
    }

    const sessionUserValidation = syncFromSupabaseSchema.safeParse(session.user);

    if (!sessionUserValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session user',
        errors: sessionUserValidation.error.issues,
      });
    }

    const result = await syncUserDbToAuthService({
      session: {
        ...session,
        user: sessionUserValidation.data,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'User synced DB → Auth successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error in syncUserDbToAuth controller:', error);

    if (error.statusCode === 400 || error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.statusCode === 404 || error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route POST /user/sync/auth-to-db
 * @desc Sync user from Supabase Auth to Database
 * @access Public (called by Next.js API route)
 */
export async function syncUserAuthToDb(req: Request, res: Response) {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }

    const { session } = req.body;

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Session is required',
      });
    }

    if (!session.user) {
      return res.status(400).json({
        success: false,
        message: 'Session user is required',
      });
    }

    const userValidation = syncFromSupabaseSchema.safeParse(session.user);

    if (!userValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session user',
        errors: userValidation.error.issues,
      });
    }

    const result = await syncUserAuthToDbService({
      session: {
        ...session,
        user: userValidation.data,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'User synced Auth → DB successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error in syncUserAuthToDb controller:', error);

    if (error.statusCode === 400 || error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * @route POST /user/:id/reset
 * @desc Reset user/app metadata in Supabase Auth
 * @access Private (Admin)
 */
export async function resetUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || !validate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const result = await resetUserService(id);

    return res.status(200).json({
      success: true,
      message: 'User metadata reset successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error in resetUser controller:', error);

    if (error.statusCode === 404 || error.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}
