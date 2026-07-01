import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────
export type PopupType = 'flash_sale' | 'newsletter' | 'welcome_offer' | 'exit_intent' | 'announcement';
export type PopupTrigger = 'page_load' | 'exit_intent' | 'scroll_percent' | 'time_on_page';
export type PopupAudience = 'all' | 'logged_in' | 'guests';
export type PopupFrequency = 'every_visit' | 'once_per_session' | 'once_per_day' | 'once_ever';
export type PopupLayout = 'minimal' | 'bold' | 'dark' | 'split_image' | 'fullscreen';
export type PopupSize = 'small' | 'medium' | 'large';
export type PopupImagePosition = 'left' | 'right' | 'top' | 'background';
export type PopupPageTarget = 'all' | 'homepage' | 'shop' | 'custom';

export interface Popup {
  _id: string;
  name: string;
  type: PopupType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imagePublicId?: string;
  imagePosition?: PopupImagePosition;
  ctaLabel?: string;
  ctaUrl?: string;
  dismissLabel?: string;
  discountCode?: string;
  showCountdown: boolean;
  countdownDeadline?: string;
  showEmailCapture: boolean;
  emailPlaceholder?: string;
  emailButtonLabel?: string;
  trigger: PopupTrigger;
  triggerValue?: number;
  audience: PopupAudience;
  frequency: PopupFrequency;
  layout: PopupLayout;
  size: PopupSize;
  accentColor: string;
  showCloseButton: boolean;
  pageTarget: PopupPageTarget;
  pageTargetPattern?: string;
  isActive: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  impressions: number;
  dismissals: number;
  createdAt: string;
  updatedAt: string;
}

export type PopupFormData = Omit<Popup, '_id' | 'impressions' | 'dismissals' | 'createdAt' | 'updatedAt'>;

// ─── Public API ───────────────────────────────────────────────────────────────
export async function fetchActivePopups(): Promise<{ ok: boolean; popups: Popup[] }> {
  const { data } = await apiClient.get('/api/popups/active');
  return data;
}

export async function trackImpression(id: string) {
  await apiClient.post(`/api/popups/${id}/impression`).catch(() => {});
}

export async function trackDismissal(id: string) {
  await apiClient.post(`/api/popups/${id}/dismiss`).catch(() => {});
}

// ─── Admin API ────────────────────────────────────────────────────────────────
export async function fetchAdminPopups(): Promise<{ ok: boolean; popups: Popup[] }> {
  const { data } = await apiClient.get('/api/admin/popups');
  return data;
}

export async function fetchAdminPopup(id: string): Promise<{ ok: boolean; popup: Popup }> {
  const { data } = await apiClient.get(`/api/admin/popups/${id}`);
  return data;
}

export async function createPopup(payload: Partial<PopupFormData>): Promise<{ ok: boolean; popup: Popup }> {
  const { data } = await apiClient.post('/api/admin/popups', payload);
  return data;
}

export async function updatePopup(id: string, payload: Partial<PopupFormData>): Promise<{ ok: boolean; popup: Popup }> {
  const { data } = await apiClient.put(`/api/admin/popups/${id}`, payload);
  return data;
}

export async function togglePopup(id: string): Promise<{ ok: boolean; popup: Popup }> {
  const { data } = await apiClient.patch(`/api/admin/popups/${id}/toggle`);
  return data;
}

export async function deletePopup(id: string): Promise<{ ok: boolean }> {
  const { data } = await apiClient.delete(`/api/admin/popups/${id}`);
  return data;
}
