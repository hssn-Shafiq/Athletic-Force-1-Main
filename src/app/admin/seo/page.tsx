
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Search, Edit3, Globe, Save, X, Layout } from "lucide-react";
import { getAllPageMetasApi, updatePageMetaApi } from "@/lib/api/pageMeta";

const CORE_PAGES = [
  { key: "home", name: "Home Page", path: "/" },
  { key: "shop", name: "Shop Page", path: "/shop" },
  { key: "blog", name: "Blog Section", path: "/blog" },
  { key: "contact", name: "Contact Page", path: "/contact" },
];

export default function AdminSEOPage() {
  const [metas, setMetas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });

  useEffect(() => {
    fetchMetas();
  }, []);

  const fetchMetas = async () => {
    setIsLoading(true);
    try {
      const res = await getAllPageMetasApi();
      if (res.ok) setMetas(res.metas || []);
    } catch (err) {
      toast.error("Failed to load SEO data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (page: any) => {
    const existing = metas.find(m => m.pageKey === page.key);
    setEditingKey(page.key);
    setEditForm({
      title: existing?.title || "",
      description: existing?.description || "",
    });
  };

  const handleSave = async (pageKey: string) => {
    try {
      const res = await updatePageMetaApi({
        pageKey,
        ...editForm
      });
      if (res.ok) {
        toast.success("SEO updated successfully!");
        setEditingKey(null);
        fetchMetas();
      }
    } catch (err) {
      toast.error("Tactical Failure: Update failed");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
            <Globe className="w-8 h-8 text-orange-500" />
            SEO Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Deploy tactical metadata across core website sectors</p>
        </div>
      </div>

      <div className="grid gap-6">
        {CORE_PAGES.map((page) => {
          const meta = metas.find(m => m.pageKey === page.key);
          const isEditing = editingKey === page.key;

          return (
            <div key={page.key} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                      <Layout className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-black uppercase italic text-lg text-slate-900">{page.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{page.path}</p>
                    </div>
                  </div>
                  
                  {!isEditing ? (
                    <button 
                      onClick={() => handleEdit(page)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                      Adjust SEO
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingKey(null)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => handleSave(page.key)}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
                      >
                        <Save className="w-4 h-4" />
                        Deploy
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Meta Title</label>
                      <input 
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                        placeholder="e.g. Home | Athletic Force 1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Meta Description</label>
                      <textarea 
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium leading-relaxed"
                        placeholder="Describe the sector for search engines..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Title</h4>
                      <p className="text-sm font-bold text-slate-900">{meta?.title || "Not Set"}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Description</h4>
                      <p className="text-sm text-slate-500 line-clamp-2">{meta?.description || "No tactical description deployed yet."}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
