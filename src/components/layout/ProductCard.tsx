
"use client";

import React from 'react';
import Link from 'next/link';
import { Star, Eye, ShoppingBag, Heart, Plus } from 'lucide-react';
import { Product } from '@/types';

import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface ProductCardProps {
  product: Product;
  onOpenQuickView: (product: Product) => void;
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenQuickView }) => {
  const { items } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const productHref = `/products/${product.slug ?? `${product.id}-${toSlug(product.title)}`}`;
  
  // Assuming frontend mock `Product.id` maps to `productId` in cart
  const isInCart = items.some(i => i.productId === product.id);
  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      productId: product.id,
      name: product.title,
      imageUrl: product.image,
      price: product.price
    });
  };

  return (
    <div className="group relative bg-white border border-transparent hover:border-slate-100 rounded-2xl sm:rounded-[40px] p-2 sm:p-4 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-square rounded-xl sm:rounded-[32px] overflow-hidden bg-slate-50 mb-2 sm:mb-4">
        <div className="absolute top-3 left-3 hidden sm:flex flex-col gap-1.5 z-10">
          {product.isNew && (
            <span className="bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              New
            </span>
          )}
          {product.discount && (
            <span className="bg-[#FF7348] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {product.discount}
            </span>
          )}
          {isInCart && product.orderType !== 'request' && (
            <span className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
              In Cart
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-sm border border-slate-100 ${
            isWishlisted ? 'text-red-500 bg-white opacity-100' : 'text-slate-400 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Main Image */}
        <Link href={productHref} aria-label={`Open ${product.title} details`} className="block h-full w-full">
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
          />
        </Link>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/5 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-3">
          <button 
            onClick={() => onOpenQuickView(product)}
            className={`flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg ${product.orderType === 'request' ? 'w-3/4 justify-center' : ''}`}
          >
            <Eye className="w-4 h-4" />
            <span>{product.orderType === 'request' ? 'View Details' : 'View'}</span>
          </button>
          {product.orderType !== 'request' && (
            <button 
              onClick={() => onOpenQuickView(product)}
              className="flex items-center gap-2 bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-black transition-colors shadow-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-2">
        <div className="flex justify-between items-center mb-0.5 sm:mb-1">
          <span className="text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">{product.category}</span>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#FF7348] text-[#FF7348]" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-900">{product.rating}</span>
          </div>
        </div>
        <Link href={productHref} className="block">
          <h3 className="font-bold text-slate-900 text-[13px] sm:text-lg leading-tight mb-1 sm:mb-3 group-hover:text-[#FF7348] transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>
        {product.orderType !== 'request' ? (
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] sm:text-xs line-through font-medium">${product.originalPrice}</span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[#FF7348] text-lg sm:text-2xl font-black">${product.price}</span>
              <button
                type="button"
                onClick={() => onOpenQuickView(product)}
                aria-label={`Quick view ${product.title}`}
                className="sm:hidden inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 text-slate-900 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#FF7348] text-[10px] sm:text-xs font-black uppercase italic tracking-widest line-clamp-2 leading-tight">Custom Quote Required</span>
            <button
              type="button"
              onClick={() => onOpenQuickView(product)}
              aria-label={`Quick view ${product.title}`}
              className="sm:hidden inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 text-slate-900 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
