'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, ShoppingBag, Heart, Minus, Plus } from 'lucide-react';
import { Product } from '@/types';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));
const normalizeColor = (value: string) => value.trim().toLowerCase();

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const variantRows = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariants = variantRows.filter((variant) => variant.isActive !== false);

  const colorMeta = useMemo(() => {
    const byColor = new Map<string, { name: string; imageUrl?: string }>();

    activeVariants.forEach((variant) => {
      const colorName = variant.color?.trim();
      if (!colorName) return;

      const key = normalizeColor(colorName);
      const existing = byColor.get(key);

      if (!existing) {
        byColor.set(key, { name: colorName, imageUrl: variant.imageUrl });
        return;
      }

      if (!existing.imageUrl && variant.imageUrl) {
        byColor.set(key, { ...existing, imageUrl: variant.imageUrl });
      }
    });

    return Array.from(byColor.values());
  }, [activeVariants]);

  const colorOptions = colorMeta.map((entry) => entry.name);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const effectiveSelectedColor = useMemo(() => {
    if (!colorOptions.length) return null;
    if (!selectedColor) return colorOptions[0];

    const target = normalizeColor(selectedColor);
    return colorOptions.find((color) => normalizeColor(color) === target) || colorOptions[0];
  }, [colorOptions, selectedColor]);

  const availableSizes = useMemo(() => {
    if (effectiveSelectedColor) {
      const target = normalizeColor(effectiveSelectedColor);
      return unique(
        activeVariants
          .filter((variant) => normalizeColor(variant.color || '') === target)
          .map((variant) => variant.size)
      );
    }

    return unique(activeVariants.map((variant) => variant.size));
  }, [activeVariants, effectiveSelectedColor]);

  const effectiveSelectedSize = useMemo(() => {
    if (!availableSizes.length) return null;
    if (selectedSize && availableSizes.includes(selectedSize)) return selectedSize;
    return availableSizes[0];
  }, [availableSizes, selectedSize]);

  const selectedVariant = activeVariants.find(
    (variant) =>
      (!effectiveSelectedColor || normalizeColor(variant.color || '') === normalizeColor(effectiveSelectedColor)) &&
      (!effectiveSelectedSize || variant.size === effectiveSelectedSize)
  );

  const variantScopedImages = useMemo(() => {
    if (effectiveSelectedColor) {
      const target = normalizeColor(effectiveSelectedColor);
      return unique(
        activeVariants
          .filter((variant) => normalizeColor(variant.color || '') === target)
          .map((variant) => variant.imageUrl || '')
      );
    }

    return unique(activeVariants.map((variant) => variant.imageUrl || ''));
  }, [activeVariants, effectiveSelectedColor]);

  const galleryImages = product?.galleryImages || [];
  const allImages = useMemo(
    () => unique([...(variantScopedImages || []), product?.image || '', ...galleryImages]),
    [galleryImages, product?.image, variantScopedImages]
  );
  const safeImageIndex = allImages.length ? Math.min(selectedImageIndex, allImages.length - 1) : 0;
  const currentImage = allImages[safeImageIndex] || product?.image;

  const displaySizes = activeVariants.length ? availableSizes : SIZES;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setSelectedImageIndex(0);
    setImageLoaded(false);
  };

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

  const displayPrice = selectedVariant?.price ?? product.price;
  const displayOriginalPrice = product.originalPrice;

  const savings = displayOriginalPrice
    ? (displayOriginalPrice - displayPrice).toFixed(2)
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
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto pointer-events-auto transition-all duration-300 ${
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
                {!product.isNew && product.normalizedBadge && (
                  <span className="bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {product.normalizedBadge}
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
                src={currentImage}
                alt={product.title}
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-contain mix-blend-multiply p-6 transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {allImages.length > 1 ? (
                <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto">
                  {allImages.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => {
                        setImageLoaded(false);
                        setSelectedImageIndex(idx);
                      }}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 bg-white ${
                        selectedImageIndex === idx ? 'border-black' : 'border-white/70'
                      }`}
                    >
                      <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
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
                <span className="text-3xl font-black text-[#FF7348]">${displayPrice.toFixed(2)}</span>
                {displayOriginalPrice && (
                  <span className="text-base text-slate-400 line-through font-medium mb-0.5">
                    ${displayOriginalPrice.toFixed(2)}
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

              {colorOptions.length ? (
                <div className="mb-5">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-700 block mb-3">Select Color</span>
                  <div className="flex flex-wrap gap-2">
                    {colorMeta.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => handleColorSelect(color.name)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                          effectiveSelectedColor === color.name
                            ? 'bg-black text-white scale-105 shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {color.imageUrl ? (
                          <span className="w-5 h-5 rounded-md overflow-hidden border border-white/50 shrink-0 bg-white/20">
                            <img src={color.imageUrl} alt={color.name} className="w-full h-full object-cover" />
                          </span>
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-current opacity-70 shrink-0" />
                        )}
                        <span>{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

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
                  {displaySizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-11 h-11 rounded-xl text-xs font-bold transition-all duration-200 ${
                        effectiveSelectedSize === size
                          ? 'bg-black text-white scale-105 shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {!effectiveSelectedSize && (
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
                  disabled={!effectiveSelectedSize}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    effectiveSelectedSize
                      ? 'bg-black text-white hover:bg-[#FF7348] hover:scale-[1.02] shadow-lg'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart — ${((selectedVariant?.price ?? product.price) * quantity).toFixed(2)}
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
