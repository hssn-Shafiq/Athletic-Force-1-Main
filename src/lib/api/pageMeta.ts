
import { apiClient } from './client';

export interface PageMetaResponse {
  ok: boolean;
  meta?: {
    pageKey: string;
    title: string;
    description: string;
    ogImage?: string;
  };
  metas?: Array<{
    pageKey: string;
    title: string;
    description: string;
    ogImage?: string;
  }>;
}

export async function getPageMetaApi(pageKey: string) {
  const { data } = await apiClient.get<PageMetaResponse>(`/api/page-meta/${pageKey}`);
  return data;
}

export async function getAllPageMetasApi() {
  const { data } = await apiClient.get<PageMetaResponse>('/api/page-meta/admin/all');
  return data;
}

export async function updatePageMetaApi(payload: { pageKey: string, title: string, description: string, ogImage?: string }) {
  const { data } = await apiClient.put<PageMetaResponse>('/api/page-meta/admin', payload);
  return data;
}
