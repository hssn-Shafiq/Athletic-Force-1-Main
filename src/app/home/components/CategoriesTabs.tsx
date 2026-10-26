"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { getCollectionTreeApi, getCollectionHierarchyApi } from '@/lib/api/publicCollections';
import { Skeleton } from '@/components/ui/skeleton';

export interface CategoryItem {
  id: string;
  title: string;
  image: string;
  category: string; // "Merchandise" | "Accessories" | "Custom-Uniform"
  href: string;
}

const TABS = [
  { id: "ALL", label: "ALL" },
  { id: "merchandise", label: "Merchandise", key: "Merchandise" },
  { id: "accessories", label: "Accessories", key: "Accessories" },
  { id: "custom-uniform", label: "Custom-Uniform", key: "Custom-Uniform" },
] as const;

type TabKey = (typeof TABS)[number]["label"];

const FALLBACK_CATEGORY_ITEMS: CategoryItem[] = [
  // Merchandise sub-collections
  { id: 'm-1', title: "Band", image: "/Categories/Band.png", category: "Merchandise", href: "/collections/merchandise/band" },
  { id: 'm-2', title: "Hoodies", image: "/after-hero-categories/Marchandise.webp", category: "Merchandise", href: "/collections/merchandise/hoodies" },
  { id: 'm-3', title: "Shirts", image: "/Categories/Band.png", category: "Merchandise", href: "/collections/merchandise/shirts" },
  { id: 'm-4', title: "Caps & Hats", image: "/after-hero-categories/Marchandise.webp", category: "Merchandise", href: "/collections/merchandise/caps" },
  // Accessories sub-collections
  { id: 'a-1', title: "Helmet", image: "/Categories/Helmet.webp", category: "Accessories", href: "/collections/accessories/helmet" },
  { id: 'a-2', title: "Shoes", image: "/Categories/Shoes.webp", category: "Accessories", href: "/collections/accessories/shoes" },
  { id: 'a-3', title: "Visor", image: "/Categories/Visor.webp", category: "Accessories", href: "/collections/accessories/visor" },
  { id: 'a-4', title: "Bags & Gloves", image: "/after-hero-categories/Accessories.webp", category: "Accessories", href: "/collections/accessories/bags" },
  // Custom Uniform sub-collections
  { id: 'c-1', title: "Football", image: "/after-hero-categories/Custom-Uniform.webp", category: "Custom-Uniform", href: "/collections/custom-uniforms/football" },
  { id: 'c-2', title: "Basketball", image: "/after-hero-categories/Custom-Uniform.webp", category: "Custom-Uniform", href: "/collections/custom-uniforms/basketball" },
  { id: 'c-3', title: "7v7 Uniforms", image: "/after-hero-categories/Custom-Uniform.webp", category: "Custom-Uniform", href: "/collections/custom-uniforms/7v7-uniforms" },
  { id: 'c-4', title: "Track & Field", image: "/after-hero-categories/Custom-Uniform.webp", category: "Custom-Uniform", href: "/collections/custom-uniforms/track-field" },
];

function resolveSubCollectionImage(name: string, slug: string, parentCategory: string): string {
  const query = `${name} ${slug}`.toLowerCase();
  if (query.includes('band') || query.includes('wrist')) return '/Categories/Band.png';
  if (query.includes('helmet')) return '/Categories/Helmet.webp';
  if (query.includes('shoe') || query.includes('cleat') || query.includes('footwear')) return '/Categories/Shoes.webp';
  if (query.includes('visor')) return '/Categories/Visor.webp';

  if (parentCategory === 'Merchandise') return '/after-hero-categories/Marchandise.webp';
  if (parentCategory === 'Accessories') return '/after-hero-categories/Accessories.webp';
  return '/after-hero-categories/Custom-Uniform.webp';
}

function normalizeParentCategory(slugOrName: string): "Merchandise" | "Accessories" | "Custom-Uniform" | null {
  const s = slugOrName.toLowerCase();
  if (s.includes('merchandise')) return 'Merchandise';
  if (s.includes('accessories')) return 'Accessories';
  if (s.includes('custom-uniform') || s.includes('custom-unifomr') || s.includes('uniform')) return 'Custom-Uniform';
  return null;
}

const CategoryCard: React.FC<{ item: CategoryItem }> = ({ item }) => {
  return (
    <Link href={item.href} className="relative group cursor-pointer h-full block">
      {/* Hover Gradient Border Container */}
      <div className="absolute -inset-[2px] rounded-[30px] sm:rounded-[40px] bg-transparent group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:via-red-500 group-hover:to-yellow-400 transition-all duration-300 -z-10" />

      <div className="relative h-full bg-[var(--color-page-background)] rounded-[28px] sm:rounded-[38px] overflow-hidden flex flex-col border border-[#E5E7EB] group-hover:border-transparent transition-colors p-3 sm:p-4">
        {/* Product Image */}
        <div className="relative flex-1 min-h-[160px] sm:min-h-[280px] rounded-[22px] sm:rounded-[30px] bg-[#ECECEC] overflow-hidden flex items-center justify-center">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Label Bar */}
        <div className="relative z-10 mt-3 sm:mt-4 bg-white rounded-2xl py-2.5 sm:py-3 pl-4 sm:pl-5 pr-14 sm:pr-16 flex items-center border border-[#E3E5E8] min-h-[44px] sm:min-h-[56px]">
          <span className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900 truncate">
            {item.title}
          </span>
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-orange-600 text-white rounded-lg p-1.5 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
};

const CategoryCardSkeleton: React.FC = () => {
  return (
    <div className="relative h-full bg-[var(--color-page-background)] rounded-[28px] sm:rounded-[38px] overflow-hidden flex flex-col border border-[#E5E7EB] p-3 sm:p-4">
      {/* Product Image Skeleton */}
      <div className="relative flex-1 min-h-[160px] sm:min-h-[280px] rounded-[22px] sm:rounded-[30px] bg-slate-100 overflow-hidden">
        <Skeleton className="w-full h-full rounded-[22px] sm:rounded-[30px]" />
      </div>

      {/* Label Bar Skeleton */}
      <div className="relative z-10 mt-3 sm:mt-4 bg-white rounded-2xl py-2.5 sm:py-3 px-4 sm:px-5 flex items-center justify-between border border-[#E3E5E8] min-h-[44px] sm:min-h-[56px]">
        <Skeleton className="h-4 sm:h-5 w-24 sm:w-32 rounded-md" />
        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg" />
      </div>
    </div>
  );
};

export const CategoriesTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 'auto',
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Automatically fetch sub-collections from the three parent collections
  useEffect(() => {
    let isCancelled = false;

    async function fetchSubCollections() {
      try {
        setIsLoading(true);

        // 1. First attempt: get full collections tree
        const treeRes = await getCollectionTreeApi().catch(() => null);
        const allCollections = treeRes?.ok && Array.isArray(treeRes.collections) ? treeRes.collections : [];

        if (allCollections.length > 0) {
          // Identify parent collections matching Merchandise, Accessories, Custom-Uniform
          const parentsMap = new Map<string, { id: string; slug: string; category: "Merchandise" | "Accessories" | "Custom-Uniform" }>();

          for (const col of allCollections) {
            if (!col.parentId) {
              const matchedCategory = normalizeParentCategory(col.slug) || normalizeParentCategory(col.name);
              if (matchedCategory) {
                parentsMap.set(col.id, { id: col.id, slug: col.slug, category: matchedCategory });
              }
            }
          }

          // Gather sub-collections whose parentId is in parentsMap
          const fetchedItems: CategoryItem[] = [];

          for (const col of allCollections) {
            if (col.parentId && parentsMap.has(col.parentId)) {
              const parent = parentsMap.get(col.parentId)!;
              const image = col.imageUrl || resolveSubCollectionImage(col.name, col.slug, parent.category);
              fetchedItems.push({
                id: col.id,
                title: col.name,
                image,
                category: parent.category,
                href: `/collections/${parent.slug}/${col.slug}`,
              });
            }
          }

          if (fetchedItems.length > 0 && !isCancelled) {
            setCategoryItems(fetchedItems);
            setIsLoading(false);
            return;
          }
        }

        // 2. Second attempt: customization hierarchy endpoint
        const hierRes = await getCollectionHierarchyApi().catch(() => null);
        const hierarchy = hierRes?.hierarchy || [];

        if (hierarchy.length > 0) {
          const fetchedItems: CategoryItem[] = [];

          for (const parent of hierarchy) {
            const matchedCategory = normalizeParentCategory(parent.slug) || normalizeParentCategory(parent.name);
            if (matchedCategory && Array.isArray(parent.subcategories)) {
              for (const sub of parent.subcategories) {
                fetchedItems.push({
                  id: sub.id,
                  title: sub.name,
                  image: resolveSubCollectionImage(sub.name, sub.slug, matchedCategory),
                  category: matchedCategory,
                  href: `/collections/${parent.slug}/${sub.slug}`,
                });
              }
            }
          }

          if (fetchedItems.length > 0 && !isCancelled) {
            setCategoryItems(fetchedItems);
            setIsLoading(false);
            return;
          }
        }

        // Fallback if no subcollections found
        if (!isCancelled) {
          setCategoryItems(FALLBACK_CATEGORY_ITEMS);
        }
      } catch (err) {
        console.error("Failed to load category sub-collections:", err);
        if (!isCancelled) {
          setCategoryItems(FALLBACK_CATEGORY_ITEMS);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchSubCollections();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (activeTab === "ALL") {
      return categoryItems;
    }
    return categoryItems.filter(item => item.category === activeTab);
  }, [activeTab, categoryItems]);

  const syncCarouselState = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    syncCarouselState();
    emblaApi.on('select', syncCarouselState);
    emblaApi.on('reInit', syncCarouselState);

    return () => {
      emblaApi.off('select', syncCarouselState);
      emblaApi.off('reInit', syncCarouselState);
    };
  }, [emblaApi, syncCarouselState]);

  // Reinitialize carousel whenever filtered items change and immediately sync state
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    syncCarouselState();
    emblaApi.scrollTo(0);
  }, [emblaApi, filteredItems, syncCarouselState]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const viewAllHref = useMemo(() => {
    if (activeTab === "Merchandise") return "/collections/merchandise";
    if (activeTab === "Accessories") return "/collections/accessories";
    if (activeTab === "Custom-Uniform") return "/collections/custom-uniforms";
    return "/shop";
  }, [activeTab]);

  return (
    <section className="w-full space-y-8 sm:space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Categories
          </h2>

          {/* Category Filter Tabs */}
          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.label)}
                className={`shrink-0 whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm cursor-pointer ${
                  activeTab === tab.label
                    ? "bg-black text-white scale-105 shadow-lg"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-slate-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href={viewAllHref}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-600 hover:opacity-70 transition-opacity"
          >
            View All Products
            <MoveRight className="w-4 h-4" />
          </Link>

          {/* Carousel Controls */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Previous slide"
              className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center transition-all ${
                canScrollPrev
                  ? "hover:bg-black hover:text-white cursor-pointer opacity-100"
                  : "opacity-30 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Next slide"
              className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center transition-all ${
                canScrollNext
                  ? "hover:bg-black hover:text-white cursor-pointer opacity-100"
                  : "opacity-30 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {isLoading ? (
          <div className="overflow-hidden py-4">
            <div className="flex">
              {[...Array(4)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex-[0_0_80%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] px-2 sm:px-3"
                >
                  <CategoryCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="embla overflow-hidden" ref={emblaRef}>
              <div className="embla__container flex py-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="embla__slide flex-[0_0_80%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] px-2 sm:px-3"
                  >
                    <CategoryCard item={item} />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots - only show when there is actually more than 1 page to scroll */}
            {scrollSnaps.length > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => scrollTo(index)}
                    aria-label={`Go to page ${index + 1}`}
                    className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                      index === selectedIndex
                        ? "w-8 bg-black"
                        : "w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
