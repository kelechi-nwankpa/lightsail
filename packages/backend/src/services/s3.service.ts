import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, s3Config, isS3Configured } from '../config/s3.js';
import { v4 as uuidv4 } from 'uuid';

// Allowed file types for evidence uploads
const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Images
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Config/Text
  'application/json',
  'text/plain',
  'text/csv',
  'text/yaml',
  'application/yaml',
  'application/xml',
  'text/xml',
  // Archives (for log exports)
  'application/zip',
  'application/gzip',
]);

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Presigned URL expiration times
const UPLOAD_URL_EXPIRY = 15 * 60; // 15 minutes
const DOWNLOAD_URL_EXPIRY = 60 * 60; // 1 hour

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  organizationId: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresAt: Date;
}


/**
 * Sanitize filename for S3 key
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);
}

/**
 * Generate a unique S3 key for a file
 */
function generateFileKey(organizationId: string, fileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = uuidv4();
  const sanitizedName = sanitizeFileName(fileName);

  return `evidence/${organizationId}/${year}/${month}/${uuid}_${sanitizedName}`;
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Get allowed file types for frontend validation
 */
export function getAllowedFileTypes(): string[] {
  return Array.from(ALLOWED_MIME_TYPES);
}

/**
 * Get max file size in bytes
 */
export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function getUploadPresignedUrl(
  request: PresignedUrlRequest
): Promise<PresignedUrlResponse> {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured. File uploads are disabled.');
  }

  // Validate file type
  if (!validateFileType(request.fileType)) {
    throw new Error(`File type '${request.fileType}' is not allowed.`);
  }

  // Validate file size
  if (!validateFileSize(request.fileSize)) {
    throw new Error(`File size must be between 1 byte and ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }

  const s3Client = getS3Client();
  const fileKey = generateFileKey(request.organizationId, request.fileName);

  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: fileKey,
    ContentType: request.fileType,
    ContentLength: request.fileSize,
    Metadata: {
      'organization-id': request.organizationId,
      'original-filename': encodeURIComponent(request.fileName),
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_URL_EXPIRY,
  });

  const expiresAt = new Date(Date.now() + UPLOAD_URL_EXPIRY * 1000);

  return {
    uploadUrl,
    fileKey,
    expiresAt,
  };
}

/**
 * Generate a presigned URL for downloading a file from S3
 */
export async function getDownloadPresignedUrl(fileKey: string): Promise<string> {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured. File downloads are disabled.');
  }

  const s3Client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: fileKey,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRY,
  });

  return downloadUrl;
}

/**
 * Delete a file from S3
 */
export async function deleteFile(fileKey: string): Promise<void> {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured.');
  }

  const s3Client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: s3Config.bucket,
    Key: fileKey,
  });

  await s3Client.send(command);
}
