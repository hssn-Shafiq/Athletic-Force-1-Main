
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Product, CollectionHierarchy } from "@/lib/api/types";
import { Search, ChevronDown, Home, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/layout/ProductCard";
import { QuickViewModal } from "@/components/layout/QuickViewModal";
import { getExploreProductsApi } from "@/lib/api/publicProducts";
import { getCollectionHierarchyApi } from "@/lib/api/publicCollections";
import { ShopSkeleton } from "@/app/shop/components/ShopSkeleton";

export default function SubCollectionClient() {
  const params = useParams();
  const parentSlug = params.categoryId as string;
  const subSlug = params.subCategoryId as string;

  // --- State Command Center ---
  const [products, setProducts] = useState<Product[]>([]);
  const [hierarchy, setHierarchy] = useState<CollectionHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<number>(1400);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  // --- Breadcrumb & Hero Intel ---
  const parentData = useMemo(() => hierarchy.find(p => p.slug === parentSlug), [hierarchy, parentSlug]);
  const subData = useMemo(() => parentData?.subcategories.find(s => s.slug === subSlug), [parentData, subSlug]);

  // --- Tactical Data Fetching ---
  const fetchSubCollectionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productRes, hierarchyRes] = await Promise.all([
        getExploreProductsApi({
          collection: subSlug, // Filter specifically by the sub-category slug
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
          <Link href={`/collections/${parentSlug}`} className="hover:text-black transition-colors">
            {parentData?.name || parentSlug.replace(/-/g, ' ')}
          </Link>
          <ChevronRight className="w-3 h-3 text-black" />
          <span className="text-black">{subData?.name || subSlug.replace(/-/g, ' ')}</span>
        </nav>

        {/* Hero Banner - Sub Collection */}
        <div className="relative w-full h-[190px] md:h-[260px] rounded-[28px] mb-5 flex items-center justify-center bg-black overflow-hidden shadow-2xl">
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
             <h1 className="text-[42px] md:text-[62px] font-black text-white tracking-tighter italic uppercase leading-none drop-shadow-2xl">
                {subData?.name || subSlug.replace(/-/g, ' ')}
             </h1>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-200 bg-[#f3f3f3] relative rounded-3xl overflow-hidden shadow-sm">
          {/* Left Sidebar - Desktop View */}
          <aside className="hidden md:block md:col-span-1 p-6 md:border-r border-gray-200 bg-white/50 backdrop-blur-md">
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
                <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-3 bg-black" />
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
                <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-3 bg-black" />
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
                      <div className="space-y-2 pl-3 border-l-2 border-slate-100 mt-2">
                        {parent.subcategories.map(sub => (
                          <Link
                            key={sub.id}
                            href={`/collections/${parent.slug}/${sub.slug}`}
                            className={`flex items-center justify-between group py-1.5 transition-all hover:translate-x-1`}
                          >
                            <span className={`text-[12px] font-bold ${sub.slug === subSlug ? "text-orange-600" : "text-slate-400 group-hover:text-black"}`}>
                                {sub.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-500 transition-colors">
                                ({sub.productCount || 0})
                            </span>
                          </Link>
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
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Showing <span className="text-black">{products.length}</span> Results
                </p>
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                    <option value="newest">Newest First</option>
                    <option value="most-selling">Best Sellers</option>
                    <option value="price-low-high">Price: Low to High</option>
                    <option value="price-high-low">Price: High to Low</option>
                </select>
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
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">No Tactical Gear Found</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">We couldn't find any items matching your current filters in this sub-collection.</p>
                  <button 
                    onClick={() => {setPriceRange(1400); setSearchQuery("");}}
                    className="mt-8 px-8 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                  >
                    Reset Mission Filters
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
