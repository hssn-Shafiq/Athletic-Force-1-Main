
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PublicProduct, CollectionHierarchy } from "@/lib/api/types";
import { Search, ChevronDown, Home, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { ProductCard } from "@/components/layout/ProductCard";

const QuickViewModal = dynamic(() => import("@/components/layout/QuickViewModal").then(mod => mod.QuickViewModal), {
  ssr: false
});
import { getExploreProductsApi } from "@/lib/api/publicProducts";
import { getCollectionHierarchyApi } from "@/lib/api/publicCollections";
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
  const router = useRouter();

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

  return (
    <main className="font-sans bg-[#f3f3f3] min-h-screen">
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
        <div className="relative w-full h-[220px] md:h-[380px] rounded-[40px] mb-8 flex items-center justify-center bg-black overflow-hidden shadow-2xl group">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-slate-200 bg-[#f3f3f3] relative rounded-[40px] overflow-hidden shadow-xl mb-20">
          {/* Left Sidebar - Tactical Intelligence */}
          <aside className="hidden md:block md:col-span-1 p-8 md:border-r border-slate-200 bg-white/40 backdrop-blur-xl">
            <div className="space-y-8">
              {/* Search Box */}
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search gear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Price Ceiling
                </h3>
                <input
                  type="range"
                  min="0"
                  max="1400"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>$0</span>
                  <span className="text-black">${priceRange}</span>
                </div>
              </div>

              {/* Navigation Hierarchy */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  Other Collections
                </h3>
                {hierarchy.map((parent) => (
                  <div key={parent.id} className="space-y-2">
                    <button 
                      onClick={() => toggleParent(parent.id)}
                      className="flex items-center justify-between w-full group"
                    >
                      <span className={`text-sm font-black uppercase italic transition-colors ${parent.slug === parentSlug ? 'text-black' : 'text-slate-400 hover:text-black'}`}>
                        {parent.name}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedParents.includes(parent.id) ? "rotate-180" : ""}`} />
                    </button>
                    
                    {expandedParents.includes(parent.id) && (
                      <div className="space-y-3 pl-1 mt-3">
                        {parent.subcategories.map(sub => (
                          <div
                            key={sub.id}
                            onClick={() => {
                              if (sub.slug === selectedSubSlug) {
                                setSelectedSubSlug("ALL");
                              } else {
                                router.push(`/collections/${parent.slug}/${sub.slug}`, { scroll: false });
                              }
                            }}
                            className="flex items-center justify-between cursor-pointer group/item py-0.5"
                          >
                            <span className={`text-[11px] font-bold transition-all ${sub.slug === selectedSubSlug ? "text-slate-900 translate-x-1" : "text-slate-400 group-hover/item:text-black group-hover/item:translate-x-1"}`}>
                              {sub.name} <span className="text-[9px] font-bold opacity-40 ml-1">({sub.productCount || 0})</span>
                            </span>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${sub.slug === selectedSubSlug ? "bg-[#FF7348] border-[#FF7348] shadow-lg shadow-[#FF7348]/20" : "border-slate-100 bg-white"}`}>
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
          </aside>

          {/* Products Section */}
          <div className="md:col-span-3 bg-white">
            {/* Sort Row */}
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
                    onClick={() => {setPriceRange(1400); setSearchQuery("");}}
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
