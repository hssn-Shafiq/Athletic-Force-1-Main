import { apiClient } from './client';
import { ExploreCollectionsResponse, CollectionTreeResponse, CollectionDetailResponse } from './types';

export async function getExploreCollectionsApi() {
  const { data } = await apiClient.get<ExploreCollectionsResponse>('/api/collections/explore');
  return data;
}

export async function getCollectionHierarchyApi() {
  const { data } = await apiClient.get<ExploreCollectionsResponse>('/api/collections/customization-hierarchy');
  return data;
}

/** Returns ALL active collections (flat list) with hasChildren & productCount */
export async function getCollectionTreeApi(): Promise<CollectionTreeResponse> {
  const { data } = await apiClient.get<CollectionTreeResponse>('/api/collections/tree');
  return data;
}

/** Returns a single collection by slug with its direct children */
export async function getCollectionDetailsApi(slug: string): Promise<CollectionDetailResponse> {
  const { data } = await apiClient.get<CollectionDetailResponse>(`/api/collections/details/${slug}`);
  return data;
}

