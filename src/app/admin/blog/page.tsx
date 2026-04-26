
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Eye, 
  Filter, 
  Loader2,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Archive,
  MoreVertical,
  BookOpen
} from "lucide-react";
import { getAdminBlogPostsApi, deleteAdminBlogPostApi, updateAdminBlogPostApi } from "@/lib/api/blog";

export default function ManageBlogsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminBlogPostsApi();
      if (res.ok) setPosts(res.posts);
    } catch (err) {
      toast.error("Failed to load publications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action will permanently remove the article.")) return;
    try {
      const res = await deleteAdminBlogPostApi(id);
      if (res.ok) {
        toast.success("Publication removed");
        fetchPosts();
      }
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const handleStatusChange = async (post: any, newStatus: string) => {
    try {
      const res = await updateAdminBlogPostApi(post._id, { ...post, status: newStatus });
      if (res.ok) {
        toast.success(`Post ${newStatus === 'published' ? 'Deployed' : 'Unpublished'}`);
        fetchPosts();
      }
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100"><CheckCircle2 className="w-3 h-3" /> Published</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100"><Clock className="w-3 h-3" /> Draft</span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100"><Archive className="w-3 h-3" /> Archived</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Command Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-orange-500" />
            Publication Command
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage the AF1 Journal editorial calendar and articles</p>
        </div>
        
        <Link 
          href="/admin/blog/add"
          className="flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          Create New Story
        </Link>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-6 mb-8 shadow-sm flex flex-wrap items-center gap-6">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-transparent focus:border-slate-100 rounded-2xl text-sm font-bold outline-none placeholder:text-slate-300 transition-all"
            placeholder="Identify publication by headline or source..."
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 px-6 bg-slate-50 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="published">Deployed</option>
            <option value="draft">Drafts Only</option>
            <option value="archived">Archives</option>
          </select>
        </div>
      </div>

      {/* Publications Table */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden mb-20">
         <div className="overflow-x-auto">
            <table className="w-full border-collapse">
               <thead>
                 <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Publication Intelligence</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Sector</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Source (Author)</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                   [...Array(6)].map((_, i) => (
                     <tr key={i} className="animate-pulse">
                        <td className="px-8 py-6"><div className="flex gap-4 items-center"><div className="w-16 h-10 bg-slate-50 rounded-lg" /><div className="space-y-2"><div className="h-4 w-48 bg-slate-50 rounded" /><div className="h-3 w-32 bg-slate-50 rounded" /></div></div></td>
                        <td className="px-8 py-6"><div className="h-6 w-24 bg-slate-50 rounded-lg" /></td>
                        <td className="px-8 py-6"><div className="h-4 w-32 bg-slate-50 rounded" /></td>
                        <td className="px-8 py-6"><div className="h-6 w-20 bg-slate-50 rounded-full mx-auto" /></td>
                        <td className="px-8 py-6"><div className="h-8 w-20 bg-slate-50 rounded ml-auto" /></td>
                     </tr>
                   ))
                 ) : filteredPosts.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-slate-50/50">
                           <BookOpen className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">No Stories Identified</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">Your editorial calendar is currently clear. Initialize a new story to begin deployment.</p>
                     </td>
                   </tr>
                 ) : (
                   filteredPosts.map((post) => (
                     <tr key={post._id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 shadow-sm">
                                 <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                 <h4 className="text-sm font-black uppercase italic text-slate-900 truncate leading-tight group-hover:text-orange-600 transition-colors">{post.title}</h4>
                                 <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                       <Calendar className="w-3 h-3" />
                                       Created: {new Date(post.createdAt).toLocaleDateString()}
                                    </span>
                                    {post.publishedAt && (
                                      <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1 border-l border-slate-200 pl-3">
                                         Deployed: {new Date(post.publishedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                              {post.category?.name || "Unclassified"}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200 shadow-sm">
                                 <User className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-xs font-black uppercase italic text-slate-900">{post.author.name}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{post.author.title}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                           {getStatusBadge(post.status)}
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                              <Link 
                                href={`/blog/${post.slug}`} 
                                target="_blank"
                                className="p-2 text-slate-400 hover:text-black hover:bg-white rounded-lg transition-all shadow-sm"
                              >
                                 <Eye className="w-4.5 h-4.5" />
                              </Link>
                              <Link 
                                href={`/admin/blog/edit/${post._id}`}
                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-white rounded-lg transition-all shadow-sm"
                              >
                                 <Edit3 className="w-4.5 h-4.5" />
                              </Link>
                              <button 
                                onClick={() => handleDelete(post._id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm"
                              >
                                 <Trash2 className="w-4.5 h-4.5" />
                              </button>
                              <div className="relative group/more">
                                 <button className="p-2 text-slate-400 hover:text-black transition-colors">
                                    <MoreVertical className="w-4.5 h-4.5" />
                                 </button>
                                 <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden hidden group-hover/more:block z-30">
                                    <button 
                                      onClick={() => handleStatusChange(post, post.status === 'published' ? 'draft' : 'published')}
                                      className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-left hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    >
                                       {post.status === 'published' ? <Archive className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                       {post.status === 'published' ? 'Unpublish Story' : 'Deploy Story'}
                                    </button>
                                 </div>
                              </div>
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
  );
}
