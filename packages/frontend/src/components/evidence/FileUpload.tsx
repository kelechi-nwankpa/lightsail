import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { useUpload, useUploadConfig } from '../../hooks/use-upload';

interface FileUploadProps {
  onUploadComplete: (file: {
    fileKey: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  fileKey?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  onUploadComplete,
  onError,
  maxFiles = 1,
  disabled = false,
}: FileUploadProps) {
  const { config, isLoading: isLoadingConfig } = useUploadConfig();
  const { uploadFile, isUploading } = useUpload();
  const [files, setFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!config?.enabled) {
        onError?.('File uploads are not configured.');
        return;
      }

      // Add files to state
      const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: 'pending' as const,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Upload each file
      for (const uploadingFile of newFiles) {
        try {
          // Update status to uploading
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id ? { ...f, status: 'uploading' as const } : f
            )
          );

          const result = await uploadFile(uploadingFile.file, (progress) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress } : f))
            );
          });

          // Update status to completed
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? { ...f, status: 'completed' as const, progress: 100, fileKey: result.fileKey }
                : f
            )
          );

          onUploadComplete(result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? { ...f, status: 'error' as const, error: errorMessage }
                : f
            )
          );
          onError?.(errorMessage);
        }
      }
    },
    [config, uploadFile, onUploadComplete, onError]
  );

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    disabled: disabled || !config?.enabled || isUploading,
    accept: config?.allowedTypes.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxSize: config?.maxFileSize,
  });

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config?.enabled) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          File uploads are not configured.
          <br />
          Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            'h-10 w-10 mb-4',
            isDragActive ? 'text-primary' : 'text-muted-foreground'
          )}
        />
        {isDragActive ? (
          <p className="text-sm text-primary font-medium">Drop the file here...</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium text-foreground">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max file size: {config.maxFileSizeMB}MB
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                file.status === 'error' && 'border-red-200 bg-red-50',
                file.status === 'completed' && 'border-green-200 bg-green-50'
              )}
            >
              <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.file.size)}
                </p>
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="h-1 mt-2" />
                )}
                {file.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{file.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <span className="text-xs text-muted-foreground">{file.progress}%</span>
                )}
                {file.status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {file.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
