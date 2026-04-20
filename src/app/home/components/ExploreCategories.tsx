
"use client";

import React, { useEffect, useState } from 'react';
import { ArrowRight, MoveRight } from 'lucide-react';
import { getExploreCollectionsApi } from '@/lib/api/publicCollections';
import { ExploreCollection } from '@/lib/api/types';

interface CategoryItemProps {
  title: string;
  image: string;
}

const SKELETON_COUNT = 10;

const CategoryItem: React.FC<CategoryItemProps> = ({ title, image }) => {
  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-slate-100">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>
      <h3 className="font-black text-center text-sm md:text-base tracking-tight uppercase mb-1">
        {title}
      </h3>
      <button className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] md:text-xs uppercase tracking-wider group-hover:gap-2.5 transition-all">
        Customize now
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

const CategorySkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center animate-pulse">
      <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-slate-200" />
      <div className="h-4 w-3/4 rounded-md bg-slate-200 mb-3" />
      <div className="h-3 w-1/2 rounded-md bg-slate-200" />
    </div>
  );
};

export const ExploreCategories: React.FC = () => {
  const [collections, setCollections] = useState<ExploreCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadExploreCollections() {
      try {
        const response = await getExploreCollectionsApi();

        if (!isMounted) {
          return;
        }

        setCollections(response.collections ?? []);
      } catch {
        if (!isMounted) {
          return;
        }

        setCollections([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadExploreCollections();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = collections.map((collection) => ({
    title: collection.name,
    image: collection.imageUrl || 'https://picsum.photos/seed/af1-collection/400/500',
  }));

  return (
    <section className="w-full py-16">
      <div className="flex items-end justify-between mb-12">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
          Explore Categories
        </h2>
        <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-900 hover:opacity-70 transition-opacity pb-1 border-b border-transparent hover:border-slate-900">
          View All Sports
          <MoveRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-16">
          {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
            <CategorySkeleton key={`skeleton-${idx}`} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-base font-black uppercase tracking-wide text-slate-800">No Categories Available</p>
          <p className="mt-2 text-sm font-medium text-slate-500">Please check back again soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-16">
          {categories.map((cat, idx) => (
            <CategoryItem key={`${cat.title}-${idx}`} title={cat.title} image={cat.image} />
          ))}
        </div>
      )}

      <div className="mt-20 flex justify-center">
        <button className="group px-12 py-4 bg-[#F2F2F2] border border-slate-300 rounded-full flex items-center gap-3 font-bold uppercase tracking-widest text-xs text-slate-900 hover:bg-slate-200 transition-all shadow-sm">
          Customize Your Kit
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
