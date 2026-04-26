'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from 'react';
import { Star, ShoppingBag, Heart, Minus, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import Link from 'next/link';

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

  const galleryImages = useMemo(() => {
    if (!product?.galleryImages) return [];
    return product.galleryImages.map((img: any) => typeof img === 'string' ? img : img.url);
  }, [product?.galleryImages]);

  const mainImage = product?.image || (product as any)?.mainImageUrl;

  const allImages = useMemo(
    () => unique([...(variantScopedImages || []), mainImage || '', ...galleryImages]),
    [galleryImages, mainImage, variantScopedImages]
  );
  const safeImageIndex = allImages.length ? Math.min(selectedImageIndex, allImages.length - 1) : 0;
  const currentImage = allImages[safeImageIndex] || mainImage;

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
  const reviewCount = product.reviewCount ?? 0;
  const displayRating = reviewCount > 0 ? product.rating : 0;

  const savings = displayOriginalPrice && product.orderType !== 'request'
    ? (displayOriginalPrice - displayPrice).toFixed(2)
    : null;

  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleWishlistToggle = () => {
    if (!product) return;
    toggleItem({
      productId: product.id,
      name: product.title,
      imageUrl: product.image,
      price: product.price
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);
    
    // We expect variant to have a SKU or fallback to productId.
    const sku = (selectedVariant as any)?.sku || product.id || '';
    
    await addItem({
      productId: product.id || '',
      variantSku: sku,
      name: product.title,
      imageUrl: currentImage,
      price: displayPrice,
      quantity,
      color: effectiveSelectedColor ?? undefined,
      size: effectiveSelectedSize ?? undefined,
    });
    
    setIsAddingToCart(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        className={`fixed inset-0 z-[210] flex items-center justify-center p-4 transition-all duration-300 pointer-events-none`}
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
            aria-label="Close quick view"
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-9 h-9 sm:w-8 sm:h-8 bg-white/95 border border-slate-200 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-md transition-colors"
          >
            <X className="w-4.5 h-4.5 sm:w-4 sm:h-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Left — Product Image */}
            <div className="group relative bg-slate-50 rounded-tl-3xl rounded-bl-3xl rounded-tr-3xl sm:rounded-tr-none overflow-hidden aspect-square">
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
                onClick={handleWishlistToggle}
                className="absolute top-14 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
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
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => {
                      setImageLoaded(false);
                      setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => {
                      setImageLoaded(false);
                      setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              ) : null}

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
            <div className="min-w-0 p-6 sm:p-8 pr-6 sm:pr-14 flex flex-col justify-center">
              {/* Category & Rating */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {product.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-[#FF7348] text-[#FF7348]" />
                  <span className="text-xs font-bold text-slate-800">{displayRating.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-4">
                {product.title}
              </h2>

              {/* Description (Truncated) */}
              {product.description && (
                <div 
                  className="text-xs text-slate-500 font-medium italic mb-5 line-clamp-4 leading-relaxed prose-sm max-w-full break-words [overflow-wrap:anywhere]"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              {/* Pricing */}
              {product.orderType !== 'request' ? (
                <div className="flex flex-wrap items-end gap-2 sm:gap-3 mb-5">
                  <span className="text-3xl font-black text-[#FF7348]">${displayPrice.toFixed(2)}</span>
                  {displayOriginalPrice && (
                    <span className="text-base text-slate-400 line-through font-medium mb-0.5">
                      ${displayOriginalPrice.toFixed(2)}
                    </span>
                  )}
                  {savings && (
                    <span className="w-full sm:w-auto text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full sm:mb-1 whitespace-nowrap">
                      You save ${savings}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mb-5">
                   <span className="text-orange-600 text-[10px] sm:text-xs font-black uppercase italic tracking-[0.2em] bg-orange-50 px-4 py-2 rounded-xl">Custom Quote Required</span>
                </div>
              )}

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
              {product.orderType !== 'request' && (
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
                        className={`w-9 h-9 rounded-xl text-[10px] font-bold transition-all duration-200 ${
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
              )}

              {/* Quantity + Primary CTA */}
              {product.orderType !== 'request' && (
                <>
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
                        onClick={() => {
                          const inv = product.inventory as any;
                          const baseStock = typeof inv === 'number' ? inv : inv?.globalStock;
                          const maxStock = selectedVariant?.stock ?? baseStock ?? 99;
                          setQuantity((q) => Math.min(maxStock, q + 1));
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      disabled={!effectiveSelectedSize || isAddingToCart}
                      onClick={handleAddToCart}
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                        effectiveSelectedSize && !isAddingToCart
                          ? 'bg-black text-white hover:bg-[#FF7348] hover:scale-[1.02] shadow-lg'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {isAddingToCart ? 'Adding...' : `Add to Cart — $${((selectedVariant?.price ?? product.price) * quantity).toFixed(2)}`}
                    </button>
                  </div>
                </>
              )}

              {product.orderType === 'request' && (
                <div className="flex flex-col gap-4">
                  <Link 
                    href={`/request-order-form?productId=${product.id}&product=${encodeURIComponent(product.title)}&category=${encodeURIComponent(product.category)}&subcategory=${encodeURIComponent(product.collections?.[0]?.name || '')}`}
                    className="w-full flex items-center justify-center gap-2 py-5 bg-[#141414] text-white rounded-2xl font-black uppercase italic tracking-widest text-xs hover:bg-black hover:scale-[1.02] transition-all shadow-xl shadow-black/10"
                  >
                    Request Custom Quote <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="w-full py-3.5 flex justify-center items-center rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-slate-400 transition-colors"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
