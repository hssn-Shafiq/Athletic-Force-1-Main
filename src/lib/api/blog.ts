
import { apiClient } from './client';

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

export interface BlogPost {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  author: {
    name: string;
    title: string;
    avatar?: string;
  };
  category: string | BlogCategory;
  tags: string[];
  status: 'published' | 'draft' | 'archived';
  faqs: Array<{ question: string; answer: string }>;
  seo: {
    title?: string;
    description?: string;
  };
  publishedAt?: string;
  createdAt?: string;
}

// --- PUBLIC ---

export async function getPublicBlogPostsApi(params?: { category?: string; tag?: string; page?: number; limit?: number }) {
  const { data } = await apiClient.get('/api/blog/posts', { params });
  return data;
}

export async function getPublicBlogPostBySlugApi(slug: string) {
  const { data } = await apiClient.get(`/api/blog/posts/${slug}`);
  return data;
}

export async function getBlogCategoriesApi() {
  const { data } = await apiClient.get('/api/blog/categories');
  return data;
}

// --- ADMIN ---

export async function getAdminBlogPostsApi() {
  const { data } = await apiClient.get('/api/blog/admin/posts');
  return data;
}

export async function getAdminBlogPostByIdApi(id: string) {
  const { data } = await apiClient.get(`/api/blog/admin/posts/${id}`);
  return data;
}

export async function createAdminBlogPostApi(payload: any) {
  const { data } = await apiClient.post('/api/blog/admin/posts', payload);
  return data;
}

export async function updateAdminBlogPostApi(id: string, payload: any) {
  const { data } = await apiClient.put(`/api/blog/admin/posts/${id}`, payload);
  return data;
}

export async function deleteAdminBlogPostApi(id: string) {
  const { data } = await apiClient.delete(`/api/blog/admin/posts/${id}`);
  return data;
}

export async function createAdminBlogCategoryApi(payload: any) {
  const { data } = await apiClient.post('/api/blog/admin/categories', payload);
  return data;
}

export async function deleteAdminBlogCategoryApi(id: string) {
  const { data } = await apiClient.delete(`/api/blog/admin/categories/${id}`);
  return data;
}
