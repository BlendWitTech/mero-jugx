import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Loading } from '@shared';
import { Upload, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import api from '@frontend/services/api';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '@frontend/contexts/ThemeContext';
import toast from '@shared/frontend/hooks/useToast';

interface TaskAttachmentUploadProps {
  taskId: string;
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaskAttachmentUpload({
  taskId,
  projectId,
  onSuccess,
  onCancel,
}: TaskAttachmentUploadProps) {
  const { appSlug } = useAppContext();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // First upload file to get URL
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Upload to documents endpoint (or create a generic upload endpoint)
      const response = await api.post('/organizations/me/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          document_type: 'other',
          title: file.name,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload file');
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  // Then add attachment to task
  const addAttachmentMutation = useMutation({
    mutationFn: async ({ fileUrl, fileName, fileType, fileSize }: {
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }) => {
      const response = await api.post(
        `/apps/${appSlug}/projects/${projectId}/tasks/${taskId}/attachments`,
        {
          file_name: fileName,
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Attachment added successfully');
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add attachment');
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // First upload the file
      const document = await uploadFileMutation.mutateAsync(selectedFile);

      // Get the file URL (construct from document ID)
      const fileUrl = `/organizations/me/documents/${document.id}/view`;
      const fullUrl = `${window.location.origin}${fileUrl}`;

      // Then add as attachment
      await addAttachmentMutation.mutateAsync({
        fileUrl: fullUrl,
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'application/octet-stream',
        fileSize: selectedFile.size,
      });
    } catch (error) {
      // Error already handled in mutations
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div
      className="p-4 rounded-lg space-y-4"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: theme.colors.text }}>
          Upload Attachment
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 rounded hover:opacity-70"
            style={{ color: theme.colors.textSecondary }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!selectedFile ? (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = theme.colors.primary;
            e.currentTarget.style.backgroundColor = theme.colors.primary + '1A';
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.backgroundColor = theme.colors.background;
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.backgroundColor = theme.colors.background;
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              if (file.size > 50 * 1024 * 1024) {
                toast.error('File size must be less than 50MB');
                return;
              }
              setSelectedFile(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 mb-4" style={{ color: theme.colors.textSecondary }} />
          <p className="text-sm mb-2" style={{ color: theme.colors.text }}>
            Click to upload or drag and drop
          </p>
          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
            Max file size: 50MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="*/*"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Preview */}
          <div
            className="flex items-center gap-4 p-4 rounded-lg"
            style={{
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            {isImage ? (
              <ImageIcon className="h-10 w-10 flex-shrink-0" style={{ color: theme.colors.primary }} />
            ) : (
              <FileIcon className="h-10 w-10 flex-shrink-0" style={{ color: theme.colors.primary }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: theme.colors.text }}>
                {selectedFile.name}
              </p>
              <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Unknown type'}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 rounded hover:opacity-70"
              style={{ color: theme.colors.textSecondary }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: theme.colors.textSecondary }}>Uploading...</span>
                <span style={{ color: theme.colors.textSecondary }}>{uploadProgress}%</span>
              </div>
              <div
                className="w-full rounded-full h-2"
                style={{ backgroundColor: theme.colors.border }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: theme.colors.primary,
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              isLoading={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

