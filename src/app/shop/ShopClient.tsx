
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { PublicProduct, CollectionHierarchy } from "@/lib/api/types";
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, ChevronLeft, Filter, X } from "lucide-react";
import dynamic from "next/dynamic";
import { ProductCard } from "@/components/layout/ProductCard";

const QuickViewModal = dynamic(() => import("@/components/layout/QuickViewModal").then(mod => mod.QuickViewModal), {
  ssr: false
});

const ShopFeaturesFaqSection = dynamic(() => import("./components/ShopFeaturesFaqSection").then(mod => mod.ShopFeaturesFaqSection), {
  ssr: true,
  loading: () => <div className="h-40 animate-pulse bg-slate-50 rounded-[40px] mt-12" />
});

const ShopRecentUpdatesSection = dynamic(() => import("./components/ShopRecentUpdatesSection").then(mod => mod.ShopRecentUpdatesSection), {
  ssr: true,
  loading: () => <div className="h-60 animate-pulse bg-slate-50 rounded-[40px] mt-12" />
});
import { getExploreProductsApi } from "@/lib/api/publicProducts";
import { getCollectionHierarchyApi } from "@/lib/api/publicCollections";
import { ShopSkeleton } from "./components/ShopSkeleton";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LockerRoomSection } from "../home/components/LockerRoomSection";

export default function ShopClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  // --- State Command Center ---
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [hierarchy, setHierarchy] = useState<CollectionHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedParentSlug, setSelectedParentSlug] = useState<string>("merchandise"); // Default from user requirement
  const [selectedSubSlug, setSelectedSubSlug] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<number>(1400);
  const [quickViewProduct, setQuickViewProduct] = useState<PublicProduct | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  // Sync state with URL search if it changes
  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  // --- Tactical Data Fetching ---
  const fetchShopData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productRes, hierarchyRes] = await Promise.all([
        getExploreProductsApi({
          collection: selectedSubSlug === "ALL" ? (selectedParentSlug === "ALL" ? undefined : selectedParentSlug) : selectedSubSlug,
          search: searchQuery || undefined,
          maxPrice: priceRange,
          sortBy: (selectedSubSlug === "ALL" && !searchQuery) ? 'most-selling' : sortBy,
        }),
        getCollectionHierarchyApi()
      ]);

      if (productRes.ok) setProducts(productRes.items as any);
      if (hierarchyRes.ok && hierarchyRes.hierarchy) {
        setHierarchy(hierarchyRes.hierarchy);
        // Only expand the first targeted parent by default (Merchandise Priority)
        if (expandedParents.length === 0) {
          const merchandise = hierarchyRes.hierarchy.find(p => 
            p.slug.toLowerCase().includes("merchandise") || p.name.toLowerCase().includes("merchandise")
          );
          if (merchandise) setExpandedParents([merchandise.id]);
          else if (hierarchyRes.hierarchy.length > 0) setExpandedParents([hierarchyRes.hierarchy[0].id]);
        }
      }
    } catch (err) {
      console.error("Tactical deployment failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedParentSlug, selectedSubSlug, searchQuery, priceRange, sortBy]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // --- UI Logic ---
  const handleCollectionSelect = (parentSlug: string, subSlug: string = "ALL") => {
    if (selectedSubSlug === subSlug) {
      setSelectedSubSlug("ALL");
    } else {
      setSelectedParentSlug(parentSlug);
      setSelectedSubSlug(subSlug);
    }
  };

  const toggleParent = (id: string, slug: string) => {
    setExpandedParents(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCloseQuickView = () => setQuickViewProduct(null);

  // Filter hierarchy for specific parents with robust matching & sorting
  const targetedHierarchy = useMemo(() => {
    // Handling potential typos in DB slugs like 'custom-unifomrs'
    const targetKeywords = ["merchandise", "accessories", "unifom", "unform"];
    
    const filtered = hierarchy.filter(h => {
      const slugMatch = targetKeywords.some(kw => h.slug.toLowerCase().includes(kw));
      const nameMatch = targetKeywords.some(kw => h.name.toLowerCase().includes(kw));
      return slugMatch || nameMatch;
    });

    // Sort to ensure Merchandise is on top
    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName.includes("merchandise")) return -1;
      if (bName.includes("merchandise")) return 1;
      if (aName.includes("accessories")) return -1;
      if (bName.includes("accessories")) return 1;
      return 0;
    });
  }, [hierarchy]);

  const activeParent = useMemo(() => {
    return hierarchy.find(h => h.slug === selectedParentSlug) || targetedHierarchy[0];
  }, [hierarchy, selectedParentSlug, targetedHierarchy]);

  return (
    <main className="font-sans bg-[#f3f3f3] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        
        {/* Hero Section */}
        <div className="relative w-full h-[350px] rounded-[40px] mb-12 flex items-center justify-center bg-black overflow-hidden shadow-2xl">
          <Image
            src="/shop-hero.png"
            alt="The Armory"
            fill
            priority
            className="object-cover opacity-60"
            style={{ objectPosition: "center 22%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="relative text-center z-10">
             <h1 className="text-[56px] md:text-[72px] font-black text-white tracking-tighter italic uppercase leading-none drop-shadow-2xl">
                The Armory
             </h1>
             <p className="text-slate-300 text-sm font-medium tracking-tight mt-2 italic uppercase tracking-widest">Equipping the Elite Force</p>
          </div>
        </div>

        {/* Main Layout Grid - Standardized with SubCollection design */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-slate-200 bg-[#f3f3f3] relative rounded-[40px] overflow-hidden shadow-xl mb-20">
          
          {/* Left Sidebar - Tactical Intelligence */}
          <aside className="md:col-span-1 p-8 md:border-r border-slate-200 bg-white/40 backdrop-blur-xl">
            <div className="space-y-10">
              
              {/* Search Box - Signal Identification */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Signal Search
                </h3>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Identify gear..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-5 pr-12 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold placeholder:text-slate-300 shadow-sm"
                  />
                  <Search className="absolute right-4 top-4.5 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                </div>
              </div>

              {/* Price Ceiling - Resource Allocation */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  Price Ceiling
                </h3>
                <div className="px-1">
                  <input
                    type="range"
                    min="0"
                    max="1400"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">$0</span>
                    <span className="px-3 py-1 bg-black text-white text-[10px] font-black rounded-lg italic tracking-widest shadow-lg shadow-black/20">
                      MAX ${priceRange}
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset Sectors - Collection Hierarchy */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Asset Sectors
                </h3>
                <div className="space-y-6">
                  {targetedHierarchy.map((parent) => (
                    <div key={parent.id} className="space-y-4">
                      <button 
                        onClick={() => toggleParent(parent.id, parent.slug)}
                        className="flex items-center justify-between w-full group py-1"
                      >
                        <span className={`text-xs font-black uppercase italic tracking-wider transition-all ${selectedParentSlug === parent.slug ? 'text-black' : 'text-slate-400 hover:text-black'}`}>
                          {parent.name}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform text-slate-300 group-hover:text-black ${expandedParents.includes(parent.id) ? "rotate-180 text-black" : ""}`} />
                      </button>
                      
                      {expandedParents.includes(parent.id) && (
                        <div className="space-y-3 pl-1">
                          {parent.subcategories.map(sub => (
                            <div 
                              key={sub.id} 
                              onClick={() => handleCollectionSelect(parent.slug, sub.slug)}
                              className="flex items-center justify-between cursor-pointer group/item"
                            >
                              <span className={`text-[11px] font-bold transition-all ${selectedSubSlug === sub.slug ? "text-slate-900 translate-x-1" : "text-slate-400 group-hover/item:text-black group-hover/item:translate-x-1"}`}>
                                {sub.name} <span className="text-[9px] font-bold opacity-40 ml-1">({sub.productCount || 0})</span>
                              </span>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedSubSlug === sub.slug ? "bg-[#FF7348] border-[#FF7348] shadow-lg shadow-[#FF7348]/20" : "border-slate-100 bg-white"}`}>
                                {selectedSubSlug === sub.slug && (
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Control */}
              <button 
                onClick={() => {setPriceRange(1400); setSearchQuery(""); setSelectedSubSlug("ALL");}}
                className="w-full py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all group italic"
              >
                Clear Signal
              </button>
            </div>
          </aside>

          {/* Right Content Area - Operational Theater */}
          <div className="md:col-span-3 bg-white min-h-[800px]">
            
            {/* Operational Status Bar - Sticky with Sort */}
            <div className="px-8 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-5 bg-orange-600 rounded-full animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Units Identified: <span className="text-black ml-1 font-sora font-black">{products.length}</span>
                 </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden sm:inline">Sort Matrix:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] outline-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer hover:bg-slate-100"
                >
                  <option value="newest">Newest First</option>
                  <option value="most-selling">Best Sellers</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Premium Category Navigation - Enhanced Scroller */}
            <div className="px-8 pt-8">
              <div className="relative group/tabs mb-4">
                {/* Tactical Navigation Arrows */}
                <button 
                  onClick={() => {
                    const el = document.getElementById('category-scroller');
                    if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-xl rounded-full border border-slate-100 flex items-center justify-center opacity-0 group-hover/tabs:opacity-100 transition-all hover:bg-black hover:text-white shadow-xl shadow-black/5"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => {
                    const el = document.getElementById('category-scroller');
                    if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-xl rounded-full border border-slate-100 flex items-center justify-center opacity-0 group-hover/tabs:opacity-100 transition-all hover:bg-black hover:text-white shadow-xl shadow-black/5"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Indicators */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
                
                <div 
                  id="category-scroller"
                  className="overflow-x-auto scrollbar-hide scroll-smooth py-2"
                >
                  <div className="flex flex-nowrap items-center gap-3 px-12">
                    <button
                      onClick={() => setSelectedSubSlug("ALL")}
                      className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] transition-all whitespace-nowrap shadow-sm border ${
                        selectedSubSlug === "ALL" 
                          ? "bg-black text-white border-black shadow-black/20 translate-y-[-2px]" 
                          : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:text-black"
                      }`}
                    >
                      All {activeParent?.name || ""}
                    </button>
                    {activeParent?.subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handleCollectionSelect(selectedParentSlug, sub.slug)}
                        className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] transition-all whitespace-nowrap shadow-sm border ${
                          selectedSubSlug === sub.slug 
                            ? "bg-[#FF7348] text-white border-[#FF7348] shadow-[#FF7348]/20 translate-y-[-2px]" 
                            : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:text-black"
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Grid Deployment */}
            <div className="p-8">
              {isLoading ? (
                <ShopSkeleton />
              ) : products.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-[40px] border border-slate-100 border-dashed">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Filter className="w-12 h-12 text-slate-200 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-slate-900">Zero Gear Detected</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium mb-8">Try adjusting your filters or mission parameters.</p>
                  <button 
                    onClick={() => {setPriceRange(1400); setSearchQuery(""); setSelectedSubSlug("ALL");}}
                    className="px-12 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-orange-600 transition-all shadow-xl shadow-black/10 active:scale-95"
                  >
                    Reset Operational Area
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p: any) => {
                    const mappedProduct = {
                      ...p,
                      id: p.id || p._id,
                      name: p.name,
                      title: p.name,
                      image: p.mainImageUrl,
                      price: p.salePrice || p.basePrice,
                      originalPrice: p.regularPrice || p.basePrice,
                      category: p.collections?.find((c: any) => c.parentId)?.name || p.collections?.[0]?.name || "Tactical Gear",
                      rating: p.rating || 4.9,
                      discount: p.regularPrice && p.salePrice ? `-${Math.round((1 - p.salePrice/p.regularPrice) * 100)}%` : undefined,
                      isNew: p.badgeName?.toLowerCase() === 'new'
                    };
                    return (
                      <ProductCard
                        key={mappedProduct.id}
                        product={mappedProduct as any}
                        onOpenQuickView={() => setQuickViewProduct(mappedProduct as any)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Optimization Sections */}
        <ShopFeaturesFaqSection />
        <LockerRoomSection />
      </div>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct as any}
          isOpen={true}
          onClose={handleCloseQuickView}
        />
      )}
    </main>
  );
}
