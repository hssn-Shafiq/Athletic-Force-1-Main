import { apiClient } from './client';

export interface PublicVendorStore {
  id: string;
  storeName: string;
  logoUrl?: string;
  slug: string;
}

export async function getPublicVendorStoresApi() {
  const { data } = await apiClient.get<{ ok: boolean; stores: PublicVendorStore[] }>('/api/public/vendor-stores');
  return data;
}
