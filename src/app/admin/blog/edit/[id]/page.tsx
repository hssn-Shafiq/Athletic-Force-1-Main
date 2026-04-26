
"use client";

import { useState, useEffect, useMemo, use } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { 
  Save, 
  X, 
  Image as ImageIcon, 
  Tag as TagIcon, 
  User, 
  Globe, 
  Plus, 
  Loader2,
  ChevronLeft,
  Trash2,
  AlertCircle
} from "lucide-react";
import { 
  getBlogCategoriesApi, 
  getAdminBlogPostByIdApi,
  updateAdminBlogPostApi, 
  createAdminBlogCategoryApi 
} from "@/lib/api/blog";
import { MediaLibraryModal } from "@/admin/components/MediaLibraryModal";
import "react-quill-new/dist/quill.snow.css";

// Dynamic import for Quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse rounded-xl" />
});

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    thumbnail: "",
    category: "",
    tags: [] as string[],
    status: "draft" as const,
    author: {
      name: "",
      title: "",
      avatar: ""
    },
    faqs: [] as Array<{ question: string; answer: string }>,
    seo: {
      title: "",
      description: ""
    }
  });

  const [currentTag, setCurrentTag] = useState("");
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // --- Quill Config ---
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "clean"],
    ],
  }), []);

  useEffect(() => {
    const init = async () => {
      await fetchCategories();
      await fetchPost();
    };
    init();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await getBlogCategoriesApi();
      if (res.ok) {
        setCategories(res.categories);
      }
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminBlogPostByIdApi(id);
      if (res.ok && res.post) {
        const post = res.post;
        setFormData({
          title: post.title || "",
          slug: post.slug || "",
          content: post.content || "",
          excerpt: post.excerpt || "",
          thumbnail: post.thumbnail || "",
          category: post.category?._id || post.category || "",
          tags: post.tags || [],
          status: post.status || "draft",
          author: {
            name: post.author?.name || "",
            title: post.author?.title || "",
            avatar: post.author?.avatar || ""
          },
          faqs: post.faqs || [],
          seo: {
            title: post.seo?.title || "",
            description: post.seo?.description || ""
          }
        });
      } else {
        setError("Story not found in current sector");
      }
    } catch (err) {
      setError("Failed to retrieve publication intelligence");
      toast.error("Tactical Error: Post not found");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, title, slug }));
  };

  const handleThumbnailSelect = (item: any) => {
    setFormData(prev => ({ ...prev, thumbnail: item.secureUrl }));
    setIsMediaModalOpen(false);
    toast.success("Thumbnail intelligence acquired!");
  };

  const addFaq = () => {
    setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { question: "", answer: "" }] }));
  };

  const removeFaq = (index: number) => {
    setFormData(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    const nextFaqs = [...formData.faqs];
    nextFaqs[index][field] = value;
    setFormData(prev => ({ ...prev, faqs: nextFaqs }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(currentTag.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
      }
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const res = await createAdminBlogCategoryApi({ name: newCategoryName, slug });
      if (res.ok) {
        toast.success("Category created!");
        setCategories(prev => [...prev, res.category]);
        setFormData(prev => ({ ...prev, category: res.category._id }));
        setNewCategoryName("");
        setShowNewCategoryModal(false);
      }
    } catch (err) {
      toast.error("Failed to create category");
    }
  };

  const handleSubmit = async (status: 'published' | 'draft' | 'archived') => {
    if (!formData.title || !formData.content || !formData.thumbnail) {
      toast.error("Title, Content, and Thumbnail are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateAdminBlogPostApi(id, { ...formData, status });
      if (res.ok) {
        toast.success("Publication Intelligence Updated!");
        router.push("/admin/blog");
      }
    } catch (err) {
      toast.error("Tactical Failure: Could not update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Retrieving Tactical Publication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">{error}</h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">The requested publication could not be identified in the editorial matrix.</p>
        <button onClick={() => router.push("/admin/blog")} className="px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
          Abort to Command Center
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Modify Intelligence</h1>
            <p className="text-slate-500 text-sm font-medium tracking-tight">Updating: {formData.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSubmit(formData.status)}
            disabled={isSubmitting}
            className="px-6 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Update Current {(formData.status as string) === 'published' ? 'Deployment' : 'Draft'}
          </button>
          <button 
            onClick={() => handleSubmit('published')}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {(formData.status as string) === 'published' ? 'Sync Deployed Story' : 'Deploy Article'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editorial Body */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 italic">Headline</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full text-3xl font-black italic uppercase tracking-tight border-none outline-none placeholder:text-slate-100"
                  placeholder="ENTER STORY TITLE..."
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 italic">Brief Intel (Excerpt)</label>
                <textarea 
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full h-24 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 transition-all leading-relaxed"
                  placeholder="Summarize the core strategy..."
                />
              </div>

              {/* Content Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block italic">Detailed Brief (Content)</label>
                   <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest italic animate-pulse">Design Tip: Use H2 for "The Quick Answer" and bold bullet points</span>
                </div>
                <div className="quill-container rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                  <ReactQuill 
                    theme="snow"
                    value={formData.content}
                    onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                    modules={modules}
                    className="min-h-[400px] bg-white border-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tactical FAQs */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-900 flex items-center gap-3">
                   Tactical FAQs
                </h3>
                <button 
                  onClick={addFaq}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Intelligence Pair
                </button>
             </div>
             
             <div className="space-y-4">
                {formData.faqs.map((faq, index) => (
                  <div key={index} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 group">
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pair #{index + 1}</span>
                       <button onClick={() => removeFaq(index)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <input 
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(index, "question", e.target.value)}
                      className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-sm font-black italic uppercase outline-none focus:border-orange-500/30 transition-all"
                      placeholder="ENTER QUESTION..."
                    />
                    <textarea 
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, "answer", e.target.value)}
                      className="w-full h-24 p-4 bg-white border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-orange-500/30 transition-all"
                      placeholder="Enter the tactical answer..."
                    />
                  </div>
                ))}
                {formData.faqs.length === 0 && (
                  <p className="text-center py-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No FAQs identified for this story</p>
                )}
             </div>
          </div>

          {/* SEO Command Center */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
             <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-900 mb-6 flex items-center gap-3">
                <Globe className="w-5 h-5 text-orange-500" />
                SEO Tactical Data
             </h3>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Browser Title</label>
                   <input 
                     type="text"
                     value={formData.seo.title}
                     onChange={(e) => setFormData(prev => ({ ...prev, seo: { ...prev.seo, title: e.target.value } }))}
                     className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                     placeholder="Defaults to Headline"
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Meta Description</label>
                   <textarea 
                     value={formData.seo.description}
                     onChange={(e) => setFormData(prev => ({ ...prev, seo: { ...prev.seo, description: e.target.value } }))}
                     className="w-full h-24 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none"
                     placeholder="Defaults to Excerpt"
                   />
                </div>
             </div>
          </div>
        </div>

        {/* Tactical Sidebar Settings */}
        <div className="space-y-6">
          {/* Thumbnail Sector */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
             <h3 className="text-[10px] font-black uppercase italic tracking-widest text-slate-400 mb-4">Thumbnail Image</h3>
             <div className="relative aspect-video rounded-2xl bg-slate-100 overflow-hidden group border-2 border-dashed border-slate-200 hover:border-orange-500/50 transition-all">
                {formData.thumbnail ? (
                  <>
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, thumbnail: "" }))}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsMediaModalOpen(true)}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialize Thumbnail</span>
                  </button>
                )}
             </div>
          </div>

          {/* Classification (Category & Tags) */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
             <h3 className="text-[10px] font-black uppercase italic tracking-widest text-slate-400 mb-4">Classification</h3>
             
             <div className="space-y-4">
                <div>
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Sector (Category)</label>
                     <button 
                       onClick={() => setShowNewCategoryModal(true)}
                       className="text-[9px] font-black text-orange-600 hover:underline uppercase"
                     >
                       + New Sector
                     </button>
                   </div>
                   <select 
                     value={formData.category}
                     onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                     className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase italic outline-none"
                   >
                     {categories.map(cat => (
                       <option key={cat._id} value={cat._id}>{cat.name}</option>
                     ))}
                   </select>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest block mb-2">Tags (Enter to add)</label>
                   <div className="relative">
                     <TagIcon className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                     <input 
                       type="text"
                       value={currentTag}
                       onChange={(e) => setCurrentTag(e.target.value)}
                       onKeyDown={handleAddTag}
                       className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                       placeholder="e.g. Football"
                     />
                   </div>
                   <div className="flex flex-wrap gap-2 mt-3">
                     {formData.tags.map(tag => (
                       <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                         {tag}
                         <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                           <X className="w-3 h-3" />
                         </button>
                       </span>
                     ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Author Credits */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
             <h3 className="text-[10px] font-black uppercase italic tracking-widest text-slate-400 mb-4">Intelligence Source (Author)</h3>
             <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <input 
                    type="text"
                    value={formData.author.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: { ...prev.author, name: e.target.value } }))}
                    className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                    placeholder="Source Name"
                  />
                </div>
                <div className="relative">
                  <Plus className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <input 
                    type="text"
                    value={formData.author.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: { ...prev.author, title: e.target.value } }))}
                    className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                    placeholder="Tactical Title (e.g. Lead Designer)"
                  />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">New Sector Initialization</h2>
              <p className="text-slate-500 text-xs font-medium mb-6">Create a new classification for AF1 Journal publications.</p>
              
              <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sector Name</label>
                   <input 
                     type="text"
                     value={newCategoryName}
                     onChange={(e) => setNewCategoryName(e.target.value)}
                     className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                     placeholder="e.g. Team Strategy"
                   />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowNewCategoryModal(false)}
                    className="flex-1 h-12 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 h-12 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                  >
                    Initialize Sector
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      <MediaLibraryModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleThumbnailSelect}
        folder="af1/blogs"
        title="Blog Asset Library"
      />
    </div>
  );
}
