
"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  listAdminMedia, 
  signAdminMediaUpload, 
  uploadImageWithSignature, 
  type AdminMediaItem 
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
  title = "Media Library"
}) => {
  const [mediaItems, setMediaItems] = useState<AdminMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, folder]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const response = await listAdminMedia({ prefix: folder, pageSize: 100 });
      setMediaItems(response.items || []);
    } catch (err) {
      toast.error('Unable to load tactical media assets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    const batch = Array.from(files);
    
    try {
      let finished = 0;
      for (const file of batch) {
        const signed = await signAdminMediaUpload(folder);
        await uploadImageWithSignature(file, signed, (percent) => {
          const aggregate = Math.min(99, Math.round(((finished + percent / 100) / batch.length) * 100));
          setUploadProgress(aggregate);
        });
        finished += 1;
        setUploadProgress(Math.round((finished / batch.length) * 100));
      }
      toast.success(`Upload successful: ${batch.length} assets deployed.`);
      fetchMedia();
    } catch (err) {
      toast.error('Tactical failure during media deployment.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredItems = mediaItems.filter(item => 
    item.publicId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl flex flex-col scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">{title}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Tactical Asset Command & Deployment</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-white transition-all shadow-sm"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-300" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-4 bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl text-xs font-bold outline-none"
              placeholder="Search assets by Public ID..."
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-6 h-11 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Intel
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
              />
            </label>
            <button
              onClick={fetchMedia}
              className="px-6 h-11 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Sync Library
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="px-8 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-4">
             <div className="flex-1 h-2 bg-orange-200/50 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
             </div>
             <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest whitespace-nowrap">Deploying: {uploadProgress}%</span>
          </div>
        )}

        {/* Media Grid */}
        <div className="flex-1 overflow-auto p-8 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
               <Loader2 className="w-12 h-12 text-slate-200 animate-spin mb-4" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-300">Synchronizing Vault...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 border-2 border-dashed border-slate-50 rounded-[32px]">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Upload className="w-8 h-8 text-slate-200" />
               </div>
               <h4 className="text-sm font-black uppercase italic text-slate-900">No Assets Identified</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center max-w-[240px]">
                  Upload new tactical images or clear your search to view the library.
               </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredItems.map((item) => (
                <button
                  key={item.publicId}
                  onClick={() => onSelect(item)}
                  className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white overflow-hidden hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-50">
                    <img src={item.secureUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-3 border-t border-slate-50">
                    <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                      {item.publicId.split('/').pop()}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/5 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
