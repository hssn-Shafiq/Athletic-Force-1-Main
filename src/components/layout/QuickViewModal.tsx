'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingBag, Heart, Minus, Plus } from 'lucide-react';
import { Product } from '@/types';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset state when a new product opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSize(null);
      setQuantity(1);
      setIsWishlisted(false);
      setImageLoaded(false);
    }
  }, [isOpen, product?.id]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!product) return null;

  const savings = product.originalPrice
    ? (product.originalPrice - product.price).toFixed(2)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 pointer-events-none`}
      >
        <div
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto transition-all duration-300 ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Left — Product Image */}
            <div className="relative bg-slate-50 rounded-tl-3xl rounded-bl-3xl rounded-tr-3xl sm:rounded-tr-none overflow-hidden aspect-square">
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
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
              </div>

              {/* Wishlist */}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400'
                  }`}
                />
              </button>

              <img
                src={product.image}
                alt={product.title}
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-contain mix-blend-multiply p-6 transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>

            {/* Right — Product Details */}
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              {/* Category & Rating */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {product.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-[#FF7348] text-[#FF7348]" />
                  <span className="text-xs font-bold text-slate-800">{product.rating}</span>
                  <span className="text-xs text-slate-400">(124 reviews)</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-4">
                {product.title}
              </h2>

              {/* Pricing */}
              <div className="flex items-end gap-3 mb-5">
                <span className="text-3xl font-black text-[#FF7348]">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-base text-slate-400 line-through font-medium mb-0.5">
                    ${product.originalPrice}
                  </span>
                )}
                {savings && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full mb-1">
                    You save ${savings}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 mb-5" />

              {/* Size Selector */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    Select Size
                  </span>
                  <button className="text-xs text-[#FF7348] font-semibold underline underline-offset-2">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-11 h-11 rounded-xl text-xs font-bold transition-all duration-200 ${
                        selectedSize === size
                          ? 'bg-black text-white scale-105 shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {!selectedSize && (
                  <p className="text-[11px] text-slate-400 mt-2">Please select a size</p>
                )}
              </div>

              {/* Quantity Picker */}
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-700 block mb-3">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-slate-900 text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  disabled={!selectedSize}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    selectedSize
                      ? 'bg-black text-white hover:bg-[#FF7348] hover:scale-[1.02] shadow-lg'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart — ${(product.price * quantity).toFixed(2)}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-slate-400 transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
