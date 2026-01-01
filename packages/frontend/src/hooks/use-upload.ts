import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';

export interface UploadConfig {
  enabled: boolean;
  allowedTypes: string[];
  maxFileSize: number;
  maxFileSizeMB: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresAt: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  fileKey?: string;
}

export function useUploadConfig() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    async function fetchConfig() {
      if (!isLoaded || !isSignedIn) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.get<UploadConfig>('/upload/config');
        setConfig(data);
      } catch (err) {
        console.error('Failed to fetch upload config:', err);
        setConfig({
          enabled: false,
          allowedTypes: [],
          maxFileSize: 0,
          maxFileSizeMB: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, [isLoaded, isSignedIn]);

  return { config, isLoading };
}

export function useUpload() {
  const { getToken } = useAuth();
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  useEffect(() => {
    api.setTokenGetter(() => getToken());
  }, [getToken]);

  const getPresignedUrl = useCallback(
    async (file: File): Promise<PresignedUrlResponse> => {
      const response = await api.post<PresignedUrlResponse>('/upload/presigned-url', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      return response;
    },
    []
  );

  const uploadFile = useCallback(
    async (
      file: File,
      onProgress?: (progress: number) => void
    ): Promise<{ fileKey: string; fileName: string; fileSize: number; fileType: string }> => {
      const fileId = `${file.name}-${Date.now()}`;

      // Update progress state
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(fileId, {
          fileName: file.name,
          progress: 0,
          status: 'pending',
        });
        return next;
      });

      try {
        // Get presigned URL
        const { uploadUrl, fileKey } = await getPresignedUrl(file);

        setUploads((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            fileName: file.name,
            progress: 0,
            status: 'uploading',
          });
          return next;
        });

        // Upload file to S3 using XHR for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress?.(progress);
              setUploads((prev) => {
                const next = new Map(prev);
                next.set(fileId, {
                  fileName: file.name,
                  progress,
                  status: 'uploading',
                });
                return next;
              });
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
          });

          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        // Mark as completed
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            fileName: file.name,
            progress: 100,
            status: 'completed',
            fileKey,
          });
          return next;
        });

        return {
          fileKey,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: errorMessage,
          });
          return next;
        });
        throw error;
      }
    },
    [getPresignedUrl]
  );

  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  const removeUpload = useCallback((fileId: string) => {
    setUploads((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  return {
    uploadFile,
    uploads: Array.from(uploads.entries()).map(([id, progress]) => ({ id, ...progress })),
    clearUploads,
    removeUpload,
    isUploading: Array.from(uploads.values()).some((u) => u.status === 'uploading'),
  };
}
