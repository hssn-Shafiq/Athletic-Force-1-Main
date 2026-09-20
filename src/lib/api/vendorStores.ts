import { apiClient } from './client';

export interface VendorSelectedProductConfig {
  productId: string;
  selectedColors: string[];
  customColors?: string[];
  selectedSizes?: string[];
}

export interface SubmitVendorStorePayload {
  storeName: string;
  vendorName: string;
  email: string;
  phone?: string;
  address?: string;
  productNamePrefix: string;
  collectionSlugs: string[];
  productIds: string[];
  selectedProducts?: VendorSelectedProductConfig[];
  /** Base64 data-URL of the logo image, e.g. "data:image/png;base64,..." */
  logoBase64?: string | null;
}

export interface SubmitVendorStoreResponse {
  ok: boolean;
  message: string;
  store?: {
    id: string;
    storeName: string;
    status: 'pending' | 'approved' | 'rejected' | 'paused';
    createdAt: string;
  };
}

export interface MyVendorStore {
  id: string;
  _id?: string;
  storeName: string;
  vendorName: string;
  email: string;
  phone?: string;
  address?: string;
  productNamePrefix?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paused';
  logoUrl?: string;
  collectionSlugs: string[];
  productIds: string[];
  selectedProducts?: VendorSelectedProductConfig[];
  products: { _id: string; name: string; mainImageUrl: string; }[];
  rejectionReason?: string;
  allowedResubmission?: boolean;
  commissionRate?: number;
  isCommissionActive?: boolean;
  commissionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Submit a new vendor store registration (status defaults to "pending"). */
export async function submitVendorStoreApi(
  payload: SubmitVendorStorePayload
): Promise<SubmitVendorStoreResponse> {
  const { data } = await apiClient.post<SubmitVendorStoreResponse>(
    '/api/vendor-stores',
    payload
  );
  return data;
}

/** Fetch all vendor store applications for the currently logged-in user. */
export async function getMyVendorStoresApi(): Promise<{ ok: boolean; stores: MyVendorStore[] }> {
  const { data } = await apiClient.get<{ ok: boolean; stores: MyVendorStore[] }>(
    '/api/vendor-stores/my'
  );
  return data;
}

// ── Admin API Methods ─────────────────────────────────────────────────────────

export interface AdminVendorStoreListResponse {
  ok: boolean;
  items: MyVendorStore[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  counts: { pending: number; approved: number; rejected: number; paused: number; all: number };
}

export async function adminGetVendorStoresApi(params: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: 'new' | 'old';
}) {
  const { data } = await apiClient.get<AdminVendorStoreListResponse>('/api/admin/vendor-stores', {
    params,
  });
  return data;
}

export interface AdminVendorStoreDetail extends MyVendorStore {
  email: string;
  vendorName: string;
  collectionSlugs: string[];
  productIds: string[];
  vendorId: { _id: string; name: string; email: string; avatarUrl?: string; roles: string[] };
  products: { _id: string; name: string; slug: string; mainImageUrl: string; status: string }[];
}

export async function adminGetVendorStoreApi(id: string) {
  const { data } = await apiClient.get<{ ok: boolean; store: AdminVendorStoreDetail }>(
    `/api/admin/vendor-stores/${id}`
  );
  return data;
}

export async function adminUpdateVendorStoreStatusApi(
  id: string,
  payload: { status: 'pending' | 'approved' | 'rejected' | 'paused'; rejectionReason?: string; allowedResubmission?: boolean }
) {
  const { data } = await apiClient.patch<{ ok: boolean; store: MyVendorStore }>(
    `/api/admin/vendor-stores/${id}/status`,
    payload
  );
  return data;
}

export async function adminUpdateVendorStoreApi(
  id: string,
  payload: Omit<SubmitVendorStorePayload, 'email'>
) {
  const { data } = await apiClient.put<{ ok: boolean; store: MyVendorStore }>(
    `/api/admin/vendor-stores/${id}`,
    payload
  );
  return data;
}

export async function adminDeleteVendorStoreApi(id: string) {
  const { data } = await apiClient.delete<{ ok: boolean }>(`/api/admin/vendor-stores/${id}`);
  return data;
}

export interface MockupConfigPayload {
  viewName: string;
  color?: string;
  baseImageUrl: string;
  baseImagePublicId?: string;
  printZones: any[];
  renderedImageUrl?: string;
  renderedImagePublicId?: string;
  logoTransform?: {
    logoUrl: string;
    xPercent: number;
    yPercent: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
}

export interface ApproveAndGenerateProductItem {
  masterProductId: string;
  customName: string;
  basePrice?: number;
  mockups: MockupConfigPayload[];
}

export interface ApproveAndGeneratePayload {
  productNamePrefix?: string;
  commissionRate?: number;
  isCommissionActive?: boolean;
  commissionNotes?: string;
  products: ApproveAndGenerateProductItem[];
}

export async function adminUploadMockupRenderApi(payload: { storeSlug: string; imageBase64: string }) {
  const { data } = await apiClient.post<{ ok: boolean; url: string; publicId: string }>(
    '/api/admin/vendor-stores/upload-mockup-render',
    payload
  );
  return data;
}

export async function adminApproveAndGenerateProductsApi(id: string, payload: ApproveAndGeneratePayload) {
  const { data } = await apiClient.post<{ ok: boolean; message: string; createdCount: number; store: MyVendorStore }>(
    `/api/admin/vendor-stores/${id}/approve-and-generate`,
    payload
  );
  return data;
}

export async function adminUpdateStoreCommissionApi(
  id: string,
  payload: {
    commissionRate: number;
    isCommissionActive: boolean;
    commissionNotes?: string;
  }
) {
  const { data } = await apiClient.patch<{
    ok: boolean;
    message: string;
    store: {
      id: string;
      storeName: string;
      commissionRate: number;
      isCommissionActive: boolean;
      commissionNotes?: string;
    };
  }>(`/api/admin/vendor-stores/${id}/commission`, payload);
  return data;
}

export interface CommissionStoreBreakdown {
  storeId: string;
  storeName: string;
  vendorName: string;
  email: string;
  logoUrl?: string;
  status: string;
  commissionRate: number;
  isCommissionActive: boolean;
  orderCount: number;
  grossSales: number;
  platformProfit: number;
  vendorPayout: number;
  lastOrderAt: string | null;
}

export interface CommissionTimelinePoint {
  date: string;
  platformProfit: number;
  grossSales: number;
  vendorPayout: number;
  orders: number;
}

export interface CommissionAnalyticsResponse {
  ok: boolean;
  timeframe: {
    range: string;
    start: string;
    end: string;
  };
  totals: {
    totalGrossSales: number;
    totalPlatformProfit: number;
    totalVendorPayouts: number;
    totalOrders: number;
    totalItems: number;
  };
  timeline: CommissionTimelinePoint[];
  stores: CommissionStoreBreakdown[];
}

export async function adminGetCommissionAnalyticsApi(params?: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await apiClient.get<CommissionAnalyticsResponse>(
    '/api/admin/vendor-stores/commissions/analytics',
    { params }
  );
  return data;
}

