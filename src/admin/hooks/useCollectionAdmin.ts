"use client";

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  createAdminCollectionApi,
  deleteAdminCollectionApi,
  getAdminCollectionParentsApi,
  getAdminCollectionsApi,
  normalizeCollection,
  updateAdminCollectionApi,
} from '@/lib/api/collections';
import { getApiErrorMessage } from '@/lib/api/errors';
import { AdminCollection, AdminCollectionParent } from '@/lib/api/types';

type ViewMode = 'create' | 'list';
type CollectionSortBy = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'parent-asc' | 'parent-desc';

const COLLECTIONS_PAGE_SIZE = 6;

export function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toCollectionId(collection: AdminCollection) {
  return collection.id ?? collection._id ?? '';
}

type EditCollectionDraft = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string;
  isActive: boolean;
  sortOrder: number;
  removeImage: boolean;
};

function upsertParentOption(prevParents: AdminCollectionParent[], collection: AdminCollection) {
  const collectionId = toCollectionId(collection);
  if (!collectionId || collection.isActive === false) {
    return prevParents.filter((parent) => (parent.id ?? parent._id ?? '') !== collectionId);
  }

  const nextParent: AdminCollectionParent = {
    id: collectionId,
    _id: collectionId,
    name: collection.name,
    slug: collection.slug,
    parentId: typeof collection.parentId === 'string' ? collection.parentId : null,
  };

  const exists = prevParents.some((parent) => (parent.id ?? parent._id ?? '') === collectionId);
  if (!exists) {
    return [...prevParents, nextParent];
  }

  return prevParents.map((parent) => ((parent.id ?? parent._id ?? '') === collectionId ? nextParent : parent));
}

export function useCollectionAdmin() {
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [parents, setParents] = useState<AdminCollectionParent[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [parentFilterId, setParentFilterId] = useState('');
  const [sortBy, setSortBy] = useState<CollectionSortBy>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const [editingCollection, setEditingCollection] = useState<EditCollectionDraft | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<AdminCollection | null>(null);

  const imagePreview = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  const editImagePreview = useMemo(() => {
    if (!editImageFile) return null;
    return URL.createObjectURL(editImageFile);
  }, [editImageFile]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
      }
    };
  }, [editImagePreview]);

  useEffect(() => {
    async function loadCollectionsData() {
      setIsLoading(true);

      try {
        const [collectionsResponse, parentsResponse] = await Promise.all([
          getAdminCollectionsApi(),
          getAdminCollectionParentsApi(),
        ]);

        setCollections(collectionsResponse.collections.map(normalizeCollection));
        setParents(parentsResponse.parents);
      } catch (loadError) {
        toast.error(getApiErrorMessage(loadError, 'Unable to load collections.'));
      } finally {
        setIsLoading(false);
      }
    }

    void loadCollectionsData();
  }, []);

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const parent of parents) {
      const id = parent.id ?? parent._id;
      if (id) {
        map.set(id, parent.name);
      }
    }
    return map;
  }, [parents]);

  const parentFilterOptions = useMemo(() => {
    return [...parents].sort((a, b) => a.name.localeCompare(b.name));
  }, [parents]);

  const filteredCollections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const enriched = collections.map((collection) => {
      const rawParentId = typeof collection.parentId === 'string' ? collection.parentId : null;
      const resolvedParentName = collection.parentName ?? (rawParentId ? parentNameMap.get(rawParentId) ?? null : null);

      return {
        ...collection,
        parentId: rawParentId,
        parentName: resolvedParentName,
      };
    });

    const searched = enriched.filter((collection) => {
      const parentName = collection.parentName ?? '';
      const matchesSearch =
        !query ||
        collection.name.toLowerCase().includes(query) ||
        collection.slug.toLowerCase().includes(query) ||
        (collection.description ?? '').toLowerCase().includes(query) ||
        parentName.toLowerCase().includes(query);

      const matchesParent = !parentFilterId || collection.parentId === parentFilterId;
      return matchesSearch && matchesParent;
    });

    searched.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return aTime - bTime;
        }
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'parent-asc': {
          const aParent = a.parentName ?? 'zzzz';
          const bParent = b.parentName ?? 'zzzz';
          return aParent.localeCompare(bParent) || a.name.localeCompare(b.name);
        }
        case 'parent-desc': {
          const aParent = a.parentName ?? '';
          const bParent = b.parentName ?? '';
          return bParent.localeCompare(aParent) || a.name.localeCompare(b.name);
        }
        case 'newest':
        default: {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        }
      }
    });

    return searched;
  }, [collections, parentFilterId, parentNameMap, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / COLLECTIONS_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, parentFilterId, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * COLLECTIONS_PAGE_SIZE;
    return filteredCollections.slice(start, start + COLLECTIONS_PAGE_SIZE);
  }, [currentPage, filteredCollections]);

  function resetForm() {
    setName('');
    setSlug('');
    setDescription('');
    setParentId('');
    setImageFile(null);
  }

  async function submitCollection() {
    if (!name.trim()) {
      toast.error('Collection name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createAdminCollectionApi({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        parentId: parentId || undefined,
        imageFile: imageFile ?? undefined,
      });

      const normalized = normalizeCollection(response.collection);
      setCollections((prev) => [normalized, ...prev.filter((item) => toCollectionId(item) !== toCollectionId(normalized))]);
      setParents((prev) => upsertParentOption(prev, normalized));

      if (response.message) {
        toast.warn(response.message);
      } else {
        toast.success('Collection created successfully.');
      }

      resetForm();
      setViewMode('list');
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, 'Unable to create collection.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(collection: AdminCollection) {
    setEditingCollection({
      id: toCollectionId(collection),
      name: collection.name,
      slug: collection.slug,
      description: collection.description ?? '',
      parentId: (collection.parentId as string | undefined) ?? '',
      isActive: collection.isActive ?? true,
      sortOrder: collection.sortOrder ?? 0,
      removeImage: false,
    });
    setEditImageFile(null);
  }

  function closeEditModal() {
    setEditingCollection(null);
    setEditImageFile(null);
  }

  function updateEditDraft<K extends keyof EditCollectionDraft>(key: K, value: EditCollectionDraft[K]) {
    setEditingCollection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value,
      };
    });
  }

  function openDeleteModal(collection: AdminCollection) {
    setDeletingCollection(collection);
  }

  function closeDeleteModal() {
    setDeletingCollection(null);
  }

  async function submitEditCollection() {
    if (!editingCollection) {
      return;
    }

    if (!editingCollection.name.trim()) {
      toast.error('Collection name is required.');
      return;
    }

    setIsEditSubmitting(true);

    try {
      const response = await updateAdminCollectionApi(editingCollection.id, {
        name: editingCollection.name.trim(),
        slug: editingCollection.slug.trim(),
        description: editingCollection.description,
        parentId: editingCollection.parentId,
        isActive: editingCollection.isActive,
        sortOrder: editingCollection.sortOrder,
        removeImage: editingCollection.removeImage,
        imageFile: editImageFile ?? undefined,
      });

      const normalized = normalizeCollection(response.collection);

      setCollections((prev) =>
        prev.map((collection) =>
          toCollectionId(collection) === toCollectionId(normalized)
            ? normalized
            : collection
        )
      );
      setParents((prev) => upsertParentOption(prev, normalized));

      if (response.message) {
        toast.warn(response.message);
      } else {
        toast.success('Collection updated successfully.');
      }

      closeEditModal();
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, 'Unable to update collection.'));
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function submitDeleteCollection() {
    const target = deletingCollection;
    if (!target) {
      return;
    }

    const targetId = toCollectionId(target);
    setIsDeleteSubmitting(true);

    try {
      const response = await deleteAdminCollectionApi(targetId);
      setCollections((prev) => prev.filter((collection) => toCollectionId(collection) !== targetId));
      setParents((prev) => prev.filter((parent) => (parent.id ?? parent._id ?? '') !== targetId));

      if (response.message) {
        toast.warn(response.message);
      } else {
        toast.success('Collection deleted successfully.');
      }

      closeDeleteModal();
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, 'Unable to delete collection.'));
    } finally {
      setIsDeleteSubmitting(false);
    }
  }

  return {
    viewMode,
    setViewMode,
    name,
    setName,
    slug,
    setSlug,
    description,
    setDescription,
    parentId,
    setParentId,
    imageFile,
    setImageFile,
    imagePreview,
    collections,
    parents,
    isLoading,
    isSubmitting,
    isEditSubmitting,
    isDeleteSubmitting,
    searchQuery,
    setSearchQuery,
    parentFilterId,
    setParentFilterId,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredCount: filteredCollections.length,
    paginatedCollections,
    parentFilterOptions,
    submitCollection,
    editingCollection,
    editImageFile,
    editImagePreview,
    updateEditDraft,
    setEditImageFile,
    openEditModal,
    closeEditModal,
    submitEditCollection,
    deletingCollection,
    openDeleteModal,
    closeDeleteModal,
    submitDeleteCollection,
    toCollectionId,
  };
}
