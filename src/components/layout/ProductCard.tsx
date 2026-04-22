
"use client";

import React from 'react';
import Link from 'next/link';
import { Star, Eye, ShoppingBag, Heart } from 'lucide-react';
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
    <div className="group relative bg-white border border-transparent hover:border-slate-100 rounded-4xl p-4 transition-all duration-300 hover:shadow-xl">
      {/* Image Container */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 mb-4">
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
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
          {isInCart && (
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
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          <button 
            onClick={() => onOpenQuickView(product)}
            className="flex items-center gap-2 bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-black transition-colors shadow-lg"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{product.category}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-[#FF7348] text-[#FF7348]" />
            <span className="text-xs font-bold text-slate-900">{product.rating}</span>
          </div>
        </div>
        <Link href={productHref} className="block">
          <h3 className="font-bold text-slate-900 text-lg leading-tight mb-3 group-hover:text-[#FF7348] transition-colors line-clamp-1">
            {product.title}
          </h3>
        </Link>
        <div className="flex flex-col">
          <span className="text-slate-400 text-xs line-through font-medium">${product.originalPrice}</span>
          <span className="text-[#FF7348] text-2xl font-black">${product.price}</span>
        </div>
      </div>
    </div>
  );
};
