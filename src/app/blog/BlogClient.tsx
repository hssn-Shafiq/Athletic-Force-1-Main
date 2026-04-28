
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

  useEffect(() => {
    fetchBlogData();
  }, [selectedCategory]);

  const fetchBlogData = async () => {
    setIsLoading(true);
    try {
      const [postRes, catRes] = await Promise.all([
        getPublicBlogPostsApi({ 
            category: selectedCategory === "all" ? undefined : selectedCategory 
        }),
        getBlogCategoriesApi()
      ]);
      
      if (postRes.ok) setPosts(postRes.posts);
      if (catRes.ok) setCategories(catRes.categories);
    } catch (err) {
      console.error("Tactical Failure: Could not load blog intel");
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Featured Story */}
        {featuredPost && (
          <section className="mb-14">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-2xl md:text-4xl font-black text-heading tracking-tight italic uppercase">Featured Story</h2>
              <Link href={`/blog/${featuredPost.slug}`} className="text-orange-600 text-sm md:text-base font-black inline-flex items-center gap-2 uppercase tracking-widest italic group">
                Read Article
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <article className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-[40px] bg-white border border-black/10 overflow-hidden shadow-xl shadow-black/5 group">
              <div className="h-[260px] md:h-[420px] overflow-hidden">
                <img src={featuredPost.thumbnail} alt={featuredPost.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-6 md:p-10 flex flex-col justify-between">
                <div>
                  <p className="text-xs md:text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-2 italic">
                    {featuredPost.category?.name || "Tactical Sector"}
                  </p>
                  <h3 className="text-2xl md:text-4xl font-black text-heading leading-[1.1] tracking-tighter italic uppercase">
                    {featuredPost.title}
                  </h3>
                  <p className="mt-4 text-sm md:text-base text-black/70 leading-relaxed line-clamp-3 font-medium">{featuredPost.excerpt}</p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                       <span className="font-black text-slate-400 text-xs">{featuredPost.author.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-heading uppercase italic tracking-tight">{featuredPost.author.name}</p>
                      <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">{featuredPost.author.title}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Clock3 className="w-3.5 h-3.5" />
                    {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* Latest Articles Matrix */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <h2 className="text-2xl md:text-4xl font-black text-heading tracking-tight italic uppercase">Latest Articles</h2>
            
            {/* Tactical Sector Filters */}
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
          </div>

          {posts.length === 0 ? (
            <div className="py-32 bg-white rounded-[40px] border border-slate-100 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-slate-200" />
               </div>
               <h3 className="text-xl font-black italic uppercase text-slate-900">No Intel Found</h3>
               <p className="text-sm text-slate-400 font-medium mt-2">No articles found in this tactical sector.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {otherPosts.map((post) => (
                <article key={post.slug} className="rounded-[32px] overflow-hidden bg-white border border-black/5 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col">
                  <div className="h-[240px] overflow-hidden relative">
                    <img src={post.thumbnail} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4">
                       <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-lg italic">
                          {post.category?.name || "Journal"}
                       </span>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col flex-1">
                    <h3 className="text-xl md:text-2xl font-black text-heading leading-tight tracking-tight italic uppercase group-hover:text-orange-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-4 text-sm text-black/60 leading-relaxed font-medium line-clamp-3 flex-1">{post.excerpt}</p>

                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-5">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                      <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-[10px] font-black text-heading group-hover:text-orange-600 transition-colors uppercase tracking-widest italic">
                        Read More
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
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
