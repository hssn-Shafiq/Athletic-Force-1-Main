
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Product, CollectionHierarchy } from "@/lib/api/types";
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { ProductCard } from "@/components/layout/ProductCard";
import { QuickViewModal } from "@/components/layout/QuickViewModal";
import { ShopFeaturesFaqSection } from "./components/ShopFeaturesFaqSection";
import { ShopRecentUpdatesSection } from "./components/ShopRecentUpdatesSection";
import { getExploreProductsApi } from "@/lib/api/publicProducts";
import { getCollectionHierarchyApi } from "@/lib/api/publicCollections";
import { ShopSkeleton } from "./components/ShopSkeleton";
import Link from "next/link";

export default function ShopClient() {
  // --- State Command Center ---
  const [products, setProducts] = useState<Product[]>([]);
  const [hierarchy, setHierarchy] = useState<CollectionHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<number>(1400);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  // --- Tactical Data Fetching ---
  const fetchShopData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productRes, hierarchyRes] = await Promise.all([
        getExploreProductsApi({
          collection: selectedCategory === "ALL" ? undefined : selectedCategory,
          search: searchQuery || undefined,
          maxPrice: priceRange,
          sortBy: selectedCategory === "ALL" && !searchQuery ? 'most-selling' : sortBy,
        }),
        getCollectionHierarchyApi()
      ]);

      if (productRes.ok) setProducts(productRes.items as any);
      if (hierarchyRes.ok && hierarchyRes.hierarchy) {
        setHierarchy(hierarchyRes.hierarchy);
        if (expandedParents.length === 0 && hierarchyRes.hierarchy.length > 0) {
          setExpandedParents(hierarchyRes.hierarchy.map(p => p.id)); // Expand all by default as per original design
        }
      }
    } catch (err) {
      console.error("Tactical deployment failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, priceRange, sortBy]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // --- UI Logic ---
  const toggleParent = (id: string) => {
    setExpandedParents(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCloseQuickView = () => setQuickViewProduct(null);

  return (
    <main className="font-sans bg-[#f3f3f3] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        
        {/* Hero Section - Elite Tactical Style */}
        <div className="relative w-full h-[320px] rounded-[40px] mb-12 flex items-center justify-center bg-black overflow-hidden shadow-2xl">
          <Image
            src="/shop-hero.png" // We'll need a tactical hero image or similar aesthetic
            alt="Shop Elite Gear"
            fill
            priority
            className="object-cover opacity-70 scale-105 hover:scale-100 transition-transform duration-[2000ms]"
            style={{ objectPosition: "center 22%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
          <div className="relative text-center z-10 px-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500 rounded-full mb-6 animate-bounce shadow-lg shadow-orange-500/20">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">New Deployment Available</span>
             </div>
             <h1 className="text-[56px] md:text-[86px] font-black text-white tracking-tighter italic uppercase leading-none drop-shadow-2xl mb-4">
                The Armory
             </h1>
             <p className="text-slate-300 text-sm md:text-lg max-w-xl mx-auto font-medium tracking-tight">
                High-performance tactical gear and custom uniforms engineered for the elite. 
                Equip yourself with Athletic Force 1.
             </p>
          </div>
        </div>

        {/* Main Shop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border border-gray-200 bg-[#f3f3f3] relative rounded-[48px] overflow-hidden shadow-sm">
          
          {/* Tactical Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 p-8 bg-white/40 backdrop-blur-xl border-r border-gray-200">
            <div className="space-y-10 sticky top-10">
              
              {/* Search Box */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 italic">Search Signal</h3>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Identify gear..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-5 pr-12 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold placeholder:text-slate-300"
                  />
                  <div className="absolute right-4 top-4 w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                    <Search className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 italic">Price Ceiling</h3>
                <div className="px-1">
                  <input
                    type="range"
                    min="0"
                    max="1400"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <div className="mt-4 flex items-center justify-between text-[11px] font-black text-slate-900 uppercase tracking-widest">
                    <span className="px-2 py-1 bg-slate-100 rounded-md">$0</span>
                    <span className="px-2 py-1 bg-orange-500 text-white rounded-md">${priceRange}</span>
                  </div>
                </div>
              </div>

              {/* Collections Tree */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 italic">Gear Sectors</h3>
                <div className="space-y-4">
                  {/* Global Selector */}
                  <button 
                    onClick={() => setSelectedCategory("ALL")}
                    className={`w-full flex items-center justify-between group transition-all p-3 rounded-2xl ${selectedCategory === "ALL" ? "bg-black text-white shadow-xl shadow-black/20" : "hover:bg-white/60 text-slate-400 hover:text-black"}`}
                  >
                    <span className="text-xs font-black uppercase italic tracking-widest">All Assets</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedCategory === "ALL" ? "rotate-90" : "group-hover:translate-x-1"}`} />
                  </button>

                  {/* Hierarchical Collections */}
                  {hierarchy.map((parent) => (
                    <div key={parent.id} className="space-y-3">
                      <button 
                        onClick={() => toggleParent(parent.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${parent.slug === selectedCategory ? "bg-black text-white" : "hover:bg-white/60 text-slate-500 hover:text-black"}`}
                      >
                        <span className="text-xs font-black uppercase italic tracking-widest">{parent.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedParents.includes(parent.id) ? "rotate-180" : ""}`} />
                      </button>
                      
                      {expandedParents.includes(parent.id) && (
                        <div className="space-y-1 pl-4 animate-in slide-in-from-top-2 duration-300">
                          {parent.subcategories.map(sub => (
                            <Link
                              key={sub.id}
                              href={`/collections/${parent.slug}/${sub.slug}`}
                              className={`flex items-center justify-between p-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-white hover:translate-x-1 ${sub.slug === selectedCategory ? "text-orange-600" : "text-slate-400 hover:text-black"}`}
                            >
                              <span>{sub.name}</span>
                              <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-400">
                                {sub.productCount || 0}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Asset Grid */}
          <div className="lg:col-span-3 bg-white">
            {/* Control Bar */}
            <div className="px-8 py-6 border-b border-slate-100 flex flex-wrap justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20 gap-4">
                <div className="flex items-center gap-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Deployment Counter: <span className="text-black ml-1">{products.length} Units</span>
                    </p>
                    <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
                    <div className="hidden md:flex items-center gap-2">
                        {['direct', 'request'].map(type => (
                            <span key={type} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-50 text-slate-400 border border-slate-100">
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sort Matrix</span>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-11 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] outline-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
                    >
                        <option value="newest">Recent Intel</option>
                        <option value="most-selling">Top Sellers</option>
                        <option value="price-low-high">Price: Low to High</option>
                        <option value="price-high-low">Price: High to Low</option>
                    </select>
                </div>
            </div>

            {/* Tactical Grid */}
            <div className="p-8">
              {isLoading ? (
                <ShopSkeleton />
              ) : products.length === 0 ? (
                <div className="text-center py-32 bg-slate-50 rounded-[64px] border-2 border-dashed border-slate-200 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-black/5 ring-8 ring-slate-100">
                    <Filter className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-3">No Gear Detected</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto font-medium">Your current parameters returned no tactical results. Adjust your filters or reset the mission.</p>
                  <button 
                    onClick={() => {setPriceRange(1400); setSelectedCategory("ALL"); setSearchQuery("");}}
                    className="mt-10 px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
                  >
                    Reset Gear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {products.map((p: any) => {
                    // Mapping backend types to the refined ProductCard expected interface
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
        </div>

        {/* Feature & Social Sections */}
        <ShopFeaturesFaqSection />
        <ShopRecentUpdatesSection />
      </div>

      {/* Quick View Modal */}
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
