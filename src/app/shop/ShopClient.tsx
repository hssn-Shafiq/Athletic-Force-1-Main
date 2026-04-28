
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { PublicProduct, CollectionHierarchy } from "@/lib/api/types";
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, Filter, X } from "lucide-react";
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
    setSelectedParentSlug(parentSlug);
    setSelectedSubSlug(subSlug);
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

        {/* Main Shop Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Tactical Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0 space-y-8">
            
            {/* Search Box */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 italic">Signal Search</h3>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Identify..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 border border-slate-100 rounded-2xl text-sm bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold"
                />
                <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 italic">Price Ceiling</h3>
              <input
                type="range"
                min="0"
                max="1400"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="mt-4 flex items-center justify-between text-[11px] font-black text-slate-900 uppercase">
                <span className="px-2 py-1 bg-slate-50 rounded-md">$0</span>
                <span className="px-2 py-1 bg-orange-500 text-white rounded-md">${priceRange}</span>
              </div>
            </div>

            {/* Targeted Collections Sidebar */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 italic">Asset Sectors</h3>
              <div className="space-y-6">
                {targetedHierarchy.map((parent) => (
                  <div key={parent.id} className="space-y-4">
                    <button 
                      onClick={() => toggleParent(parent.id, parent.slug)}
                      className="flex items-center justify-between w-full group py-1"
                    >
                      <span className={`text-sm font-black uppercase italic transition-colors ${selectedParentSlug === parent.slug ? 'text-black' : 'text-slate-400 hover:text-black'}`}>
                        {parent.name}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedParents.includes(parent.id) ? "rotate-180" : ""}`} />
                    </button>
                    
                    {expandedParents.includes(parent.id) && (
                      <div className="space-y-3 pl-1">
                        {parent.subcategories.map(sub => (
                          <div 
                            key={sub.id} 
                            onClick={() => handleCollectionSelect(parent.slug, sub.slug)}
                            className="flex items-center justify-between cursor-pointer group"
                          >
                            <span className={`text-[12px] font-bold transition-all ${selectedSubSlug === sub.slug ? "text-slate-900" : "text-slate-400 group-hover:text-black"}`}>
                              {sub.name} <span className="text-[10px] font-bold opacity-60 ml-1">({sub.productCount || 0})</span>
                            </span>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedSubSlug === sub.slug ? "bg-[#FF7348] border-[#FF7348] shadow-lg shadow-[#FF7348]/20" : "border-slate-100 bg-slate-50"}`}>
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
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            
            {/* Top Tabs Grid */}
            <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedSubSlug("ALL")}
                  className={`px-8 py-3 rounded-full text-[10px] font-black uppercase italic tracking-widest transition-all ${
                    selectedSubSlug === "ALL" 
                      ? "bg-white text-black border-2 border-black shadow-xl shadow-black/5" 
                      : "bg-slate-200/50 text-slate-400 hover:bg-slate-200 hover:text-black"
                  }`}
                >
                  All {activeParent?.name || ""}
                </button>
                {activeParent?.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubSlug(sub.slug)}
                    className={`px-8 py-3 rounded-full text-[10px] font-black uppercase italic tracking-widest transition-all ${
                      selectedSubSlug === sub.slug 
                        ? "bg-white text-black border-2 border-black shadow-xl shadow-black/5 scale-105" 
                        : "bg-slate-200/50 text-slate-400 hover:bg-slate-200 hover:text-black"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Control Row */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-1 h-4 bg-orange-600" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Units Identified: <span className="text-black ml-1 font-sora">{products.length}</span>
                 </p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Sort Matrix</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-12 pl-6 pr-12 bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest outline-none hover:bg-slate-900 transition-all cursor-pointer shadow-xl shadow-black/20"
                >
                  <option value="newest">Recent Intel</option>
                  <option value="most-selling">Top Sellers</option>
                  <option value="price-low-high">Price: Low-High</option>
                  <option value="price-high-low">Price: High-Low</option>
                </select>
              </div>
            </div>

            {/* Product Grid Area */}
            {searchQuery && (
              <div className="mb-10 p-6 bg-orange-50 border border-orange-100 rounded-[32px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Search className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">Signal Match</p>
                    <h2 className="text-sm font-black italic uppercase text-slate-900 font-sora">Results for: <span className="text-orange-600">"{searchQuery}"</span></h2>
                  </div>
                </div>
                <button 
                  onClick={() => {setSearchQuery(""); router.push('/shop', { scroll: false });}}
                  className="px-5 py-2 bg-white border border-orange-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
                >
                  Clear Signal <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isLoading ? (
              <ShopSkeleton />
            ) : products.length === 0 ? (
              <div className="text-center py-32 bg-slate-50 rounded-[64px] border-2 border-dashed border-slate-200">
                <Filter className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                <h3 className="text-xl font-black italic uppercase text-slate-900 mb-2 font-sora">No Assets Detected</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium mb-8">Try adjusting your filters or mission parameters.</p>
                <button 
                  onClick={() => {setPriceRange(1400); setSelectedSubSlug("ALL"); setSearchQuery("");}}
                  className="px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
                >
                  Reset Gear Matrix
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((p: any) => {
                  const mappedProduct = {
                    ...p,
                    id: p.id || p._id,
                    name: p.name,
                    title: p.name,
                    image: p.mainImageUrl,
                    price: p.salePrice || p.basePrice,
                    originalPrice: p.regularPrice || p.basePrice,
                    category: p.collections?.[0]?.name || "Tactical Gear",
                    rating: p.rating || 4.8,
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
