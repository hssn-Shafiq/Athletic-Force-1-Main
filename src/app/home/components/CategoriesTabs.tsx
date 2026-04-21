
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
    image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png",
    category: "Merchandise"
  },
  {
    id: '2',
    title: "Helmet",
    image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png",
    category: "Accessories"
  },
  {
    id: '3',
    title: "Visor",
    image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png",
    category: "Accessories"
  },
  {
    id: '4',
    title: "Shoes",
    image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png",
    category: "Team Store"
  },
  {
    id: '5',
    title: "Jersey",
    image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png",
    category: "Merchandise"
  },
  {
    id: '6',
    title: "Gloves",
    image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png",
    category: "Accessories"
  }
];

const TABS = ["ALL", "Merchandise", "Accessories", "Team Store"];

const CategoryCard: React.FC<{ item: CategoryItem }> = ({ item }) => {
  return (
    <div className="relative group cursor-pointer h-full">
      {/* Hover Gradient Border Container */}
      <div className="absolute -inset-[2px] rounded-[30px] sm:rounded-[40px] bg-transparent group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:via-red-500 group-hover:to-yellow-400 transition-all duration-300 -z-10" />

      <div className="relative h-full bg-[#F9F9F9] rounded-[28px] sm:rounded-[38px] overflow-hidden flex flex-col p-4 sm:p-6 border border-slate-100 group-hover:border-transparent transition-colors">
        {/* Grid Background Pattern - Subtled down as requested */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{
               backgroundImage: `linear-gradient(#ff4d00 1px, transparent 1px), linear-gradient(90deg, #ff4d00 1px, transparent 1px)`,
               backgroundSize: '20px 20px'
             }}
        />

        {/* Product Image */}
        <div className="relative flex-1 flex items-center justify-center py-5 sm:py-8">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-auto max-h-[200px] sm:max-h-[240px] object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Label Bar */}
        <div className="relative z-10 bg-white rounded-2xl py-2.5 sm:py-3 px-4 sm:px-5 flex items-center justify-between shadow-sm border border-slate-50">
          <span className="font-black text-xs sm:text-sm uppercase tracking-tight text-slate-900">{item.title}</span>
          <div className="bg-orange-600 text-white rounded-lg p-1.5 group-hover:scale-110 transition-transform">
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
    <section className="w-full py-8 sm:py-12 space-y-8 sm:space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Categories
          </h2>
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-3">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm ${
                  activeTab === tab 
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
                  className="embla__slide flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] px-2 sm:px-3"
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
              className={`h-1.5 transition-all duration-300 rounded-full ${
                index === selectedIndex ? "w-8 bg-black" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
