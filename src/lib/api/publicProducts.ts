import { apiClient } from './client';
import { PublicProductResponse, PublicProductsResponse } from './types';

export async function getExploreProductsApi(params?: {
  page?: number;
  pageSize?: number;
  collection?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}) {
  try {
    const { data } = await apiClient.get<PublicProductsResponse>('/api/products/explore', {
      params,
    });
    return data;
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || 'Failed to fetch products';
    console.error('[getExploreProductsApi]', message);
    return { ok: false, items: [], total: 0, page: 1, pageSize: params?.pageSize ?? 40 } as unknown as PublicProductsResponse;
  }
}

export async function getExploreProductBySlugApi(slug: string) {
  try {
    const { data } = await apiClient.get<PublicProductResponse>(`/api/products/explore/${encodeURIComponent(slug)}`);
    return data;
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || 'Failed to fetch product';
    console.error('[getExploreProductBySlugApi]', message);
    return null;
  }
}

export async function submitProductReviewApi(productId: string, formData: FormData, onUploadProgress?: (progressEvent: any) => void) {
  const { data } = await apiClient.post(`/api/products/${productId}/reviews`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return data;
}

export async function signReviewAvatarUploadApi(params: { productSlug: string; collectionSlug?: string }) {
  const { data } = await apiClient.post<{
    success: boolean;
    cloudName: string;
    apiKey: string;
    folder: string;
    timestamp: number;
    signature: string;
  }>('/api/products/reviews/sign-avatar', params);
  return data;
}
