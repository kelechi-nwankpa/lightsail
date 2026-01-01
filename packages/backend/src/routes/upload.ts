import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { requireAuth, requireOrganization, validate } from '../middleware/index.js';
import {
  getUploadPresignedUrl,
  getAllowedFileTypes,
  getMaxFileSize,
} from '../services/s3.service.js';
import { isS3Configured } from '../config/s3.js';

const router: IRouter = Router();

// All routes require auth and organization
router.use(requireAuth, requireOrganization());

// Schema for requesting presigned URL
const presignedUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
});

// GET /upload/config - Get upload configuration (allowed types, max size)
router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      enabled: isS3Configured(),
      allowedTypes: getAllowedFileTypes(),
      maxFileSize: getMaxFileSize(),
      maxFileSizeMB: getMaxFileSize() / (1024 * 1024),
    },
  });
});

// POST /upload/presigned-url - Get presigned URL for upload
router.post(
  '/presigned-url',
  validate({ body: presignedUrlSchema }),
  async (req, res) => {
    const organizationId = req.organizationId!;
    const { fileName, fileType, fileSize } = req.body as z.infer<typeof presignedUrlSchema>;

    if (!isS3Configured()) {
      res.status(503).json({
        success: false,
        error: 'File uploads are not configured. Please contact your administrator.',
      });
      return;
    }

    const result = await getUploadPresignedUrl({
      fileName,
      fileType,
      fileSize,
      organizationId,
    });

    res.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        fileKey: result.fileKey,
        expiresAt: result.expiresAt.toISOString(),
      },
    });
  }
);

export const uploadRouter: IRouter = router;
