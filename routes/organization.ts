import { Router } from 'express';
import {
  // Organization controllers
  createOrganization,
  getOrganizationById,
  getOrganizations,
  updateOrganization,
  deleteOrganization,
  transferOwnership,
  getOrganizationStatistics,
  
  // Organization membership controllers
  createOrganizationMembership,
  getOrganizationMembershipById,
  getOrganizationMemberships,
  updateOrganizationMembership,
  deleteOrganizationMembership,
  bulkAddMembers,
  bulkUpdateMemberRoles,
} from '@/controllers/organization';
import { requireAuth } from "@/middlewares/auth";

const router = Router();

// router.use(requireAuth());

// =========================
// ORGANIZATION MEMBERSHIP ROUTES
// =========================

// Create organization membership
router.post('/memberships', requireAuth(), createOrganizationMembership);

// Get all memberships with filtering
router.get('/memberships', requireAuth(), getOrganizationMemberships);

// Get membership by ID
router.get('/memberships/:id', requireAuth(), getOrganizationMembershipById);

// Update organization membership
router.put('/memberships/:id', requireAuth(), updateOrganizationMembership);

// Delete organization membership
router.delete('/memberships/:id', requireAuth(), deleteOrganizationMembership);

// Bulk add members to organization
router.post('/memberships/bulk-add', bulkAddMembers);

// Bulk update member roles
router.patch('/memberships/bulk-update-roles', bulkUpdateMemberRoles);

// =========================
// ORGANIZATION ROUTES
// =========================

// Create a new organization
router.post('/', requireAuth(), createOrganization);

// Get organization by ID
router.get('/:id', getOrganizationById);

// Get all organizations with filtering and pagination
router.get('/', getOrganizations);

// Update organization
router.put('/:id', requireAuth(), updateOrganization);

// Delete organization
router.delete('/:id', requireAuth(), deleteOrganization);

// Transfer organization ownership
router.post('/transfer-ownership', transferOwnership);

// Get organization statistics
router.get('/:id/statistics', getOrganizationStatistics);

export default router;
