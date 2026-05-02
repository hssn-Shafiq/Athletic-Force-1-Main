"use client";

import React from 'react';
import { Upload, Image as ImageIcon, Plus, List, Pencil, Trash2, X, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { getParentName } from '@/lib/api/collections';
import { useCollectionAdmin, makeSlug } from './hooks/useCollectionAdmin';

export const CollectionCreateForm: React.FC = () => {
  const {
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
    filteredCount,
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
  } = useCollectionAdmin();

  function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submitCollection();
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Collections</h1>
            <p className="text-slate-400 font-medium italic text-sm">Create and manage collections with optional image and parent assignment.</p>
          </div>

          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('create')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${viewMode === 'create' ? 'bg-black text-white' : 'text-slate-500 hover:text-black'
                }`}
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'text-slate-500 hover:text-black'
                }`}
            >
              <List className="w-4 h-4" />
              Collections ({collections.length})
            </button>
          </div>
        </div>

        {viewMode === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <section className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Collection Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setName(value);
                    if (!slug) {
                      setSlug(makeSlug(value));
                    }
                  }}
                  placeholder="e.g. Summer Drops"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(makeSlug(e.target.value))}
                  placeholder="summer-drops"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium"
                />
                <p className="text-xs text-slate-400 font-medium">Leave blank to auto-generate from name on backend.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Parent Collection (Optional)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium"
                >
                  <option value="">No parent collection</option>
                  {parents.map((parent) => {
                    const key = parent.id ?? parent._id ?? parent.slug;
                    const value = parent.id ?? parent._id ?? '';

                    return (
                      <option key={key} value={value}>
                        {parent.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Short collection description..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-50"
                >
                  View Collections
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-2xl bg-[var(--color-accent)] text-white text-xs font-black uppercase tracking-wider hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </section>

            <aside className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-8 space-y-4">
              <h2 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Collection Image</h2>
              <p className="text-xs text-slate-400 font-medium">Optional. If provided, backend uploads to Cloudinary.</p>

              <label className="block">
                <span className="sr-only">Choose collection image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 hover:border-black transition-colors cursor-pointer">
                  <div className="flex flex-col items-center text-center gap-2">
                    <Upload className="w-6 h-6 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-800">Click to upload image</p>
                    <p className="text-xs text-slate-500">PNG, JPG, WEBP up to 8MB</p>
                  </div>
                </div>
              </label>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Collection preview" className="w-full h-48 object-cover" />
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <ImageIcon className="w-7 h-7" />
                    <p className="text-xs font-semibold uppercase tracking-wider">No image selected</p>
                  </div>
                )}
              </div>

              {imageFile ? <p className="text-xs text-slate-500 font-medium truncate">Selected: {imageFile.name}</p> : null}
            </aside>
          </form>
        ) : (
          <section className="space-y-5">
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-4 md:p-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <label className="relative lg:col-span-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, slug, description..."
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 outline-none focus:border-black text-sm font-medium"
                  />
                </label>

                <label className="relative lg:col-span-1">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={parentFilterId}
                    onChange={(e) => setParentFilterId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 outline-none focus:border-black text-sm font-medium"
                  >
                    <option value="">All parent categories</option>
                    {parentFilterOptions.map((parent) => {
                      const value = parent.id ?? parent._id ?? '';
                      const key = value || parent.slug;

                      return (
                        <option key={key} value={value}>
                          {parent.name}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                      | 'newest'
                      | 'oldest'
                      | 'name-asc'
                      | 'name-desc'
                      | 'parent-asc'
                      | 'parent-desc'
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-black text-sm font-medium"
                >
                  <option value="newest">Sort: Newest first</option>
                  <option value="oldest">Sort: Oldest first</option>
                  <option value="name-asc">Sort: Name A-Z</option>
                  <option value="name-desc">Sort: Name Z-A</option>
                  <option value="parent-asc">Sort: Parent A-Z</option>
                  <option value="parent-desc">Sort: Parent Z-A</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Total: {collections.length}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Filtered: {filteredCount}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Page: {currentPage} / {totalPages}</span>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                <p className="text-sm font-semibold text-slate-500">Loading collections...</p>
              </div>
            ) : filteredCount === 0 ? (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                <p className="text-sm font-semibold text-slate-500">No matching collections found. Try changing search, filters, or sort.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedCollections.map((collection) => {
                    const key = collection.id ?? collection._id ?? collection.slug;
                    const parentName = collection.parentName || getParentName(collection.parentId as string | undefined, parents);

                    return (
                      <article key={key} className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="h-40 bg-slate-100">
                          {collection.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={collection.imageUrl} alt={collection.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <div className="p-5 space-y-2">
                          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{collection.name}</h3>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">/{collection.slug}</p>
                          <p className="text-xs font-medium text-slate-500 line-clamp-2">{collection.description || 'No description added.'}</p>
                          <p className="text-[11px] font-semibold text-slate-500">
                            Parent: <span className="text-slate-800">{parentName || 'None'}</span>
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500">
                            Status: <span className="text-slate-800">{collection.isActive ? 'Active' : 'Inactive'}</span>
                          </p>

                          <div className="pt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(collection)}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(collection)}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {editingCollection ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeEditModal}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close edit modal"
          />

          <div className="relative w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Edit Collection</h2>
                <p className="text-xs font-medium text-slate-400 mt-1">Update details, hierarchy, status, and image.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitEditCollection();
              }}
              className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Collection Name *</label>
                  <input
                    type="text"
                    value={editingCollection.name}
                    onChange={(e) => updateEditDraft('name', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Slug</label>
                  <input
                    type="text"
                    value={editingCollection.slug}
                    onChange={(e) => updateEditDraft('slug', makeSlug(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Parent Collection</label>
                  <select
                    value={editingCollection.parentId}
                    onChange={(e) => updateEditDraft('parentId', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium"
                  >
                    <option value="">No parent collection</option>
                    {parents
                      .filter((parent) => {
                        const parentOptionId = parent.id ?? parent._id ?? '';
                        return parentOptionId && parentOptionId !== editingCollection.id;
                      })
                      .map((parent) => {
                        const optionId = parent.id ?? parent._id ?? '';
                        const optionKey = optionId || parent.slug;

                        return (
                          <option key={optionKey} value={optionId}>
                            {parent.name}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Sort Order</label>
                    <input
                      type="number"
                      min={0}
                      value={editingCollection.sortOrder}
                      onChange={(e) => updateEditDraft('sortOrder', Number(e.target.value || 0))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 mt-7 rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50">
                    <input
                      type="checkbox"
                      checked={editingCollection.isActive}
                      onChange={(e) => updateEditDraft('isActive', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">Active</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
                  <textarea
                    rows={4}
                    value={editingCollection.description}
                    onChange={(e) => updateEditDraft('description', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black text-sm font-medium resize-y"
                  />
                </div>
              </div>

              <aside className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Image</h3>

                <label className="block">
                  <span className="sr-only">Replace collection image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 hover:border-black transition-colors cursor-pointer text-center">
                    <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Replace image</p>
                  </div>
                </label>

                <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 w-full">
                  <input
                    type="checkbox"
                    checked={editingCollection.removeImage}
                    onChange={(e) => updateEditDraft('removeImage', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">Remove current image</span>
                </label>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  {editImagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editImagePreview} alt="New image preview" className="w-full h-44 object-cover" />
                  ) : editingCollection.removeImage ? (
                    <div className="h-44 flex items-center justify-center text-slate-400">
                      <p className="text-xs font-semibold uppercase tracking-wider">Image will be removed</p>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                  )}
                </div>

                {editImageFile ? <p className="text-xs text-slate-500 font-medium truncate">Selected: {editImageFile.name}</p> : null}
              </aside>

              <div className="lg:col-span-3 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-6 py-3 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingCollection ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeDeleteModal}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close delete modal"
          />

          <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Delete Collection</h2>
            <p className="text-sm text-slate-600 font-medium">
              Delete <span className="font-black text-slate-900">{deletingCollection.name}</span>? This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitDeleteCollection()}
                disabled={isDeleteSubmitting}
                className="px-6 py-3 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-wider hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleteSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
