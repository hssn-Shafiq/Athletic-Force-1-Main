import { apiClient } from './client';
import {
  AdminCollection,
  AdminCollectionParent,
  AdminCollectionsResponse,
  AdminCollectionParentsResponse,
  CreateCollectionRequest,
  CreateCollectionResponse,
  UpdateCollectionRequest,
  UpdateCollectionResponse,
  DeleteCollectionResponse,
} from './types';

export async function getAdminCollectionsApi() {
  const { data } = await apiClient.get<AdminCollectionsResponse>('/api/admin/collections');
  return data;
}

export async function getAdminCollectionParentsApi() {
  const { data } = await apiClient.get<AdminCollectionParentsResponse>('/api/admin/collections/parents');
  return data;
}

export async function createAdminCollectionApi(payload: CreateCollectionRequest) {
  const formData = new FormData();
  formData.append('name', payload.name);

  if (payload.slug) {
    formData.append('slug', payload.slug);
  }

  if (payload.description) {
    formData.append('description', payload.description);
  }

  if (payload.parentId) {
    formData.append('parentId', payload.parentId);
  }

  if (payload.imageFile) {
    formData.append('image', payload.imageFile);
  }

  const { data } = await apiClient.post<CreateCollectionResponse>('/api/admin/collections', formData);

  return data;
}

export async function updateAdminCollectionApi(collectionId: string, payload: UpdateCollectionRequest) {
  const formData = new FormData();

  if (payload.name !== undefined) {
    formData.append('name', payload.name);
  }

  if (payload.slug !== undefined) {
    formData.append('slug', payload.slug);
  }

  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }

  if (payload.parentId !== undefined) {
    formData.append('parentId', payload.parentId);
  }

  if (payload.isActive !== undefined) {
    formData.append('isActive', String(payload.isActive));
  }

  if (payload.sortOrder !== undefined) {
    formData.append('sortOrder', String(payload.sortOrder));
  }

  if (payload.removeImage !== undefined) {
    formData.append('removeImage', String(payload.removeImage));
  }

  if (payload.imageFile) {
    formData.append('image', payload.imageFile);
  }

  const { data } = await apiClient.patch<UpdateCollectionResponse>(`/api/admin/collections/${collectionId}`, formData);
  return data;
}

export async function deleteAdminCollectionApi(collectionId: string) {
  const { data } = await apiClient.delete<DeleteCollectionResponse>(`/api/admin/collections/${collectionId}`);
  return data;
}

export function getParentName(parentId: string | null | undefined, parents: AdminCollectionParent[]) {
  if (!parentId) return null;
  const parent = parents.find((entry) => entry._id === parentId || entry.id === parentId);
  return parent?.name ?? null;
}

export function normalizeCollection(collection: AdminCollection) {
  const rawParent = collection.parentId as { _id?: string; id?: string; name?: string } | string | null | undefined;

  const parentId =
    typeof rawParent === 'object' && rawParent
      ? (rawParent._id ?? rawParent.id ?? null)
      : typeof rawParent === 'string'
      ? rawParent
      : null;

  const parentName = typeof rawParent === 'object' && rawParent ? rawParent.name ?? null : null;

  return {
    ...collection,
    parentId,
    parentName,
  };
}
