import axios from 'axios';
import { apiClient } from './client';

export type AdminMediaItem = {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  createdAt?: string;
};

type SignUploadResponse = {
  success: boolean;
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
};

type MediaListResponse = {
  success: boolean;
  items: AdminMediaItem[];
  nextCursor?: string;
};

export async function signAdminMediaUpload(folder = 'af1/products') {
  const { data } = await apiClient.post<SignUploadResponse>('/api/admin/media/sign-upload', { folder });
  return data;
}

export async function listAdminMedia(params?: { prefix?: string; cursor?: string; pageSize?: number }) {
  const { data } = await apiClient.get<MediaListResponse>('/api/admin/media', { params });
  return data;
}

export async function uploadImageWithSignature(
  file: File,
  signed: SignUploadResponse,
  onProgress?: (percent: number) => void
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signed.apiKey);
  formData.append('timestamp', String(signed.timestamp));
  formData.append('signature', signed.signature);
  formData.append('folder', signed.folder);

  const { data } = await axios.post<{
    secure_url: string;
    public_id: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
    created_at?: string;
  }>(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, formData, {
    timeout: 0,
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    },
  });

  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
    format: data.format,
    createdAt: data.created_at,
  };
}
