
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

export default function Shop() {
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
    const timer = setTimeout(() => {
      fetchShopData();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchShopData]);

  // --- UI Logic ---
  const toggleParent = (id: string) => {
    setExpandedParents(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const activeParentSiblings = useMemo(() => {
    if (selectedCategory === "ALL") return [];
    const parent = hierarchy.find(p => 
      p.subcategories.some(s => s.slug === selectedCategory || s.id === selectedCategory)
    );
    return parent ? parent.subcategories : [];
  }, [selectedCategory, hierarchy]);

  const handleCloseQuickView = () => setQuickViewProduct(null);

  return (
    <main className="font-sans bg-[#f3f3f3] min-h-screen">
      {/* Hero Banner - Shop All */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
        <div className="relative w-full h-[190px] md:h-[260px] rounded-[28px] mb-5 flex items-center justify-center bg-black overflow-hidden">
          <Image
            src="/shop-hero.png"
            alt="Shop hero"
            fill
            priority
            className="object-cover"
            style={{ objectPosition: "center 22%" }}
          />
          <div className="absolute inset-0 bg-black/55"></div>
          <h1 className="relative text-[42px] md:text-[56px] font-black text-white tracking-tight italic uppercase leading-none">Shop All</h1>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-200 bg-[#f3f3f3]">
          {/* Left Sidebar */}
          <aside className="md:col-span-1 p-4 md:p-5 md:border-r border-gray-200 bg-[#f3f3f3]">
            <div className="space-y-6">
              {/* Search Box in Sidebar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-4 pr-9 border border-black/45 rounded-lg text-sm bg-white focus:outline-none"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-black" />
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-[22px] font-bold text-heading mb-3 leading-none">Price Range</h3>
                <input
                  type="range"
                  min="0"
                  max="1400"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-black/80">
                  <span>$0</span>
                  <span>${priceRange}</span>
                </div>
              </div>

              {/* Dynamic Hierarchical Sidebar */}
              <div className="space-y-4">
                {hierarchy.map((parent) => (
                  <div key={parent.id} className="space-y-2">
                    <button 
                      onClick={() => toggleParent(parent.id)}
                      className="flex items-center justify-between w-full group"
                    >
                      <h3 className="text-[22px] font-bold text-heading leading-none">{parent.name}</h3>
                      <ChevronDown className={`w-5 h-5 transition-transform ${expandedParents.includes(parent.id) ? "rotate-180" : ""}`} />
                    </button>
                    
                    {expandedParents.includes(parent.id) && (
                      <div className="space-y-1.5 pl-2">
                        {parent.subcategories.map(sub => (
                          <label
                            key={sub.id}
                            className="flex items-center justify-between gap-2 cursor-pointer group"
                            onClick={() => setSelectedCategory(sub.slug)}
                          >
                            <span className={`text-[14px] font-medium transition-colors ${selectedCategory === sub.slug ? "text-orange-600 font-bold" : "text-heading"}`}>
                              {sub.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">({sub.productCount})</span>
                              <input
                                type="checkbox"
                                checked={selectedCategory === sub.slug}
                                readOnly
                                className="h-3.5 w-3.5 cursor-pointer accent-black"
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Section */}
          <div className="md:col-span-3 md:border-l border-gray-200">
            {/* Controls Row */}
            <div className="px-4 md:px-5 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[75%]">
                  {/* "ALL" tab first */}
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`h-7 px-6 rounded-full text-[11px] font-bold tracking-wide transition-all ${
                      selectedCategory === "ALL"
                        ? "bg-white text-black border border-transparent shadow-sm"
                        : "bg-gray-200 text-black border border-gray-300"
                    }`}
                    style={selectedCategory === "ALL" ? {
                      background: "linear-gradient(white, white) padding-box, linear-gradient(90deg, #ff8a00, #7b61ff) border-box",
                      border: "1px solid transparent"
                    } : {}}
                  >
                    ALL
                  </button>

                  {/* Dynamic siblings tabs */}
                  {activeParentSiblings.map((sub, idx) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedCategory(sub.slug)}
                      className={`h-7 px-6 rounded-full text-[11px] font-bold tracking-wide transition-all ${
                        selectedCategory === sub.slug
                          ? "bg-white text-black border border-transparent shadow-sm"
                          : "bg-gray-200 text-black border border-gray-300"
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                   <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 px-4 bg-white border border-gray-200 rounded-lg font-semibold text-sm focus:outline-none"
                   >
                     <option value="newest">Newest</option>
                     <option value="most-selling">Most Selling</option>
                     <option value="price-low-high">Price: Low to High</option>
                     <option value="price-high-low">Price: High to Low</option>
                   </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-4 md:p-5">
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-3xl" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <h3 className="text-lg font-semibold text-heading mb-2">No products found</h3>
                  <p className="text-sm text-content">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p: any) => {
                    const mappedProduct = {
                      ...p,
                      id: p.id || p._id,
                      name: p.name, // Required for backend cart validation
                      title: p.name, // Required for frontend UI
                      image: p.mainImageUrl,
                      price: p.salePrice || p.basePrice,
                      originalPrice: p.regularPrice || p.basePrice,
                      category: p.collections?.[0]?.name || "Athletic Wear",
                      rating: p.rating || 4.9,
                      discount: p.regularPrice && p.salePrice ? `-${Math.round((1 - p.salePrice/p.regularPrice) * 100)}%` : undefined,
                      isNew: true
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
