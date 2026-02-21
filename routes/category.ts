import { Router } from 'express';
import {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getCategories,
  getCategoryTree,
  updateCategory,
  updateStatusCategory,
  deleteCategory,
  hardDeleteCategory,
  reorderCategories,
  moveCategory,
  getCategoryBreadcrumbs,
  getAllCategories
} from '@/controllers/category';
import { requireAuth } from '@/middlewares/auth';

const router = Router();

// Category CRUD operations
router.get('/page', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);
router.put('/:id', updateCategory);
router.patch('/:id', updateStatusCategory);
router.delete('/:id', deleteCategory);
router.delete('/hard/:id', hardDeleteCategory);

// Category management operations
router.put('/reorder', reorderCategories);
router.put('/:id/move', moveCategory);
router.get('/:id/breadcrumbs', getCategoryBreadcrumbs);

router.get('/', requireAuth(), getCategories);

router.post('/', createCategory);

export default router;
