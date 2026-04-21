import { apiClient } from './client';
import {
  CreateProductRequest,
  DeleteProductResponse,
  ProductCollectionsResponse,
  ProductListResponse,
  ProductResponse,
  UpdateProductRequest,
  UpsertProductRequest,
} from './types';

function buildProductFormData(payload: Partial<UpsertProductRequest> & { removeMainImage?: boolean }) {
  const formData = new FormData();

  const bodyPayload: Record<string, unknown> = {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.orderType !== undefined ? { orderType: payload.orderType } : {}),
    ...(payload.collectionIds !== undefined ? { collectionIds: payload.collectionIds } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.basePrice !== undefined ? { basePrice: payload.basePrice } : {}),
    ...(payload.regularPrice !== undefined ? { regularPrice: payload.regularPrice } : {}),
    ...(payload.salePrice !== undefined ? { salePrice: payload.salePrice } : {}),
    ...(payload.badgeName !== undefined ? { badgeName: payload.badgeName } : {}),
    ...(payload.useBasePriceForVariants !== undefined ? { useBasePriceForVariants: payload.useBasePriceForVariants } : {}),
    ...(payload.variantConfig !== undefined ? { variantConfig: payload.variantConfig } : {}),
    ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
    ...(payload.inventory !== undefined ? { inventory: payload.inventory } : {}),
    ...(payload.shipping !== undefined ? { shipping: payload.shipping } : {}),
    ...(payload.seo !== undefined ? { seo: payload.seo } : {}),
    ...(payload.variants !== undefined
      ? {
          variants: payload.variants.map((variant) => ({
            clientKey: variant.clientKey,
            parentValueId: variant.parentValueId,
            size: variant.size,
            color: variant.color,
            gender: variant.gender,
            optionSummary: variant.optionSummary,
            options: variant.options,
            price: variant.price,
            sku: variant.sku,
            stock: variant.stock,
            isActive: variant.isActive,
            imageUrl: variant.imageUrl,
            imagePublicId: variant.imagePublicId,
          })),
        }
      : {}),
    ...(payload.videoReviews !== undefined
      ? {
          videoReviews: payload.videoReviews.map((review) => ({
            clientKey: review.clientKey,
            videoUrl: review.videoUrl,
            thumbnailUrl: review.thumbnailUrl,
            thumbnailPublicId: review.thumbnailPublicId,
          })),
        }
      : {}),
    ...(payload.mainImageUrl !== undefined ? { mainImageUrl: payload.mainImageUrl } : {}),
    ...(payload.mainImagePublicId !== undefined ? { mainImagePublicId: payload.mainImagePublicId } : {}),
    ...(payload.mainVideo !== undefined ? { mainVideo: payload.mainVideo } : {}),
    ...(payload.galleryImages !== undefined ? { galleryImages: payload.galleryImages } : {}),
    ...(payload.removeMainImage !== undefined ? { removeMainImage: payload.removeMainImage } : {}),
  };

  formData.append('payload', JSON.stringify(bodyPayload));

  if (payload.mainImageFile) {
    formData.append('mainImage', payload.mainImageFile);
  }

  if (payload.mainVideoThumbnailFile) {
    formData.append('mainVideoThumbnail', payload.mainVideoThumbnailFile);
  }

  if (payload.galleryImageFiles?.length) {
    payload.galleryImageFiles.forEach((file, index) => {
      formData.append(`galleryImage:${index}`, file);
    });
  }

  if (payload.variants?.length) {
    payload.variants.forEach((variant) => {
      if (variant.imageFile && variant.clientKey) {
        formData.append(`variantImage:${variant.clientKey}`, variant.imageFile);
      }
    });
  }

  if (payload.videoReviews?.length) {
    payload.videoReviews.forEach((review) => {
      if (review.thumbnailFile && review.clientKey) {
        formData.append(`videoThumbnail:${review.clientKey}`, review.thumbnailFile);
      }
    });
  }

  return formData;
}

export async function getAdminProductCollectionsApi(params?: { q?: string; page?: number; pageSize?: number }) {
  const { data } = await apiClient.get<ProductCollectionsResponse>('/api/admin/products/collections', {
    params,
  });
  return data;
}

export async function getAdminProductsApi(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'draft' | 'archived';
  collectionId?: string;
  stock?: 'in-stock' | 'out-of-stock' | 'low-stock';
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'basePrice';
  sortDir?: 'asc' | 'desc';
}) {
  const { data } = await apiClient.get<ProductListResponse>('/api/admin/products', {
    params,
  });
  return data;
}

export async function getAdminProductByIdApi(productId: string) {
  const { data } = await apiClient.get<ProductResponse>(`/api/admin/products/${productId}`);
  return data;
}

export async function createAdminProductApi(payload: CreateProductRequest) {
  const { data } = await apiClient.post<ProductResponse>('/api/admin/products', buildProductFormData(payload), {
    timeout: 0,
  });
  return data;
}

export async function updateAdminProductApi(productId: string, payload: UpdateProductRequest) {
  const { data } = await apiClient.patch<ProductResponse>(`/api/admin/products/${productId}`, buildProductFormData(payload), {
    timeout: 0,
  });
  return data;
}

export async function deleteAdminProductApi(productId: string) {
  const { data } = await apiClient.delete<DeleteProductResponse>(`/api/admin/products/${productId}`);
  return data;
}
