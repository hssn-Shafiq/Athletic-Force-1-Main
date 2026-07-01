
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ArrowUpRight, MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryItem {
  id: string;
  title: string;
  image: string;
  category: string;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    id: '1',
    title: "Band",
    image: "/Categories/Band.png",
    category: "Merchandise"
  },
  {
    id: '2',
    title: "Helmet",
    image: "/Categories/Helmet.webp",
    category: "Accessories"
  },
  {
    id: '3',
    title: "Shoes",
    image: "/Categories/Shoes.webp",
    category: "Team Store"
  },
  {
    id: '4',
    title: "Band",
    image: "/Categories/Band.png",
    category: "Merchandise"
  },
  {
    id: '5',
    title: "Helmet",
    image: "/Categories/Helmet.webp",
    category: "Accessories"
  },
  {
    id: '6',
    title: "Shoes",
    image: "/Categories/Shoes.webp",
    category: "Team Store"
  }
];

const TABS = ["ALL", "Merchandise", "Accessories", "Team Store"];

const CategoryCard: React.FC<{ item: CategoryItem }> = ({ item }) => {
  return (
    <div className="relative group cursor-pointer h-full">
      {/* Hover Gradient Border Container */}
      <div className="absolute -inset-[2px] rounded-[30px] sm:rounded-[40px] bg-transparent group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:via-red-500 group-hover:to-yellow-400 transition-all duration-300 -z-10" />

      <div className="relative h-full bg-[var(--color-page-background)] rounded-[28px] sm:rounded-[38px] overflow-hidden flex flex-col border border-[#E5E7EB] group-hover:border-transparent transition-colors p-3 sm:p-4">
        {/* Product Image */}
        <div className="relative flex-1 min-h-[160px] sm:min-h-[280px] rounded-[22px] sm:rounded-[30px] bg-[#ECECEC] overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Label Bar */}
        <div className="relative z-10 mt-3 sm:mt-4 bg-white rounded-2xl py-2.5 sm:py-3 pl-4 sm:pl-5 pr-14 sm:pr-16 flex items-center border border-[#E3E5E8] min-h-[44px] sm:min-h-[56px]">
          <span className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900">{item.title}</span>
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-orange-600 text-white rounded-lg p-1.5 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const CategoriesTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState("ALL");
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const filteredItems = activeTab === "ALL"
    ? CATEGORY_ITEMS
    : CATEGORY_ITEMS.filter(item => item.category === activeTab);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, setScrollSnaps, onSelect]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <section className="w-full space-y-8 sm:space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Categories
          </h2>

          {/* Tabs */}
          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm ${activeTab === tab
                    ? "bg-black text-white scale-105 shadow-lg"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-slate-400"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-600 hover:opacity-70 transition-opacity">
            View All Products
            <MoveRight className="w-4 h-4" />
          </button>

          {/* Carousel Controls */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={scrollPrev}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex py-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="embla__slide flex-[0_0_50%] lg:flex-[0_0_25%] px-2 sm:px-3"
                >
                  <CategoryCard item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-1.5 transition-all duration-300 rounded-full ${index === selectedIndex ? "w-8 bg-black" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
