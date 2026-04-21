import { apiClient } from './client';
import { PublicProductsResponse } from './types';

export async function getExploreProductsApi(params?: {
  page?: number;
  pageSize?: number;
  collection?: string;
  search?: string;
}) {
  const { data } = await apiClient.get<PublicProductsResponse>('/api/products/explore', {
    params,
  });

  return data;
}
