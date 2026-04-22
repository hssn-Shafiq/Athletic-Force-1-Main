import { apiClient } from './client';
import { WishlistResponse, ToggleWishlistItemRequest, SyncWishlistRequest } from './types';

export const getWishlistApi = async (): Promise<WishlistResponse> => {
  const { data } = await apiClient.get('/api/wishlist');
  return data;
};

export const toggleWishlistItemApi = async (item: ToggleWishlistItemRequest): Promise<WishlistResponse> => {
  const { data } = await apiClient.post('/api/wishlist/toggle', item);
  return data;
};

export const syncWishlistApi = async (req: SyncWishlistRequest): Promise<WishlistResponse> => {
  const { data } = await apiClient.post('/api/wishlist/sync', req);
  return data;
};
