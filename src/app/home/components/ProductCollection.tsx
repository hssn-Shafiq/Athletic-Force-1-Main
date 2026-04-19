'use client';

import React, { useState } from 'react';
import { ProductCard } from '@/components/layout/ProductCard';
import { QuickViewModal } from '@/components/layout/QuickViewModal';
import { Product } from '@/types';
import { ArrowRight } from 'lucide-react';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'custom-half-sleeves-t-shirt-series-6050a',
    title: 'Elite Performance Tee Series 6050a',
    category: 'T-Shirts',
    price: 49.99,
    originalPrice: 67.49,
    discount: '-26%',
    rating: 4.9,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '2',
    slug: 'legacy-team-jersey',
    title: 'Legacy Team Jersey',
    category: 'Jerseys',
    price: 59.99,
    originalPrice: 80.99,
    discount: '-26%',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '3',
    slug: 'pro-performance-socks',
    title: 'Pro Performance Socks',
    category: 'Accessories',
    price: 14.99,
    originalPrice: 20.24,
    discount: '-26%',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '4',
    slug: 'stealth-snapback-cap',
    title: 'Stealth Snapback Cap',
    category: 'Accessories',
    price: 29.99,
    originalPrice: 40.49,
    discount: '-26%',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=400&auto=format&fit=crop'
  }
];

export const ProductCollection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Best Sellers');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  const tabs = ['All', 'Best Sellers', 'Merchandise', 'Accessories'];

  return (
    <>
      <section className="w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Shop The Collection</h2>
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {MOCK_PRODUCTS.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenQuickView={handleOpenQuickView}
            />
          ))}
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={handleCloseQuickView}
      />
    </>
  );
};
