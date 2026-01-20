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

router.use(requireAuth());

// =========================
// ORGANIZATION MEMBERSHIP ROUTES
// =========================

// Create organization membership
router.post('/memberships', createOrganizationMembership);

// Get all memberships with filtering
router.get('/memberships', getOrganizationMemberships);

// Get membership by ID
router.get('/memberships/:id', getOrganizationMembershipById);

// Update organization membership
router.put('/memberships/:id', updateOrganizationMembership);

// Delete organization membership
router.delete('/memberships/:id', deleteOrganizationMembership);

// Bulk add members to organization
router.post('/memberships/bulk-add', bulkAddMembers);

// Bulk update member roles
router.patch('/memberships/bulk-update-roles', bulkUpdateMemberRoles);

// =========================
// ORGANIZATION ROUTES
// =========================

// Create a new organization
router.post('/', createOrganization);

// Get organization by ID
router.get('/:id', getOrganizationById);

// Get all organizations with filtering and pagination
router.get('/', getOrganizations);

// Update organization
router.put('/:id', updateOrganization);

// Delete organization
router.delete('/:id', deleteOrganization);

// Transfer organization ownership
router.post('/transfer-ownership', transferOwnership);

// Get organization statistics
router.get('/:id/statistics', getOrganizationStatistics);

export default router;
