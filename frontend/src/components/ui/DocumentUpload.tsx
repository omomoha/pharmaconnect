'use client';

import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface DocumentUploadProps {
  label: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  storagePath: string; // e.g., 'pharmacy-docs/{userId}/license'
  onUploadComplete: (downloadUrl: string) => void;
  onUploadError?: (error: string) => void;
  currentFileUrl?: string;
  required?: boolean;
}

export default function DocumentUpload({
  label,
  description,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 10,
  storagePath,
  onUploadComplete,
  onUploadError,
  currentFileUrl,
  required = false,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentFileUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const errMsg = `File size must be less than ${maxSizeMB}MB`;
      setError(errMsg);
      onUploadError?.(errMsg);
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      const errMsg = 'Only PDF, JPG, and PNG files are allowed';
      setError(errMsg);
      onUploadError?.(errMsg);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      // Create a unique storage reference
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `${storagePath}_${timestamp}.${fileExtension}`);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(pct);
        },
        (uploadError) => {
          console.error('Upload error:', uploadError);
          const errMsg = 'Failed to upload file. Please try again.';
          setError(errMsg);
          setUploading(false);
          onUploadError?.(errMsg);
        },
        async () => {
          // Get download URL
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadedUrl(downloadUrl);
          setUploading(false);
          onUploadComplete(downloadUrl);
        }
      );
    } catch (err) {
      const errMsg = 'Failed to start upload. Please try again.';
      setError(errMsg);
      setUploading(false);
      onUploadError?.(errMsg);
    }
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    setFileName(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('');
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}

      {/* Upload area */}
      {!uploadedUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            error
              ? 'border-red-300 bg-red-50 hover:border-red-400'
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">{fileName}</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">Uploading... {progress}%</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-2xl text-gray-400">📄</div>
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                PDF, JPG, or PNG (max {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <p className="text-sm font-medium text-green-800">
                {fileName || 'Document uploaded'}
              </p>
              <p className="text-xs text-green-600">Upload complete</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
