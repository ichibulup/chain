import { Router } from 'express';
import {
  getDefaultAddress,
  createUser,
  deleteUser,
  getUser,
  getUserById,
  getMe,
  updateUser,
  updateUserActivity,
  updateUserStatus,
  syncUser,
  syncUserDbToAuth,
  syncUserAuthToDb,
  resetUser,

  createAddress,
  getAddressById,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/controllers/user";
import { requireAuth } from "@/middlewares/auth";
import { UserRole } from "lib/interfaces";

const router = Router();


// =========================
// ADDRESS ROUTES
// =========================

/**
 * @route   GET /api/customer/addresses
 * @desc    Get all addresses with filtering and pagination
 * @access  Private
 */
router.get('/address', getAddresses);

/**
 * @route   GET /api/customer/addresses/:id
 * @desc    Get address by ID
 * @access  Private
 */
router.get('/address/:id', getAddressById);

/**
 * @route   POST /api/customer/addresses
 * @desc    Create new address
 * @access  Private
 */
router.post('/address', createAddress);

/**
 * @route   PUT /api/customer/addresses/:id
 * @desc    Update address by ID
 * @access  Private
 */
router.put('/address/:id', updateAddress);

/**
 * @route   DELETE /api/customer/addresses/:id
 * @desc    Delete address by ID
 * @access  Private
 */
router.delete('/address/:id', deleteAddress);

/**
 * @route   PUT /api/customer/addresses/:id/set-default
 * @desc    Set address as default for user
 * @access  Private
 */
router.put('/address/set-default/:id', setDefaultAddress);

/**
 * @route   GET /api/customer/users/:userId/default-address
 * @desc    Get user's default address
 * @access  Private
 */
router.get('/address/get-default/:userId', getDefaultAddress);

// =========================
// USER ROUTES
// =========================

/**
 * @route   GET /user/me
 * @desc    Get current user by DB ID
 * @access  Private
 */
router.get("/me", requireAuth(), getMe);

/**
 * @route   POST /user/sync
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post("/sync", syncUser);

/**
 * @route   POST /user/sync/db-to-auth
 * @desc    Sync user from Database to Supabase Auth
 * @access  Private (Admin)
 */
router.post("/sync/db-to-auth", syncUserDbToAuth);

/**
 * @route   POST /user/sync/auth-to-db
 * @desc    Sync user from Supabase Auth to Database
 * @access  Private (Admin)
 */
router.post("/sync/auth-to-db", syncUserAuthToDb);

/**
 * @route   POST /user/:id/reset
 * @desc    Reset user/app metadata in Supabase Auth
 * @access  Private (Admin)
 */
router.post("/reset/:id", resetUser);

/**
 * @route   GET /user
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin/Manager)
 */
router.get("/", getUser);

/**
 * @route   GET /user/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get("/:id", getUserById);

/**
 * @route   POST /user
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post("/", requireAuth({ role: [UserRole.admin, UserRole.master] }), createUser);

/**
 * @route   PUT /user/:id
 * @desc    Update user by ID
 * @access  Private
 */
router.put("/:id", requireAuth(), updateUser);

/**
 * @route   PUT /user/update/:id
 * @desc    Update user by ID (alias)
 * @access  Private
 */
router.put("/update/:id", requireAuth(), updateUser);

/**
 * @route   PATCH /user/:id/status
 * @desc    Update user status
 * @access  Private (Admin/Manager)
 */
router.patch("/:id/status", requireAuth({ role: [UserRole.admin, UserRole.manager, UserRole.master] }), updateUserStatus);

/**
 * @route   PATCH /user/:id/activity
 * @desc    Update user activity status
 * @access  Private
 */
router.patch("/:id/activity", requireAuth(), updateUserActivity);

/**
 * @route   DELETE /user/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin)
 */
router.delete("/:id", requireAuth({ role: [UserRole.admin, UserRole.master] }), deleteUser);

export default router;
