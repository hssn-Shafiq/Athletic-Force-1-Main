'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '@/components/layout/ProductCard';
import { QuickViewModal } from '@/components/layout/QuickViewModal';
import { Product } from '@/types';
import { ArrowRight } from 'lucide-react';
import { getExploreProductsApi } from '@/lib/api/publicProducts';
import { mapPublicProductToCard } from '@/lib/products/mapPublicProductToCard';

const PRODUCT_SKELETON_COUNT = 4;

const ProductCardSkeleton: React.FC = () => (
  <div className="group relative bg-white border border-transparent rounded-4xl p-4 animate-pulse">
    <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 mb-4" />
    <div className="px-2 space-y-2">
      <div className="h-3 w-1/3 rounded bg-slate-100" />
      <div className="h-5 w-11/12 rounded bg-slate-100" />
      <div className="h-4 w-1/4 rounded bg-slate-100" />
      <div className="h-6 w-1/3 rounded bg-slate-100" />
    </div>
  </div>
);

export const ProductCollection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Best Sellers');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);

      try {
        const response = await getExploreProductsApi({
          page: 1,
          pageSize: 40,
        });

        if (!isMounted) return;

        const mapped = (response.items || []).map(mapPublicProductToCard);
        setProducts(mapped);
      } catch {
        if (!isMounted) return;
        setProducts([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const tabs = ['All', 'Best Sellers', 'Merchandise', 'Accessories'];

  const filteredProducts = useMemo(() => {
    const merchandiseProducts = products.filter((product) =>
      (product.collections || []).some(
        (entry) => entry.slug?.toLowerCase() === 'merchandise' || entry.name?.toLowerCase() === 'merchandise'
      )
    );

    if (activeTab === 'Merchandise') {
      return merchandiseProducts;
    }

    if (activeTab === 'Accessories') {
      return products.filter((product) => product.category?.toLowerCase().includes('accessories'));
    }

    if (activeTab === 'Best Sellers') {
      return [...products]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);
    }

    return products;
  }, [activeTab, products]);

  return (
    <>
      <section className="w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Shop The Collection</h2>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-black text-white'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <button className="flex items-center gap-2 text-[#FF7348] text-xs font-bold uppercase tracking-widest group">
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10">
            {Array.from({ length: PRODUCT_SKELETON_COUNT }).map((_, idx) => (
              <ProductCardSkeleton key={`product-skeleton-${idx}`} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-base font-black uppercase tracking-wide text-slate-800">No Products Available</p>
            <p className="mt-2 text-sm font-medium text-slate-500">Try selecting another tab or check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenQuickView={handleOpenQuickView}
              />
            ))}
          </div>
        )}
      </section>

      <QuickViewModal
        key={quickViewProduct?.id || 'quick-view-empty'}
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={handleCloseQuickView}
      />
    </>
  );
};
