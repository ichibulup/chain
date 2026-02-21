import { Router } from 'express';
import multer from 'multer';
import { uploadFile, uploadMultipleFiles, overwriteFile } from '@/controllers/upload';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post('/', upload.single('file'), uploadFile);
router.post('/multiple', upload.array('files', 10), uploadMultipleFiles);

router.put('/overwrite', upload.single('file'), overwriteFile);

export default router;
