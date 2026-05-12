
import { apiClient } from './client';

export const getPageContentApi = async (pageKey: string) => {
  try {
    const res = await apiClient.get(`/api/page-content/${pageKey}`);
    return res.data;
  } catch (error: any) {
    return error.response?.data || { ok: false, message: 'Failed to fetch content' };
  }
};

export const updatePageContentApi = async (pageKey: string, data: any) => {
  try {
    const res = await apiClient.put(`/api/page-content/${pageKey}`, { data });
    return res.data;
  } catch (error: any) {
    return error.response?.data || { ok: false, message: 'Failed to update content' };
  }
};
