import { Request, Response } from 'express';
import { createUpload } from '@/lib/supabase/upload';

/**
 * Helper to upload file to Supabase
 */
async function uploadToSupabase(
  file: Express.Multer.File, 
  filePath: string, 
  bucket: string = 'uploads',
  upsert: boolean = false
) {
  const supabase = createUpload();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: upsert,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    path: data.path,
    fullPath: `${bucket}/${data.path}`,
    publicUrl: publicUrlData.publicUrl,
    fileName: file.originalname,
    originalName: file.originalname,
    size: file.size,
    type: file.mimetype,
    uploadedAt: new Date().toISOString()
  };
}

export async function uploadFile(req: Request, res: Response) {
  try {
    // Debug logging
    console.log('Upload request body:', req.body);
    console.log('Upload request file:', req.file);

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.body.folder || '';
    const bucket = req.body.bucket || 'uploads';

    // Generate unique path
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const result = await uploadToSupabase(file, filePath, bucket, false);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
}

export async function uploadMultipleFiles(req: Request, res: Response) {
  try {
    // Debug logging
    console.log('Upload multiple request body:', req.body);
    console.log('Upload multiple request files:', req.files);

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const folder = req.body.folder || '';
    const bucket = req.body.bucket || 'uploads';

    const uploadPromises = files.map(async (file) => {
      // Generate unique path
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}-${sanitizedName}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      return uploadToSupabase(file, filePath, bucket, false);
    });

    const results = await Promise.all(uploadPromises);
    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Upload multiple error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
}

export async function overwriteFile(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const bucket = req.body.bucket || 'uploads';
    
    // Use provided path or original name (sanitized)
    // If path is provided in body, use it. Otherwise use original name.
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = req.body.path || sanitizedName;

    const result = await uploadToSupabase(file, filePath, bucket, true);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Overwrite error:', error);
    res.status(500).json({ error: error.message || 'Overwrite failed' });
  }
}
