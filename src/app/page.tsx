"use client";

import Image from "next/image";
import { HeroSection } from "./home/components/HeroSection";
import { TopCategories } from "../components/sections/features/TopCategories";
import { ProductCollection } from "./home/components/ProductCollection";
import { useState } from "react";
import { Product } from "@/types";
import { QuickViewModal } from "../components/layout/QuickViewModal";
import { PromoBanner } from "./home/components/PromoBanner";
import { ExploreCategories } from "./home/components/ExploreCategories";
import { CategoriesTabs } from "./home/components/CategoriesTabs";
import { VideoSection } from "./home/components/VideoSections";

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <main className="font-sans">
      {/* Hero takes full width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <HeroSection />
      </div>

      {/* Categories with spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <TopCategories />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <ProductCollection onOpenQuickView={setSelectedProduct} />
      </div>

      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        <PromoBanner />

      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        <ExploreCategories />

      </div>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        <CategoriesTabs />

      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        <VideoSection />

      </div>
    </main>
  );
}
