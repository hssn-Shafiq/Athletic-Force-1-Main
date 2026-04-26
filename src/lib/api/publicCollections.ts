import { apiClient } from './client';
import { ExploreCollectionsResponse } from './types';

export async function getExploreCollectionsApi() {
  const { data } = await apiClient.get<ExploreCollectionsResponse>('/api/collections/explore');
  return data;
}

export async function getCollectionHierarchyApi() {
  const { data } = await apiClient.get<ExploreCollectionsResponse>('/api/collections/customization-hierarchy');
  return data;
}
