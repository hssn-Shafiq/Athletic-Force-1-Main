"use client";

import React from "react";
import { Product } from "@/types";
// import { ProductCard } from "@/src/components/layout/ProductCard";
import { ProductCard } from "@/components/layout/ProductCard";
interface ShopProductGridProps {
  products: Product[];
  onOpenQuickView: (product: Product) => void;
}

export const ShopProductGrid: React.FC<ShopProductGridProps> = ({
  products,
  onOpenQuickView,
}) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-heading mb-2">
            No products found
          </h3>
          <p className="text-content">
            Try adjusting your filters to find what you're looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onOpenQuickView={() => onOpenQuickView(product)}
        />
      ))}
    </div>
  );
};
