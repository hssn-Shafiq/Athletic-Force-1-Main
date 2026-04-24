"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/../types";
import { Search, SlidersHorizontal, X, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "@/components/layout/ProductCard";
import { QuickViewModal } from "@/components/layout/QuickViewModal";
import { ShopFeaturesFaqSection } from "./components/ShopFeaturesFaqSection";
import { ShopRecentUpdatesSection } from "./components/ShopRecentUpdatesSection";
import { useEffect } from "react";
import { getExploreProductsApi } from "@/lib/api/publicProducts";
import { mapPublicProductToCard } from "@/lib/products/mapPublicProductToCard";

const ProductCardSkeleton = () => (
  <div className="group relative bg-white border border-transparent rounded-2xl p-4 animate-pulse">
    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-4" />
    <div className="px-2 space-y-2">
      <div className="h-3 w-1/3 rounded bg-slate-100" />
      <div className="h-5 w-11/12 rounded bg-slate-100" />
      <div className="h-4 w-1/4 rounded bg-slate-100" />
      <div className="h-6 w-1/3 rounded bg-slate-100" />
    </div>
  </div>
);

const mockProducts: Product[] = [
  {
    id: "1",
    title: "Elite Performance Tee Series 6050a",
    category: "T-Shirts",
    price: 49.99,
    originalPrice: 67.49,
    discount: "-26%",
    rating: 4.9,
    isNew: true,
    orderType: "direct",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Legacy Team Jersey",
    category: "Jerseys",
    price: 59.99,
    originalPrice: 80.99,
    discount: "-26%",
    rating: 4.9,
    orderType: "direct",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Pro Performance Socks",
    category: "Accessories",
    price: 14.99,
    originalPrice: 20.24,
    discount: "-26%",
    rating: 4.9,
    orderType: "direct",
    image:
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Stealth Snapback Cap",
    category: "Accessories",
    price: 29.99,
    originalPrice: 40.49,
    discount: "-26%",
    rating: 4.9,
    orderType: "direct",
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Pro Athlete Training Jacket",
    category: "Jackets",
    price: 89.99,
    originalPrice: 120.99,
    discount: "-26%",
    rating: 4.8,
    isNew: true,
    orderType: "direct",
    image:
      "https://images.unsplash.com/photo-1516215495135-701d8042da0c?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "6",
    title: "Compression Leggings",
    category: "Bottoms",
    price: 44.99,
    originalPrice: 60.99,
    discount: "-26%",
    rating: 4.7,
    orderType: "direct",
    image:
      "https://images.unsplash.com/photo-1506629082632-401ba4f20038?q=80&w=400&auto=format&fit=crop",
  },
];

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1400]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedMerchandise, setSelectedMerchandise] = useState<string[]>([
    "Sub-Collections",
    "Towels",
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const response = await getExploreProductsApi({ page: 1, pageSize: 50 });
        const mapped = (response.items || []).map(mapPublicProductToCard);
        setProducts(mapped);
      } catch (err) {
        console.error("Failed to fetch shop products", err);
        setProducts(mockProducts); // Fallback to mock if API fails
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = ["ALL", "TOWELS", "TOWELS", "TOWELS", "TOWELS", "TOWELS", "TOWELS"];
  const merchandise = [
    "Sub-Collections",
    "Towels",
    "Towels",
    "Towels",
    "Towels",
    "Towels",
    "Towels",
    "Towels",
  ];

  const filteredProducts = products.filter((p) => {
    const categoryMatch = selectedCategory === "ALL" || p.category.toUpperCase() === selectedCategory;
    const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1];
    const searchMatch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && priceMatch && searchMatch;
  });

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  return (
    <main className="font-sans bg-[#f3f3f3] min-h-screen">
      {/* Hero Banner - Shop All */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-3 pb-8">
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
          <h1 className="relative text-[42px] md:text-[56px] font-black text-white tracking-tight">Shop All</h1>
        </div>

        {/* Mobile Search - Only visible on mobile after Hero */}
        <div className="md:hidden max-w-2xl mx-auto mb-6 px-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white shadow-sm focus:border-black transition-all outline-none text-sm font-medium"
            />
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-200 bg-[#f3f3f3] relative">
          {/* Left Sidebar - Desktop View (Restored Original) */}
          <aside className="hidden md:block md:col-span-1 p-4 md:p-5 md:border-r border-gray-200 bg-[#f3f3f3]">
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
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-black/80">
                  <span>$0</span>
                  <span>$1400</span>
                </div>
              </div>

              {/* Merchandise Filters */}
              <div>
                <h3 className="text-[22px] font-bold text-heading mb-2 leading-none">Merchandise</h3>
                <div className="space-y-1.5">
                  {merchandise.map((item, idx) => (
                    <label
                      key={`${item}-${idx}`}
                      className="flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="text-[14px] text-heading font-medium">{item}</span>
                      <input
                        type="checkbox"
                        checked={selectedMerchandise.includes(item)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMerchandise([...selectedMerchandise, item]);
                          } else {
                            setSelectedMerchandise(
                              selectedMerchandise.filter((m) => m !== item)
                            );
                          }
                        }}
                        className="h-3.5 w-3.5 cursor-pointer accent-black"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Section */}
          <div className="md:col-span-3 md:border-l border-gray-200">
            {/* Controls Row */}
            <div className="px-4 md:px-5 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:max-w-[75%]">
                  {categories.map((cat, idx) => (
                    <button
                      key={`${cat}-${idx}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`h-7 px-6 rounded-full text-[11px] font-bold tracking-wide transition-all shrink-0 ${
                        selectedCategory === cat && idx === 0
                          ? "bg-white text-black border border-transparent"
                          : selectedCategory === cat
                            ? "bg-white text-black border border-black/15"
                            : "bg-gray-200 text-black border border-gray-300"
                      }`}
                      style={
                        selectedCategory === cat && idx === 0
                          ? {
                              background:
                                "linear-gradient(white, white) padding-box, linear-gradient(90deg, #ff8a00, #7b61ff) border-box",
                              border: "1px solid transparent",
                            }
                          : undefined
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="md:hidden w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                    title="Filters"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  <button className="h-10 px-4 bg-black text-white rounded-lg font-semibold text-sm whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto">
                    <SlidersHorizontal className="w-4 h-4" />
                    Sort by Range
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 p-1 sm:p-5">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <ProductCardSkeleton key={`shop-skeleton-${idx}`} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <h3 className="text-lg font-semibold text-heading mb-2">No products found</h3>
                <p className="text-sm text-content">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 p-1 sm:p-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenQuickView={() => handleOpenQuickView(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <ShopFeaturesFaqSection />
        <ShopRecentUpdatesSection />
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          isOpen={true}
          onClose={handleCloseQuickView}
        />
      )}

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/60 z-[100] md:hidden backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#f3f3f3] z-[101] md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Filters</h2>
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-8">
                  {/* Search removed from drawer as well to follow new UI */}

                  {/* Price Range */}
                  <div>
                    <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-3 bg-black" />
                      Price Range
                    </h3>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="1400"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black mb-4"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">$0</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Merchandise */}
                  <div>
                    <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-1 h-3 bg-black" />
                      Merchandise
                    </h3>
                    <div className="space-y-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                      {merchandise.map((item, idx) => (
                        <label
                          key={`${item}-${idx}`}
                          className="flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <span className={`text-sm font-bold tracking-tight transition-colors ${selectedMerchandise.includes(item) ? 'text-black' : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {item}
                          </span>
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedMerchandise.includes(item)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMerchandise([...selectedMerchandise, item]);
                                } else {
                                  setSelectedMerchandise(
                                    selectedMerchandise.filter((m) => m !== item)
                                  );
                                }
                              }}
                              className="peer h-5 w-5 cursor-pointer accent-black opacity-0 absolute z-10"
                            />
                            <div className="h-5 w-5 rounded-lg border-2 border-slate-200 peer-checked:bg-black peer-checked:border-black transition-all flex items-center justify-center">
                              <motion.div
                                initial={false}
                                animate={{ scale: selectedMerchandise.includes(item) ? 1 : 0 }}
                              >
                                <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                              </motion.div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-200 bg-white">
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full h-12 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg"
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

// CSS to hide scrollbar
const style = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = style;
  document.head.appendChild(styleElement);
}
