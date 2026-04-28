'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getPublicBlogPostsApi, BlogPost } from '@/lib/api/blog';

export const LockerRoomSkeleton = () => (
  <div className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-[16/10] rounded-2xl bg-slate-100 border border-slate-200" />
        <div className="mt-4 h-6 bg-slate-100 rounded-lg w-3/4" />
        <div className="mt-3 h-4 bg-slate-50 rounded-lg w-full" />
        <div className="mt-2 h-4 bg-slate-50 rounded-lg w-2/3" />
        <div className="mt-4 h-4 bg-slate-100 rounded-lg w-1/4" />
      </div>
    ))}
  </div>
);

export const LockerRoomSection: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchIntel() {
      try {
        const res = await getPublicBlogPostsApi({ limit: 3 });
        if (res.ok && res.posts) {
          setPosts(res.posts);
        }
      } catch (error) {
        console.error("Failed to fetch locker room intel:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIntel();
  }, []);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 italic uppercase tracking-tighter">The Locker Room</h2>

        <Link 
          href="/blog" 
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#FF5A2A] hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          Mission Intel
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <LockerRoomSkeleton />
      ) : (
        <div className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <article>
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#E8EAEE] border border-[#E2E5E9]">
                  {post.thumbnail ? (
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Visual Intel</span>
                    </div>
                  )}

                  <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded-md bg-white/95 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-900 border border-slate-100 shadow-sm">
                    {new Date(post.publishedAt || post.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900 leading-[1.2] group-hover:text-[#FF5A2A] transition-colors uppercase italic line-clamp-2">
                  {post.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 font-medium line-clamp-2">{post.excerpt}</p>

                <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-900 group-hover:gap-2 transition-all">
                  Access Intel
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
