
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Loader2, 
  Search,
  LayoutGrid
} from "lucide-react";
import { 
  getBlogCategoriesApi, 
  createAdminBlogCategoryApi, 
  deleteAdminBlogCategoryApi 
} from "@/lib/api/blog";

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- Form State ---
  const [newCat, setNewCat] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await getBlogCategoriesApi();
      if (res.ok) setCategories(res.categories);
    } catch (err) {
      toast.error("Failed to load tactical sectors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;

    try {
      setIsSubmitting(true);
      const slug = newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const res = await createAdminBlogCategoryApi({ ...newCat, slug });
      if (res.ok) {
        toast.success("Sector initialized!");
        setNewCat({ name: "", description: "" });
        fetchCategories();
      }
    } catch (err) {
      toast.error("Failed to create sector");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the sector classification.")) return;
    try {
      const res = await deleteAdminBlogCategoryApi(id);
      if (res.ok) {
        toast.success("Sector removed");
        fetchCategories();
      }
    } catch (err) {
      toast.error("Failed to delete sector");
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-orange-500" />
          Editorial Sectors
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Manage classifications for AF1 Journal publications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm sticky top-10">
            <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-900 mb-6">Initialize New Sector</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sector Name</label>
                <input 
                  type="text"
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="e.g. Performance Intel"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Brief Description</label>
                <textarea 
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  className="w-full h-24 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="What stories fall into this sector?"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 h-12 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Deploy Sector
              </button>
            </form>
          </div>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-transparent focus:border-slate-100 rounded-xl text-xs font-bold outline-none"
                    placeholder="Search sectors..."
                  />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  Total: <span className="text-black">{categories.length}</span>
               </p>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Sector Name</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Publications</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-50 rounded" /></td>
                          <td className="px-6 py-4 text-center"><div className="h-4 w-12 bg-slate-50 rounded mx-auto" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-50 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-20 text-center">
                           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <LayoutGrid className="w-6 h-6 text-slate-200" />
                           </div>
                           <p className="text-sm font-black italic uppercase text-slate-300">No sectors identified</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat) => (
                        <tr key={cat._id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-black uppercase italic text-slate-900">{cat.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.slug}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500">
                              <BookOpen className="w-3 h-3" />
                              {cat.productCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-slate-400 hover:text-black transition-colors">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(cat._id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
