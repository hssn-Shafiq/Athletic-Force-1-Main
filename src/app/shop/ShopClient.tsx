
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { PublicProduct, CollectionHierarchy } from "@/lib/api/types";
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, ChevronLeft, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { mapPublicProductToCard } from "@/lib/products/mapPublicProductToCard";
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
  const [selectedParentSlug, setSelectedParentSlug] = useState<string>("ALL");
  const [selectedSubSlug, setSelectedSubSlug] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<number>(1400);
  const [quickViewProduct, setQuickViewProduct] = useState<PublicProduct | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.sort-dropdown-container')) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  // Auto-scroll active tab into view
  useEffect(() => {
    const activeTab = document.querySelector('[data-active="true"]');
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedSubSlug]);

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
    // Filter out Team Store and then sort
    return hierarchy
      .filter(h =>
        !h.name.toLowerCase().includes("team store") &&
        !h.slug.toLowerCase().includes("team-store")
      )
      .sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
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

  const SidebarContent = () => (
    <div className="space-y-10">
      {/* Search Box - Signal Identification (Desktop Only) */}
      <div className="hidden md:block">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 italic flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          Search
        </h3>
        <div className="relative group">
          <input
            type="text"
            placeholder="Identify gear..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-5 pr-12 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black transition-all font-bold placeholder:text-slate-300 shadow-sm"
          />
          <Search className="absolute right-4 top-4.5 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
        </div>
      </div>

      {/* Price Ceiling - Resource Allocation */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 italic flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
          Pricing
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
        <div className="space-y-6">
          {targetedHierarchy.map((parent) => (
            <div key={parent.id} className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer group"
                onClick={() => toggleParent(parent.id, parent.slug)}
              >
                <span
                  className={`text-xs font-black uppercase tracking-wider transition-all ${selectedParentSlug === parent.slug ? 'text-[#ff7348]' : 'text-black group-hover:text-[#ff7348]'}`}
                >
                  {parent.name}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform text-black group-hover:text-[#ff7348] ${expandedParents.includes(parent.id) ? "rotate-180" : ""}`}
                />
              </div>
              {
                expandedParents.includes(parent.id) && (
                  <div className="space-y-3 pl-1">
                    {parent.subcategories.map(sub => (
                      <div
                        key={sub.id}
                        onClick={() => handleCollectionSelect(parent.slug, sub.slug)}
                        className="flex items-center justify-between cursor-pointer group/item"
                      >
                        <span className={`text-[12px] font-bold transition-all ${selectedSubSlug === sub.slug ? "text-[#ff7348] translate-x-1" : "text-slate-600 group-hover/item:text-[#ff7348] group-hover/item:translate-x-1"}`}>
                          {sub.name} <span className="text-[9px] font-bold opacity-40 ml-1">({sub.productCount || 0})</span>
                        </span>
                        <div className={`w-4 h-4 rounded-sm border-2 border-slate-200 flex items-center justify-center transition-all ${selectedSubSlug === sub.slug ? "bg-[var(--color-accent)] border-[#FF7348] shadow-lg shadow-[#FF7348]/20" : "border-slate-100 bg-white"}`}>
                          {selectedSubSlug === sub.slug && (
                            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          ))}
        </div>
      </div>

      {/* Reset Control */}
      <button
        onClick={() => { setPriceRange(1400); setSearchQuery(""); setSelectedSubSlug("ALL"); setIsSidebarOpen(false); }}
        className="w-full py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all group italic cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <main className="font-sans bg-[var(--color-page-background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">

        {/* Hero Section */}
        <div className="relative w-full h-[350px] rounded-[40px] mb-12 flex items-center justify-center bg-black overflow-hidden">
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
            <h1 className="text-[50px] md:text-[72px] font-black text-white tracking-tighter italic uppercase leading-none drop-shadow-2xl">
              The Armory
            </h1>
            <p className="text-slate-300 text-sm font-medium tracking-tight mt-2 italic uppercase tracking-widest">Equipping the Elite Force</p>
          </div>
        </div>

        {/* Main Layout Grid - Standardized with SubCollection design */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-slate-200 bg-[var(--color-page-background)] relative rounded-3xl md:rounded-[40px] overflow-hidden mb-20">

          {/* Left Sidebar - Desktop Only */}
          <aside className="hidden md:block md:col-span-1 p-8 md:border-r border-slate-200 bg-white/40 backdrop-blur-xl">
            <SidebarContent />
          </aside>

          {/* Mobile Sidebar Drawer */}
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-0 bottom-0 w-[85%] max-w-[400px] bg-white z-[101] md:hidden p-8 overflow-y-auto shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Apply Filter</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <SidebarContent />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Right Content Area - Operational Theater */}
          <div className="md:col-span-3 bg-white min-h-[600px] md:min-h-[800px]">

            {/* Operational Status Bar - Sticky with Sort & Mobile Search */}
            <div className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
              <div className="px-4 md:px-8 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-[var(--color-accent)] rounded-full animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span className="sm:inline">Results:</span> <span className="text-black ml-1 font-sora font-black">{products.length}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Mobile Filter Trigger */}
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden h-10 px-4 bg-slate-50 text-black border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:bg-black hover:text-white"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filters</span>
                  </button>

                  <div className="relative sort-dropdown-container">
                    <button
                      onClick={() => setIsSortOpen(!isSortOpen)}
                      className="h-10 px-5 bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:bg-[var(--color-accent)] cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sort By</span>
                      <span className="sm:hidden">Sort</span>
                    </button>

                    {isSortOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                        {[
                          { value: 'newest', label: 'Newest First' },
                          { value: 'most-selling', label: 'Best Sellers' },
                          { value: 'price-low-high', label: 'Price: Low to High' },
                          { value: 'price-high-low', label: 'Price: High to Low' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setIsSortOpen(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${sortBy === option.value ? 'bg-slate-50 text-[#FF7348]' : 'text-slate-600 hover:bg-slate-50 hover:text-black'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Search Bar - Directly below filters */}
              <div className="px-4 pb-4 md:hidden">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Identify gear..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-black transition-all font-bold placeholder:text-slate-300 shadow-sm"
                  />
                  <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-300 group-focus-within:text-[#ff7348] transition-colors" />
                </div>
              </div>
            </div>

            {/* Premium Category Navigation - Enhanced Scroller */}
            <div className="px-4 md:px-8 pt-2">
              <div className="relative group/tabs mb-4">
                {/* Tactical Navigation Arrows - Hidden on small mobile if not needed, but keeping for carousel feel */}
                <button
                  onClick={() => {
                    const el = document.getElementById('category-scroller');
                    if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-xl rounded-full border border-slate-100 flex items-center justify-center opacity-0 md:group-hover/tabs:opacity-100 transition-all hover:bg-black hover:text-white shadow-xl cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('category-scroller');
                    if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-xl rounded-full border border-slate-100 flex items-center justify-center opacity-0 md:group-hover/tabs:opacity-100 transition-all hover:bg-black hover:text-white shadow-xl cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Indicators - Fades for better carousel feel */}
                <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

                <div
                  id="category-scroller"
                  className="overflow-x-auto scrollbar-hide scroll-smooth py-4 px-2"
                >
                  <div className="flex flex-nowrap items-center gap-2 md:gap-3 px-4 md:px-12">
                    <button
                      onClick={() => setSelectedSubSlug("ALL")}
                      data-active={selectedSubSlug === "ALL"}
                      className="relative px-8 py-3 rounded-full text-[11px] font-black uppercase italic tracking-[0.1em] transition-all whitespace-nowrap group overflow-hidden active:scale-95 flex items-center justify-center min-w-[100px]"
                    >
                      {/* Rainbow Border Container */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-[#8a2be2] via-[#ff7348] to-[#00b2ff] transition-opacity duration-300 ${selectedSubSlug === "ALL" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                      {/* Inner White Core */}
                      <div className="absolute inset-[1.5px] rounded-full bg-white" />
                      {/* Gray Border for Inactive */}
                      {selectedSubSlug !== "ALL" && (
                        <div className="absolute inset-0 rounded-full border border-slate-200 group-hover:border-transparent transition-colors" />
                      )}
                      <span className="relative z-10 text-black">ALL</span>
                    </button>

                    {activeParent?.subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handleCollectionSelect(selectedParentSlug, sub.slug)}
                        data-active={selectedSubSlug === sub.slug}
                        className="relative px-8 py-3 rounded-full text-[11px] font-black uppercase italic tracking-[0.1em] transition-all whitespace-nowrap group overflow-hidden active:scale-95 flex items-center justify-center min-w-[140px]"
                      >
                        {/* Rainbow Border Container */}
                        <div className={`absolute inset-0 bg-gradient-to-r from-[#8a2be2] via-[#ff7348] to-[#00b2ff] transition-opacity duration-300 ${selectedSubSlug === sub.slug ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                        {/* Inner White Core */}
                        <div className="absolute inset-[1.5px] rounded-full bg-white" />
                        {/* Gray Border for Inactive */}
                        {selectedSubSlug !== sub.slug && (
                          <div className="absolute inset-0 rounded-full border border-slate-200 group-hover:border-transparent transition-colors" />
                        )}
                        <span className="relative z-10 text-black">{sub.name}</span>
                      </button>
                    ))}
                    {/* Tactical Spacer - Ensures last tab isn't hidden by chevron */}
                    <div className="w-12 md:w-20 shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Grid Deployment */}
            <div className="p-8 pt-4">
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
                    onClick={() => { setPriceRange(1400); setSearchQuery(""); setSelectedSubSlug("ALL"); }}
                    className="px-12 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-orange-600 transition-all shadow-xl shadow-black/10 active:scale-95"
                  >
                    Reset Operational Area
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p: any) => {
                    const mappedProduct = mapPublicProductToCard(p);
                    return (
                      <ProductCard
                        key={mappedProduct.id}
                        product={mappedProduct}
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
      </div >

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct as any}
          isOpen={true}
          onClose={handleCloseQuickView}
        />
      )
      }
    </main >
  );
}
