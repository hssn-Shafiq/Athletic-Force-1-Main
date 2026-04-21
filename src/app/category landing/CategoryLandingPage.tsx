
"use client";
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight, ArrowRight, Zap, Target, Trophy } from 'lucide-react';
import { getCategoryLandingData } from '../../lib/categoryLandingData';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Custom Uniforms': <Trophy className="w-8 h-8 text-orange-600" />,
  Accessories: <Zap className="w-8 h-8 text-orange-600" />,
  Merchandise: <Target className="w-8 h-8 text-orange-600" />,
  'Team Store': <Zap className="w-8 h-8 text-orange-600" />,
};

interface CategoryLandingPageProps {
  categoryId: string;
}

export const CategoryLandingPage: React.FC<CategoryLandingPageProps> = ({ categoryId }) => {
  const { currentCategory, categoryData } = getCategoryLandingData(categoryId);


  if (!categoryData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-24">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Category Not Found</h1>
          <Link href="/" className="inline-block bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero Section */}
      <section className="relative min-h-[72vh] md:min-h-[78vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <img 
            src={categoryData.bgImage} 
            alt={currentCategory} 
            className="w-full h-full object-cover opacity-50 blur-[2px]"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-white" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-20 pb-28 md:pt-24 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="p-6 bg-white rounded-3xl shadow-2xl -rotate-3">
              {CATEGORY_ICONS[currentCategory]}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.95] md:leading-[0.9]">
              {currentCategory}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto">
              {categoryData.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sub-categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 md:-mt-14 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categoryData.subCategories.map((sub, idx) => (
            <motion.div
              key={sub}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative bg-white border border-slate-100 rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden shadow-sm"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] flex items-center justify-center group-hover:bg-orange-600 transition-colors duration-500">
                <ChevronRight className="w-8 h-8 text-slate-200 group-hover:text-white transition-colors" />
              </div>
              
              <div className="space-y-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-orange-600 italic">Sub-Collection</div>
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-orange-600 transition-colors">
                  {sub}
                </h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Explore our premium {sub.toLowerCase()} gear optimized for high-intensity performance.
                </p>
                <div className="pt-6 flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-900">
                  <span>Explore Collection</span>
                  <div className="w-8 h-0.5 bg-slate-200 group-hover:w-16 group-hover:bg-black transition-all" />
                </div>
              </div>

              {/* Decorative Number */}
              <div className="absolute -bottom-5 right-8 text-8xl font-black text-slate-50 italic pointer-events-none group-hover:text-orange-50 transition-colors">
                {(idx + 1).toString().padStart(2, '0')}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 md:mt-32">
        <div className="bg-black rounded-[28px] sm:rounded-[40px] lg:rounded-[60px] p-6 sm:p-10 lg:p-24 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 group">
          {/* Animated Background Gradients */}
          <div className="absolute top-[-20%] right-[-10%] w-125 h-125 bg-orange-600/20 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute bottom-[-20%] left-[-10%] w-125 h-125 bg-red-600/10 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="relative z-10 max-w-xl text-center lg:text-left space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-tight">
              Ready to Gear Up Your Squad?
            </h2>
            <p className="text-slate-400 text-base sm:text-lg font-medium italic">
              Special bulk pricing and rapid turnaround for team orders. Let&apos;s make your vision a reality.
            </p>
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 sm:gap-4 bg-white text-black px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-2xl sm:rounded-3xl font-black uppercase italic tracking-tighter text-base sm:text-lg lg:text-xl hover:scale-105 transition-all shadow-xl">
              <span>Contact Agent</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 sm:gap-4 border-2 border-white/20 text-white px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-2xl sm:rounded-3xl font-black uppercase italic tracking-tighter text-base sm:text-lg lg:text-xl hover:bg-white/10 transition-all">
              <span>Bulk Order</span>
              <Target className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
