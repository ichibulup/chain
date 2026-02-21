import { Router } from 'express';
import { searchAll } from '@/controllers/search';

const router = Router();

router.get('/', searchAll);

export default router;
