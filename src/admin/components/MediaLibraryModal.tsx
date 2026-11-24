"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, Search, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  listAdminMedia,
  signAdminMediaUpload,
  uploadImageWithSignature,
  type AdminMediaItem,
} from '@/lib/api/media';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: AdminMediaItem) => void;
  folder?: string;
  title?: string;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  folder = 'af1/products',
  title = 'Media Library',
}) => {
  const [mediaItems, setMediaItems] = useState<AdminMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'new' | 'old'>('new');

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const response = await listAdminMedia({ prefix: folder, pageSize: 100 });
      setMediaItems(response.items || []);
    } catch {
      toast.error('Unable to load media assets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchMedia();
    }
  }, [isOpen, folder]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    setIsUploading(true);
    setUploadProgress(0);
    const batch = Array.from(files);

    try {
      let finished = 0;
      for (const file of batch) {
        const signed = await signAdminMediaUpload(folder);
        await uploadImageWithSignature(file, signed, (percent) => {
          const aggregate = Math.min(
            99,
            Math.round(((finished + percent / 100) / batch.length) * 100)
          );
          setUploadProgress(aggregate);
        });
        finished += 1;
        setUploadProgress(Math.round((finished / batch.length) * 100));
      }
      toast.success(`Upload successful: ${batch.length} assets deployed.`);
      await fetchMedia();
    } catch {
      toast.error('Media upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredItems = mediaItems
    .filter((item) =>
      item.publicId.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'new' ? bTime - aTime : aTime - bTime;
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-6xl scale-100 flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-6">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
              {title}
            </h3>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Upload once, reuse across products
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-white"
            aria-label="Close media library"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-8">
          <div className="flex w-full items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-xs font-bold outline-none focus:border-slate-300"
                placeholder="Search images..."
                aria-label="Search media"
              />
            </div>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as 'new' | 'old')}
              className="h-11 w-40 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
              aria-label="Sort media"
            >
              <option value="new">Newest first</option>
              <option value="old">Oldest first</option>
            </select>

            <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-black px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95">
              <Upload className="h-4 w-4" />
              Upload
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(event) => void handleUpload(event.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {isUploading && (
          <div className="flex items-center gap-4 border-b border-orange-100 bg-orange-50 px-8 py-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-orange-200/50">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-orange-600">
              Uploading: {uploadProgress}%
            </span>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-white p-8">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center py-20">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-slate-200" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                Loading media...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-100 py-20">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                <Upload className="h-8 w-8 text-slate-200" />
              </div>
              <h4 className="text-sm font-black uppercase italic text-slate-900">
                No assets found
              </h4>
              <p className="mt-1 max-w-[240px] text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Upload new images or clear your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredItems.map((item) => (
                <button
                  key={item.publicId}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10"
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-50">
                    <img
                      src={item.secureUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="border-t border-slate-50 p-3">
                    <p className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-slate-900">
                      {item.publicId.split('/').pop()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
