import { apiClient } from './client';

export interface VendorDashboardStore {
  id: string;
  storeName: string;
  vendorName: string;
  productNamePrefix: string;
  logoUrl?: string;
  collectionSlugs: string[];
  status: string;
}

export interface VendorTimelinePoint {
  date: string;
  label: string;
  netEarnings: number;
  grossRevenue: number;
  platformFee: number;
  salesCount: number;
}

export interface VendorDailyBreakdown {
  date: string;
  formattedDate: string;
  netEarnings: number;
  grossRevenue: number;
  platformFee: number;
  salesCount: number;
}

export interface VendorDashboardMetrics {
  totalGrossRevenue: number;
  totalNetEarnings: number;
  totalPlatformFee: number;
  salesCount: number;
  avgSaleValue: number;
  pendingPayout: number;
  paidPayout: number;
  commissionRate: number;
  vendorShareRate: number;
  lifetimeGross: number;
  lifetimeNet: number;
  lifetimeFee: number;
  lifetimeSalesCount: number;
  lifetimePendingPayout: number;
  lifetimePaidPayout: number;
  activeProductsCount: number;
}

export interface VendorDashboardSummaryResponse {
  ok: boolean;
  store: VendorDashboardStore;
  filter: {
    period: string;
    startDate: string;
    endDate: string;
  };
  metrics: VendorDashboardMetrics;
  timeline: VendorTimelinePoint[];
  breakdown: VendorDailyBreakdown[];
}

export interface VendorProductItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  basePrice: number;
  regularPrice?: number;
  salePrice?: number;
  mainImageUrl: string;
  variantsCount: number;
  variants: Array<{
    sku?: string;
    color: string;
    size: string;
    price?: number;
    stock: number;
    imageUrl?: string;
  }>;
  mockupsCount: number;
  soldCount: number;
  createdAt: string;
}

export interface VendorProductsResponse {
  ok: boolean;
  items: VendorProductItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface VendorStoreProfile {
  id: string;
  storeName: string;
  vendorName: string;
  email: string;
  phone?: string;
  address?: string;
  productNamePrefix: string;
  logoUrl?: string;
  collectionSlugs: string[];
  teamStoreSlug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStoreProfilePayload {
  storeName?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ── API Methods ──────────────────────────────────────────────────────────────

export async function getVendorDashboardSummaryApi(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await apiClient.get<VendorDashboardSummaryResponse>('/api/vendor/dashboard/summary', { params });
  return data;
}

export async function getVendorProductsApi(params?: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await apiClient.get<VendorProductsResponse>('/api/vendor/products', { params });
  return data;
}

export async function requestVendorProductApi(payload: {
  masterProductId: string;
  selectedColors: string[];
  customColors: string[];
  selectedSizes: string[];
  notes?: string;
}) {
  const { data } = await apiClient.post<{ ok: boolean; message: string; selectedProductsCount: number }>(
    '/api/vendor/products/request',
    payload
  );
  return data;
}

export async function getVendorStoreProfileApi() {
  const { data } = await apiClient.get<{ ok: boolean; store: VendorStoreProfile }>('/api/vendor/store');
  return data;
}

export async function updateVendorStoreProfileApi(payload: UpdateStoreProfilePayload) {
  const { data } = await apiClient.put<{ ok: boolean; message: string; store: VendorStoreProfile }>(
    '/api/vendor/store',
    payload
  );
  return data;
}

export async function changeVendorPasswordApi(payload: ChangePasswordPayload) {
  const { data } = await apiClient.post<{ ok: boolean; message: string }>('/api/vendor/settings/change-password', payload);
  return data;
}
