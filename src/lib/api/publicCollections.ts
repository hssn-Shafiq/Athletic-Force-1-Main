import { apiClient } from './client';
import { ExploreCollectionsResponse } from './types';

export async function getExploreCollectionsApi() {
  const { data } = await apiClient.get<ExploreCollectionsResponse>('/api/collections/explore');
  return data;
}
