import { apiClient } from './client';
import type {
  NavMenuResponse,
  NavMenusResponse,
  CreateNavMenuRequest,
  UpdateNavMenuRequest,
} from './types';

// ─── Public ───────────────────────────────────────────────────────────────────

/** Fetch a single active menu by its key — used by MegaMenu on the frontend */
export async function fetchPublicNavMenu(key: string): Promise<NavMenuResponse> {
  const { data } = await apiClient.get<NavMenuResponse>(`/api/nav-menus/${key}`);
  return data;
}

/** Fetch all active menus (lightweight – no items) */
export async function fetchPublicNavMenus(): Promise<NavMenusResponse> {
  const { data } = await apiClient.get<NavMenusResponse>('/api/nav-menus');
  return data;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/** Fetch all menus including inactive — admin only */
export async function fetchAdminNavMenus(): Promise<NavMenusResponse> {
  const { data } = await apiClient.get<NavMenusResponse>('/api/admin/nav-menus');
  return data;
}

/** Fetch a single menu by ID — admin only */
export async function fetchAdminNavMenu(menuId: string): Promise<NavMenuResponse> {
  const { data } = await apiClient.get<NavMenuResponse>(`/api/admin/nav-menus/${menuId}`);
  return data;
}

/** Create a new menu — admin only */
export async function createNavMenu(payload: CreateNavMenuRequest): Promise<NavMenuResponse> {
  const { data } = await apiClient.post<NavMenuResponse>('/api/admin/nav-menus', payload);
  return data;
}

/** Full-replace update a menu — admin only */
export async function updateNavMenu(
  menuId: string,
  payload: UpdateNavMenuRequest
): Promise<NavMenuResponse> {
  const { data } = await apiClient.put<NavMenuResponse>(`/api/admin/nav-menus/${menuId}`, payload);
  return data;
}

/** Delete a menu — admin only */
export async function deleteNavMenu(menuId: string): Promise<{ ok: boolean; message?: string }> {
  const { data } = await apiClient.delete(`/api/admin/nav-menus/${menuId}`);
  return data;
}
