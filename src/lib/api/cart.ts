import { apiClient } from './client';
import { 
  CartResponse, 
  AddToCartRequest, 
  UpdateCartQuantityRequest, 
  SyncCartRequest 
} from './types';

export async function getCartApi(): Promise<CartResponse> {
  const { data } = await apiClient.get<CartResponse>('/api/cart');
  return data;
}

export async function addToCartApi(payload: AddToCartRequest): Promise<CartResponse> {
  const { data } = await apiClient.post<CartResponse>('/api/cart/add', payload);
  return data;
}

export async function updateCartItemApi(payload: UpdateCartQuantityRequest): Promise<CartResponse> {
  const { data } = await apiClient.put<CartResponse>('/api/cart/update', payload);
  return data;
}

export async function removeCartItemApi(variantSku: string): Promise<CartResponse> {
  const { data } = await apiClient.delete<CartResponse>(`/api/cart/remove/${encodeURIComponent(variantSku)}`);
  return data;
}

export async function syncCartApi(payload: SyncCartRequest): Promise<CartResponse> {
  const { data } = await apiClient.post<CartResponse>('/api/cart/sync', payload);
  return data;
}
