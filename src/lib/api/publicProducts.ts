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
  const { data } = await apiClient.get<PublicProductsResponse>('/api/products/explore', {
    params,
  });

  return data;
}

export async function getExploreProductBySlugApi(slug: string) {
  const { data } = await apiClient.get<PublicProductResponse>(`/api/products/explore/${encodeURIComponent(slug)}`);
  return data;
}
