
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PublicProduct, CollectionHierarchy } from "@/lib/api/types";
import { Search, ChevronDown, Home, ChevronRight, SlidersHorizontal, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { ProductCard } from "@/components/layout/ProductCard";

const QuickViewModal = dynamic(() => import("@/components/layout/QuickViewModal").then(mod => mod.QuickViewModal), {
  ssr: false
});
import { getExploreProductsApi } from "@/lib/api/publicProducts";
import { getCollectionHierarchyApi } from "@/lib/api/publicCollections";
import { mapPublicProductToCard } from "@/lib/products/mapPublicProductToCard";
import { ShopSkeleton } from "@/app/shop/components/ShopSkeleton";

export default function SubCollectionClient() {
  const params = useParams();
  const parentSlug = params.categoryId as string;
  const subSlug = params.subCategoryId as string;

  // --- State Command Center ---
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [hierarchy, setHierarchy] = useState<CollectionHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<number>(1400);
  const [quickViewProduct, setQuickViewProduct] = useState<PublicProduct | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const [selectedSubSlug, setSelectedSubSlug] = useState<string>(subSlug);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

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

  // --- Breadcrumb & Hero Intel ---
  const parentData = useMemo(() => hierarchy.find(p => p.slug === parentSlug), [hierarchy, parentSlug]);
  const subData = useMemo(() => parentData?.subcategories.find(s => s.slug === (selectedSubSlug === "ALL" ? "" : selectedSubSlug)), [parentData, selectedSubSlug]);

  // --- Tactical Data Fetching ---
  const fetchSubCollectionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productRes, hierarchyRes] = await Promise.all([
        getExploreProductsApi({
          collection: selectedSubSlug === "ALL" ? parentSlug : selectedSubSlug,
          search: searchQuery || undefined,
          maxPrice: priceRange,
          sortBy: sortBy,
        }),
        getCollectionHierarchyApi()
      ]);

      if (productRes.ok) setProducts(productRes.items as any);
      if (hierarchyRes.ok && hierarchyRes.hierarchy) {
        setHierarchy(hierarchyRes.hierarchy);
        // Expand the current parent by default
        const currentParent = hierarchyRes.hierarchy.find(p => p.slug === parentSlug);
        if (currentParent) setExpandedParents([currentParent.id]);
      }
    } catch (err) {
      console.error("Tactical deployment failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [subSlug, searchQuery, priceRange, sortBy, parentSlug]);

  useEffect(() => {
    fetchSubCollectionData();
  }, [fetchSubCollectionData]);

  // --- UI Logic ---
  const toggleParent = (id: string) => {
    setExpandedParents(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCloseQuickView = () => setQuickViewProduct(null);

  const SidebarContent = () => (
    <div className="space-y-10">
      {/* Search Box - Desktop Only */}
      <div className="hidden md:block">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 italic flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          Search
        </h3>
        <div className="relative group">
          <input
            type="text"
            placeholder="Search gear..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-5 pr-12 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black transition-all font-bold placeholder:text-slate-300 shadow-sm"
          />
          <Search className="absolute right-4 top-4.5 w-5 h-5 text-slate-300 group-focus-within:text-[#ff7348] transition-colors" />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 italic flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
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

      {/* Navigation Hierarchy */}
      <div className="space-y-6">
        <div className="space-y-6">
          {hierarchy.map((parent) => (
            <div key={parent.id} className="space-y-4">
              <div className="flex items-center justify-between w-full group cursor-pointer" onClick={() => toggleParent(parent.id)}>
                <span className={`text-xs font-black uppercase tracking-wider transition-all ${parent.slug === parentSlug ? 'text-[#ff7348]' : 'text-black group-hover:text-[#ff7348]'}`}>
                  {parent.name}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expandedParents.includes(parent.id) ? "rotate-180" : "text-slate-300"} group-hover:text-[#ff7348]`}
                />
              </div>

              {expandedParents.includes(parent.id) && (
                <div className="space-y-3 pl-1">
                  {parent.subcategories.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        if (sub.slug === selectedSubSlug) {
                          setSelectedSubSlug("ALL");
                        } else {
                          router.push(`/collections/${parent.slug}/${sub.slug}`, { scroll: false });
                          setIsSidebarOpen(false);
                        }
                      }}
                      className="flex items-center justify-between cursor-pointer group/item py-0.5"
                    >
                      <span className={`text-[12px] font-bold transition-all ${sub.slug === selectedSubSlug ? "text-[#ff7348] translate-x-1" : "text-slate-600 group-hover/item:text-[#ff7348] group-hover/item:translate-x-1"}`}>
                        {sub.name} <span className="text-[9px] font-bold opacity-40 ml-1">({sub.productCount || 0})</span>
                      </span>
                      <div className={`w-4 h-4 rounded-sm border-2 border-slate-200 flex items-center justify-center transition-all ${sub.slug === selectedSubSlug ? "bg-[var(--color-accent)] border-[#FF7348] shadow-lg shadow-[#FF7348]/20" : "border-slate-100 bg-white"}`}>
                        {sub.slug === selectedSubSlug && (
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
        onClick={() => { setPriceRange(1400); setSearchQuery(""); setIsSidebarOpen(false); }}
        className="w-full py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all group italic cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <main className="font-sans bg-[var(--color-page-background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-3 pb-8">

        {/* Elite Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link href="/" className="hover:text-black transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" /> HOME
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop" className="hover:text-black transition-colors">SHOP</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/collections/${parentSlug}`} className="hover:text-black transition-colors">{parentData?.name || parentSlug}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-black font-bold">{selectedSubSlug === "ALL" ? `All ${parentData?.name || ""}` : (subData?.name || subSlug.replace(/-/g, ' '))}</span>
        </nav>

        {/* Hero Banner - Sub Collection */}
        <div className="relative w-full h-[220px] md:h-[380px] rounded-[40px] mb-8 flex items-center justify-center bg-black overflow-hidden group">
          <Image
            src="/shop-hero.png" // Reusing the elite shop hero
            alt={subData?.name || "Collection"}
            fill
            priority
            className="object-cover opacity-60"
            style={{ objectPosition: "center 22%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="relative text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-2 italic">Specialized Collection</p>
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {selectedSubSlug === "ALL" ? `All ${parentData?.name || ""}` : (subData?.name || subSlug.replace(/-/g, ' '))}
            </h1>
          </div>
        </div>

        {/* Main Layout Grid - Standardized Elite Design */}
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

          {/* Products Section */}
          <div className="md:col-span-3 bg-white min-h-[600px] md:min-h-[800px]">
            {/* Operational Status Bar - Sticky with Sort & Mobile Search */}
            <div className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
              <div className="px-4 md:px-8 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-[var(--color-accent)] rounded-full animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Results: <span className="text-black ml-1 font-sora font-black">{products.length}</span>
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
                    placeholder="Search gear..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-black transition-all font-bold placeholder:text-slate-300 shadow-sm"
                  />
                  <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-300 group-focus-within:text-[#ff7348] transition-colors" />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-6">
              {isLoading ? (
                <ShopSkeleton />
              ) : products.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-slate-900">Zero Gear Detected</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium mb-8">Try adjusting your filters or mission parameters.</p>
                  <button
                    onClick={() => { setPriceRange(1400); setSearchQuery(""); }}
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
