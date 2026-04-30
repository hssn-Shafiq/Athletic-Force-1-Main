
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Search, LayoutGrid } from "lucide-react";
import { getPublicBlogPostsApi, getBlogCategoriesApi } from "@/lib/api/blog";

export default function BlogClient() {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isFiltering, setIsFiltering] = useState(false);

  // Initial mount: Fetch both categories and posts
  useEffect(() => {
    const initFetch = async () => {
      setIsLoading(true);
      try {
        const [postRes, catRes] = await Promise.all([
          getPublicBlogPostsApi({}),
          getBlogCategoriesApi()
        ]);
        if (postRes.ok) setPosts(postRes.posts);
        if (catRes.ok) setCategories(catRes.categories);
      } catch (err) {
        console.error("Tactical Failure: Initial load failed");
      } finally {
        setIsLoading(false);
      }
    };
    initFetch();
  }, []);

  // Filter change: Only fetch posts
  useEffect(() => {
    if (isLoading) return; // Skip if initial load is still happening
    
    const fetchFilteredPosts = async () => {
      setIsFiltering(true);
      try {
        const postRes = await getPublicBlogPostsApi({ 
          category: selectedCategory === "all" ? undefined : selectedCategory 
        });
        if (postRes.ok) setPosts(postRes.posts);
      } catch (err) {
        console.error("Tactical Failure: Filter update failed");
      } finally {
        setIsFiltering(false);
      }
    };
    fetchFilteredPosts();
  }, [selectedCategory]);

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  if (isLoading) {
    return <BlogSkeleton />;
  }

  return (
    <main className="bg-[#f3f3f3] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        
        {/* Editorial Hero Section */}
        <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-gradient-to-br from-white via-white to-zinc-100 p-8 md:p-12 mb-12">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-accent/20 blur-2xl" />
          <div className="absolute -left-12 -bottom-16 h-44 w-44 rounded-full bg-black/10 blur-2xl" />

          <p className="relative inline-flex items-center rounded-full border border-black/15 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-heading">
            Athletic Force 1 Journal
          </p>
          <h1 className="relative mt-4 text-4xl md:text-6xl font-black leading-[0.95] tracking-tight text-heading max-w-4xl italic uppercase">
            Ideas, Strategy, And Stories For Teams That Compete To Win
          </h1>
          <p className="relative mt-5 max-w-2xl text-sm md:text-lg text-black/70 leading-relaxed font-medium">
            Practical playbooks on team identity, premium uniforms, and athlete-focused equipment decisions.
          </p>
        </section>

        {/* Tactical Sector Filters */}
        <section className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
              <button 
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === "all" ? "bg-black text-white border-black" : "bg-white text-slate-400 border-slate-100 hover:border-black hover:text-black"}`}
              >
                All Sectors
              </button>
              {categories.map((cat) => (
                <button 
                  key={cat._id} 
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat._id ? "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/20" : "bg-white text-slate-400 border-slate-100 hover:border-black hover:text-black"}`}
                >
                  {cat.name}
                </button>
              ))}
          </div>
        </section>

        {/* Intelligence Matrix - Locker Room Style */}
        <section className={`transition-opacity duration-300 ${isFiltering ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          {posts.length === 0 ? (
            <div className="py-32 bg-white rounded-[40px] border border-slate-100 text-center shadow-sm">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-200" />
               </div>
               <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">No Intel Found</h3>
               <p className="text-sm text-slate-400 font-medium mt-2">No intelligence reports found in this tactical sector.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 relative">
              {isFiltering && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <article className="flex flex-col h-full">
                    <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden bg-[#E8EAEE] border border-[#E2E5E9] shadow-md">
                      {post.thumbnail ? (
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No Visual Intel</span>
                        </div>
                      )}

                      <span className="absolute top-4 left-4 inline-flex items-center rounded-lg bg-white/95 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-900 border border-slate-100 shadow-sm italic">
                        {new Date(post.publishedAt || post.createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>

                      {/* Category Badge - Added to locker room style */}
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1.5 bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-lg italic border border-white/10">
                           {post.category?.name || "Journal"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 mt-6">
                      <h3 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 leading-[1.2] group-hover:text-[#FF5A2A] transition-colors uppercase italic line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium line-clamp-3 flex-1 italic">
                        {post.excerpt}
                      </p>

                      <div className="mt-6 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-900 group-hover:gap-2 transition-all">
                        Access Intel
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function BlogSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 animate-pulse">
      <div className="h-64 w-full bg-slate-200 rounded-[32px] mb-12" />
      <div className="flex justify-between mb-8">
         <div className="h-10 w-48 bg-slate-200 rounded-xl" />
         <div className="h-10 w-64 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-[420px] w-full bg-slate-200 rounded-[40px] mb-14" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[...Array(3)].map((_, i) => (
           <div key={i} className="h-96 bg-slate-200 rounded-[32px]" />
         ))}
      </div>
    </div>
  );
}
