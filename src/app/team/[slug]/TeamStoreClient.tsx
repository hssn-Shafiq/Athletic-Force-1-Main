"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ChevronDown,
  Zap,
  Target
} from 'lucide-react';
import { ProductCard } from '@/components/layout/ProductCard';
import { PublicProduct } from '@/lib/api/types';
import { getExploreProductsApi } from '@/lib/api/publicProducts';
import { mapPublicProductToCard } from '@/lib/products/mapPublicProductToCard';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from "next/dynamic";
import { ShopSkeleton } from '@/app/shop/components/ShopSkeleton';

const QuickViewModal = dynamic(() => import("@/components/layout/QuickViewModal").then(mod => mod.QuickViewModal), {
  ssr: false
});

interface TeamStoreClientProps {
  slug: string;
}

export default function TeamStoreClient({ slug }: TeamStoreClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [storeName, setStoreName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch public vendor stores to find the exact name
        const { getPublicVendorStoresApi } = await import('@/lib/api/publicVendorStores');
        const storesRes = await getPublicVendorStoresApi();
        
        let foundName = slug.replace(/-/g, ' ').toUpperCase();
        if (storesRes.ok && storesRes.stores) {
          const store = storesRes.stores.find(s => s.slug === slug);
          if (store) foundName = store.storeName;
        }
        setStoreName(foundName);

        // Fetch products for this collection slug
        const res = await getExploreProductsApi({
          collection: slug,
          sortBy: sortBy
        });
        if (res.ok) {
          setProducts(res.items as any[]);
        }
      } catch (err) {
        console.error('Failed to load team store:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [slug, sortBy]);

  const filteredProducts = useMemo(() => {
    let results = [...products];

    if (searchQuery) {
      results = results.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.collections?.[0]?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return results;
  }, [searchQuery, products]);

  return (
    <div className="space-y-16 pb-20 pt-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[var(--color-page-background)] min-h-screen font-sans">
      
      {/* Hero Section */}
      <section className="relative rounded-[60px] overflow-hidden bg-black py-24 md:py-16">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[150%] bg-[#FF7348] opacity-10 blur-[120px] rounded-full rotate-12 animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[100%] bg-blue-600 opacity-[0.05] blur-[100px] rounded-full -rotate-12" />
        </div>
        
        <div className="relative flex flex-col items-center justify-center z-10 px-8 md:px-16 space-y-6 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-white/5 border border-white/10 w-fit px-5 py-2.5 rounded-full mx-auto md:mx-0"
          >
            <Zap className="w-4 h-4 text-[#FF7348]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Operational Gear Ready</span>
          </motion.div>
          
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-7xl md:text-8xl font-black italic uppercase tracking-tighter text-center text-white leading-[0.9] drop-shadow-2xl"
            >
              {storeName || 'TEAM STORE'} <br className="hidden md:block" />
              <span className="text-[#FF7348] text-3xl sm:text-5xl md:text-6xl tracking-widest mt-2 block">STORE FRONT</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 font-medium italic text-sm sm:text-lg md:text-xl max-w-xl mx-auto md:mx-0 mt-4 text-center"
            >
              The definitive hardware layer for high-velocity elite performance. Tactical precision in every fiber.
            </motion.p>
          </div>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-xl space-y-6  ">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH ASSETS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-transparent focus:border-slate-100 focus:bg-white rounded-3xl py-5 pl-16 pr-8 outline-none text-xs font-black italic tracking-widest placeholder:text-slate-300 transition-all uppercase"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Sort */}
            <div className="relative w-full lg:min-w-[250px]">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-12 pr-10 outline-none text-[10px] font-black uppercase tracking-widest italic appearance-none cursor-pointer focus:border-[#FF7348] transition-colors"
              >
                <option value="newest">Featured / Newest</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="most-selling">Best Sellers</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Results Count & Current Active Filter Display */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
          Operational Inventory Found: <span className="text-black">{filteredProducts.length} Items</span>
        </p>
        {(searchQuery) && (
          <button 
            onClick={() => { setSearchQuery(''); }}
            className="text-[9px] font-black uppercase tracking-widest text-[#FF7348] hover:underline italic"
          >
            Reset Operations
          </button>
        )}
      </div>

      {/* Product Grid */}
      {isLoading ? (
         <div className="mt-8"><ShopSkeleton /></div>
      ) : filteredProducts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-32 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-10 h-10 text-slate-200" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Zero Matches in Sector</h3>
            <p className="text-slate-400 font-medium italic text-sm">No assets match your current search parameters. Diversify your query.</p>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); }}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-[11px] hover:bg-orange-600 transition-all cursor-pointer"
          >
            Clear Data Filter
          </button>
        </motion.div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
              const mappedProduct = mapPublicProductToCard(product);
              return (
                <motion.div
                  layout
                  key={mappedProduct.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <ProductCard 
                    product={mappedProduct} 
                    onOpenQuickView={() => setQuickViewProduct(mappedProduct as any)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Newsletter Anchor */}
      <section className="bg-slate-50 rounded-[50px] p-8 sm:p-12 md:p-20 text-center space-y-8 mt-24">
         <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF7348] italic">Operational Readiness</h4>
         <h2 className="text-3xl sm:text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
           DON'T MISS THE <br /> NEXT HARDWARE DROP
         </h2>
         <p className="text-slate-400 font-medium italic text-sm sm:text-lg max-w-xl mx-auto">
           The elite intelligence for professionals. Early access, tactical updates, and performance insights.
         </p>
         <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
           <input 
             type="email" 
             placeholder="EMAIL CONSOLE" 
             className="flex-1 bg-white border border-slate-200 rounded-2xl py-4 px-6 text-[10px] font-black italic outline-none focus:border-[#FF7348] transition-all w-full"
           />
           <button className="bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase italic tracking-widest hover:bg-orange-600 transition-all cursor-pointer">
             DEPLOY
           </button>
         </div>
      </section>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          isOpen={true}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
