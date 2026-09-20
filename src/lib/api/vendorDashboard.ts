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

export interface VendorDashboardMetrics {
  totalGrossRevenue: number;
  totalNetEarnings: number;
  totalPlatformFee: number;
  totalOrders: number;
  activeProductsCount: number;
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export interface VendorRecentOrder {
  id: string;
  subOrderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  vendorNetEarnings: number;
  itemCount: number;
  items: Array<{
    productId: string;
    variantSku: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
  }>;
  createdAt: string;
}

export interface VendorTopProduct {
  id: string;
  name: string;
  slug: string;
  mainImageUrl: string;
  basePrice: number;
  soldCount: number;
  stock: number;
}

export interface VendorDashboardSummaryResponse {
  ok: boolean;
  store: VendorDashboardStore;
  metrics: VendorDashboardMetrics;
  recentOrders: VendorRecentOrder[];
  topProducts: VendorTopProduct[];
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
  globalStock: number;
  totalStock: number;
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

export interface UpdateInventoryPayload {
  globalStock?: number;
  trackQuantity?: boolean;
  variantStocks?: Array<{ sku: string; stock: number }>;
}

export interface VendorOrderSubItem {
  productId: string;
  variantSku: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

export interface VendorOrderDetail {
  id: string;
  subOrderNumber: string;
  orderId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  commissionRate: number;
  platformFee: number;
  vendorNetEarnings: number;
  payoutStatus: 'pending' | 'processing' | 'paid' | 'refunded';
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items: VendorOrderSubItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorOrdersResponse {
  ok: boolean;
  items: VendorOrderDetail[];
  counts: {
    all: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateOrderStatusPayload {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
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

export interface VendorReviewItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  fullName: string;
  rating: number;
  reviewText: string;
  photos: Array<{ url: string; publicId: string }>;
  status: string;
  createdAt: string;
}

export interface VendorReviewsResponse {
  ok: boolean;
  stats: {
    totalReviews: number;
    avgRating: number;
    ratingDistribution: Record<number, number>;
  };
  reviews: VendorReviewItem[];
}

export interface VendorEarningsResponse {
  ok: boolean;
  summary: {
    totalGross: number;
    totalNet: number;
    totalFee: number;
    pendingPayout: number;
    paidPayout: number;
    commissionRate: number;
  };
  payoutHistory: Array<{
    id: string;
    subOrderNumber: string;
    subtotal: number;
    platformFee: number;
    netEarnings: number;
    payoutStatus: string;
    paidAt?: string;
    payoutReference?: string;
    createdAt: string;
  }>;
}

export interface VendorAnalyticsResponse {
  ok: boolean;
  salesTimeline: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topPerforming: Array<{
    id: string;
    name: string;
    slug: string;
    mainImageUrl: string;
    basePrice: number;
    soldCount: number;
  }>;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ── API Methods ──────────────────────────────────────────────────────────────

export async function getVendorDashboardSummaryApi() {
  const { data } = await apiClient.get<VendorDashboardSummaryResponse>('/api/vendor/dashboard/summary');
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

export async function updateVendorProductInventoryApi(productId: string, payload: UpdateInventoryPayload) {
  const { data } = await apiClient.patch<{ ok: boolean; message: string; inventory: any; variants: any[] }>(
    `/api/vendor/products/${productId}/inventory`,
    payload
  );
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

export async function getVendorOrdersApi(params?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await apiClient.get<VendorOrdersResponse>('/api/vendor/orders', { params });
  return data;
}

export async function updateVendorOrderStatusApi(orderId: string, payload: UpdateOrderStatusPayload) {
  const { data } = await apiClient.patch<{ ok: boolean; message: string; order: any }>(
    `/api/vendor/orders/${orderId}/status`,
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

export async function getVendorReviewsApi() {
  const { data } = await apiClient.get<VendorReviewsResponse>('/api/vendor/reviews');
  return data;
}

export async function getVendorEarningsApi() {
  const { data } = await apiClient.get<VendorEarningsResponse>('/api/vendor/earnings');
  return data;
}

export async function getVendorAnalyticsApi() {
  const { data } = await apiClient.get<VendorAnalyticsResponse>('/api/vendor/analytics');
  return data;
}

export async function changeVendorPasswordApi(payload: ChangePasswordPayload) {
  const { data } = await apiClient.post<{ ok: boolean; message: string }>('/api/vendor/settings/change-password', payload);
  return data;
}
