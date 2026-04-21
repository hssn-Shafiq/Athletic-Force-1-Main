"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/layout/ProductCard";
import { QuickViewModal } from "@/components/layout/QuickViewModal";
import { ShopFeaturesFaqSection } from "./components/ShopFeaturesFaqSection";
import { ShopRecentUpdatesSection } from "./components/ShopRecentUpdatesSection";

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
    image:
      "https://images.unsplash.com/photo-1506629082632-401ba4f20038?q=80&w=400&auto=format&fit=crop",
  },
];

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1400]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedMerchandise, setSelectedMerchandise] = useState<string[]>([
    "Sub-Collections",
    "Towels",
  ]);

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

  const filteredProducts = mockProducts.filter((p) => {
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
          <h1 className="relative text-[42px] md:text-[56px] font-black text-white tracking-tight">Shop All</h1>
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
                <div className="flex flex-wrap gap-2 max-w-full sm:max-w-[75%]">
                  {categories.map((cat, idx) => (
                    <button
                      key={`${cat}-${idx}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`h-7 px-6 rounded-full text-[11px] font-bold tracking-wide transition-all ${
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

                <button className="h-10 px-4 bg-black text-white rounded-lg font-semibold text-sm whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto">
                  <SlidersHorizontal className="w-4 h-4" />
                  Sort by Range
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <h3 className="text-lg font-semibold text-heading mb-2">No products found</h3>
                <p className="text-sm text-content">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-5">
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
    </main>
  );
}
