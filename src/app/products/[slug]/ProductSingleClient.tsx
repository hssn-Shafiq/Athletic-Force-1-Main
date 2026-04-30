
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { toast } from 'react-toastify';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import {
  Star,
  Heart,
  ChevronDown,
  ShoppingBag,
  Zap,
  Truck,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  Mail,
  ChevronRight,
  ArrowLeft,
  Play,
  X,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Product } from '@/types';
import { getExploreProductBySlugApi } from '@/lib/api/publicProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';

const ShopFeaturesFaqSection = dynamic(() => import('@/app/shop/components/ShopFeaturesFaqSection').then(mod => mod.ShopFeaturesFaqSection), {
  ssr: true,
  loading: () => <div className="h-40 animate-pulse bg-slate-50 rounded-3xl" />
});

const ReviewModal = dynamic(() => import('../_components/ReviewModal').then(mod => mod.ReviewModal), {
  ssr: false
});

const VideoReviews = dynamic(() => import('../_components/VideoReviews').then(mod => mod.VideoReviews), {
  ssr: true,
  loading: () => <div className="h-60 animate-pulse bg-slate-50 rounded-3xl" />
});

const ProductReviews = dynamic(() => import('../_components/ProductReviews').then(mod => mod.ProductReviews), {
  ssr: true,
  loading: () => <div className="h-80 animate-pulse bg-slate-50 rounded-3xl" />
});

// ─── YouTube URL → embed converter ────────────────────────────────────────────
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (host === 'youtube.com') {
      const shorts = u.pathname.match(/\/shorts\/([^/?#]+)/);
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}?autoplay=1&rel=0`;
      const embed = u.pathname.match(/\/embed\/([^/?#]+)/);
      if (embed) return `https://www.youtube.com/embed/${embed[1]}?autoplay=1&rel=0`;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
    }
    return null;
  } catch { return null; }
}

// ─── MainVideoSection ──────────────────────────────────────────────────────────
function MainVideoSection({ mainVideo }: { mainVideo: { videoUrl: string; thumbnailUrl?: string | null } }) {
  const [playing, setPlaying] = React.useState(false);
  const embedUrl = toEmbedUrl(mainVideo.videoUrl);

  return (
    <section className="rounded-2xl bg-[#efefef] p-5 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center">Product Video</h2>
      <div className="mt-4 rounded-3xl bg-black p-4 sm:p-0">
        <div className="relative mx-auto aspect-[15/7] max-w-6xl overflow-hidden rounded-2xl bg-black">
          {playing && embedUrl ? (
            <>
              <iframe
                src={embedUrl}
                title="Product video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
              <button
                type="button"
                onClick={() => setPlaying(false)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                aria-label="Close video"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              {mainVideo.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainVideo.thumbnailUrl}
                  alt="Product video thumbnail"
                  className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0 grid place-items-center">
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="grid h-16 w-16 place-items-center rounded-full border border-white/60 bg-black/55 text-white transition hover:scale-105"
                  aria-label="Play product video"
                >
                  <Play className="h-8 w-8" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// Extended product type for this page
interface VideoReviewItem {
  videoUrl: string;
  thumbnailUrl: string | null;
}

interface MainVideoData {
  videoUrl: string;
  thumbnailUrl?: string | null;
}

interface DetailedProduct extends Omit<Product, 'variants' | 'inventory' | 'mainVideo'> {
  sku: string;
  benefits: string; // HTML string from rich text editor
  faqs: { question: string; answer: string }[];
  upsellProducts: {
    id: string;
    name: string;
    slug: string;
    mainImageUrl?: string;
    regularPrice?: number;
    salePrice?: number;
    basePrice?: number;
    bundlePrice?: number;
    variants: any[];
    inventory?: any;
    variantRows: any[];
  }[];
  reviews: {
    id: string;
    rating: number;
    fullName: string;
    reviewText: string;
    photos: { url: string; publicId: string }[];
    userAvatar?: { url: string; publicId: string };
    createdAt?: string;
  }[];
  mainVideo: MainVideoData | null;
  videoReviews: VideoReviewItem[];
  orderType: 'direct' | 'request';
  variants: {
    colors: { name: string; image: string }[];
    sizes: string[];
  };
  inventory: number;
  inventoryMax: number;
  description: string;
  variantRows: Array<{
    color: string;
    size: string;
    stock: number;
    price: number;
    originalPrice: number;
    sku: string;
    imageUrl?: string;
    isActive?: boolean;
  }>;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function mapToDetailedProduct(raw: any): DetailedProduct {
  const activeVariants = (raw.variants || []).filter((variant: any) => variant.isActive !== false);
  const colors = unique(activeVariants.map((variant: any) => variant.color).filter((entry: string) => entry && entry !== 'Default'));
  const sizes = unique(activeVariants.map((variant: any) => variant.size).filter((entry: string) => entry && entry !== 'Default'));

  const colorImageMap = new Map<string, string>();
  activeVariants.forEach((variant: any) => {
    const key = (variant.color || '').trim().toLowerCase();
    if (!key || key === 'default' || colorImageMap.has(key)) return;
    if (variant.imageUrl) colorImageMap.set(key, variant.imageUrl);
  });

  const variantRows = activeVariants.map((variant: any, index: number) => ({
    color: variant.color || 'Default',
    size: variant.size || 'Default',
    stock: Number(variant.stock || 0),
    price: Number(variant.price || raw.salePrice || raw.regularPrice || raw.basePrice || 0),
    originalPrice: Number(raw.regularPrice || raw.basePrice || 0),
    sku: variant.sku || `${(raw.slug || 'PRODUCT').toUpperCase()}-${index + 1}`,
    imageUrl: variant.imageUrl,
    isActive: variant.isActive,
  }));

  const inventoryTotalFromVariants = variantRows.reduce((sum: number, row: any) => sum + Number(row.stock || 0), 0);
  const inventoryTotal = Number(raw.inventory?.globalStock ?? inventoryTotalFromVariants ?? 0);

  const regularPrice = Number(raw.regularPrice ?? raw.basePrice ?? 0);
  const salePrice = Number(raw.salePrice ?? regularPrice);
  const discount = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;
  const reviews = Array.isArray(raw.reviews) ? raw.reviews : [];
  const reviewCount = reviews.length;
  const rating = reviewCount
    ? Number((reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / reviewCount).toFixed(1))
    : 0;

  return {
    id: raw.id,
    title: raw.name,
    sku: variantRows[0]?.sku || (raw.slug || '00001').toUpperCase(),
    category: (raw.collections || []).find((c: any) => c.parentId)?.name || (raw.collections || []).find((c: any) => !c.parentId)?.name || (raw.collections || [])[0]?.name || 'Product',
    price: salePrice,
    originalPrice: regularPrice,
    discount: discount > 0 ? `${discount}% OFF` : '',
    rating,
    image: raw.mainImageUrl,
    benefits: raw.benefits || '',
    faqs: raw.faqs || [],
    upsellProducts: (raw.upsellProducts || []).map((upsell: any) => {
      const activeV = (upsell.variants || []).filter((v: any) => v.isActive !== false);
      const rows = activeV.map((v: any, i: number) => ({
        color: v.color || 'Default',
        size: v.size || 'Default',
        stock: Number(v.stock || 0),
        price: Number(v.price || upsell.salePrice || upsell.regularPrice || upsell.basePrice || 0),
        originalPrice: Number(upsell.regularPrice || upsell.basePrice || 0),
        sku: v.sku || `${(upsell.slug || 'UPSELL').toUpperCase()}-${i + 1}`,
        imageUrl: v.imageUrl,
        isActive: v.isActive,
      }));
      return {
        ...upsell,
        variants: activeV,
        variantRows: rows,
        inventory: upsell.inventory,
      };
    }),
    reviews,
    reviewCount,
    mainVideo: raw.mainVideo?.videoUrl ? raw.mainVideo : null,
    videoReviews: (raw.videoReviews || []).filter((v: any) => v.videoUrl),
    variants: {
      colors: colors.map((color) => ({
        name: color,
        image: colorImageMap.get(color.toLowerCase()) || raw.mainImageUrl,
      })),
      sizes,
    },
    inventory: inventoryTotal,
    inventoryMax: Math.max(inventoryTotal, 20),
    description: raw.description || '',
    variantRows,
    orderType: raw.orderType || 'direct',
    galleryImages: (raw.galleryImages || []).map((entry: any) => entry.url),
    collections: raw.collections || [],
  };
}

// ─── UpsellSelectionModal ───────────────────────────────────────────────────
interface UpsellSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  upsell: DetailedProduct['upsellProducts'][0];
  mainProductPrice: number;
  onConfirm: (selection: { color?: string; size?: string; sku: string; price: number; imageUrl: string }) => void;
}

const UpsellSelectionModal: React.FC<UpsellSelectionModalProps> = ({ isOpen, onClose, upsell, mainProductPrice, onConfirm }) => {
  const [selectedColor, setSelectedColor] = useState<{ name: string; image: string } | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const colors = unique(upsell.variantRows.map(v => v.color).filter(c => c && c !== 'Default'));
    const sizes = unique(upsell.variantRows.map(v => v.size).filter(s => s && s !== 'Default'));

    if (colors.length > 0) {
      const firstColor = colors[0];
      const colorImg = upsell.variantRows.find(v => v.color === firstColor)?.imageUrl || upsell.mainImageUrl || '';
      setSelectedColor({ name: firstColor, image: colorImg });
    }

    const availableForColor = colors.length > 0
      ? unique(upsell.variantRows.filter(v => v.color === colors[0]).map(v => v.size).filter(s => s && s !== 'Default'))
      : sizes;

    if (availableForColor.length > 0) {
      setSelectedSize(availableForColor[0]);
    }
  }, [isOpen, upsell]);

  const availableSizes = useMemo(() => {
    if (!selectedColor) {
      return unique(upsell.variantRows.map(v => v.size).filter(s => s && s !== 'Default'));
    }
    return unique(
      upsell.variantRows
        .filter((v) => v.color.toLowerCase() === selectedColor.name.toLowerCase())
        .map((v) => v.size)
        .filter((s) => s && s !== 'Default')
    );
  }, [selectedColor, upsell.variantRows]);

  const currentVariant = upsell.variantRows.find(v => {
    const cMatch = selectedColor ? v.color.toLowerCase() === selectedColor.name.toLowerCase() : true;
    const sMatch = selectedSize ? v.size === selectedSize : true;
    return cMatch && sMatch;
  });

  const price = currentVariant?.price || upsell.salePrice || upsell.regularPrice || upsell.basePrice || 0;
  const sku = currentVariant?.sku || upsell.slug.toUpperCase();

  const handleConfirm = () => {
    onConfirm({
      color: selectedColor?.name,
      size: selectedSize || undefined,
      sku,
      price,
      imageUrl: selectedColor?.image || upsell.mainImageUrl || '',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl"
          >
            <div className="p-6 sm:p-10 space-y-8">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF7348] italic">Complete the Loadout</span>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">Pick Your Options</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Product Info */}
              <div className="flex gap-6 items-center">
                <div className="w-32 h-32 bg-slate-50 rounded-3xl p-3 shrink-0">
                  <img src={selectedColor?.image || upsell.mainImageUrl || ''} alt={upsell.name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{upsell.name}</p>
                  <p className="text-3xl font-black text-slate-900">${price.toFixed(2)}</p>
                </div>
              </div>

              {/* Selectors */}
              <div className="space-y-6">
                {/* Color Selection */}
                {unique(upsell.variantRows.map(v => v.color).filter(c => c && c !== 'Default')).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Color</p>
                    <div className="flex flex-wrap gap-3">
                      {unique(upsell.variantRows.map(v => v.color).filter(c => c && c !== 'Default')).map((color) => {
                        const img = upsell.variantRows.find(v => v.color === color)?.imageUrl || upsell.mainImageUrl || '';
                        return (
                          <button
                            key={color}
                            onClick={() => setSelectedColor({ name: color, image: img })}
                            className={`group relative w-12 h-12 rounded-xl border-2 transition-all p-1 ${selectedColor?.name === color ? "border-black scale-110" : "border-slate-100 hover:border-slate-300"}`}
                          >
                            <img src={img} alt={color} loading="lazy" className="w-full h-full object-cover rounded-lg mix-blend-multiply" />
                            {selectedColor?.name === color && (
                              <div className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {availableSizes.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Size</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase transition-all ${selectedSize === size ? "bg-black text-white scale-105 shadow-lg shadow-black/10" : "bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100"}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <button
                  onClick={handleConfirm}
                  className="w-full bg-black text-white py-5 sm:py-6 rounded-2xl sm:rounded-[24px] font-black uppercase italic tracking-tighter text-lg sm:text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                >
                  <div className="text-left flex-1 pl-4 sm:pl-6">
                    {(upsell.bundlePrice || 0) < (mainProductPrice + price) && (
                      <p className="text-[10px] line-through text-white/40 leading-none mb-1">
                        ${(mainProductPrice + price).toFixed(2)}
                      </p>
                    )}
                    <p className="leading-none tracking-tighter">
                      ${(upsell.bundlePrice ?? (mainProductPrice + price)).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pr-6">
                    <span>Bundle & Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ProductSingleClientProps {
  initialProduct?: any; // Accepting raw product from server
}

const ProductSingleClient: React.FC<ProductSingleClientProps> = ({ initialProduct }) => {
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const router = useRouter();

  const { ref: buyBoxRef, inView: buyBoxInView } = useInView({
    threshold: 0,
    rootMargin: '-100px 0px 0px 0px'
  });

  const showStickyBar = !buyBoxInView;

  const initialMapped = useMemo(() => initialProduct ? mapToDetailedProduct(initialProduct) : null, [initialProduct]);

  const [product, setProduct] = useState<DetailedProduct | null>(initialMapped);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [loadError, setLoadError] = useState<string | null>(null);

  const breadcrumbInfo = useMemo(() => {
    if (!product?.collections?.length) {
      return { parentName: 'Shop', parentSlug: 'shop' };
    }

    // Find a collection that has a parent (this is our subcategory)
    const subCategory = product.collections.find(c => c.parentId);

    let rootCategory = null;
    let sub = subCategory;

    if (subCategory) {
      if (typeof subCategory.parentId === 'object' && subCategory.parentId !== null) {
        // Parent is already populated as an object
        rootCategory = subCategory.parentId;
      } else if (subCategory.parentId) {
        // Parent is a string ID, try to find it in the collections array
        rootCategory = product.collections.find(c => c.id === subCategory.parentId);
      }
    }

    // Fallback: if no root found yet, take the first collection that has no parent
    if (!rootCategory) {
      rootCategory = product.collections.find(c => !c.parentId);
    }

    // If still no root, use the first collection available
    if (!rootCategory && product.collections.length > 0) {
      rootCategory = product.collections[0];
    }

    // If we have a subcategory that is the SAME as the root, clear the sub
    if (sub && rootCategory && (sub.id === (rootCategory as any).id || sub.slug === (rootCategory as any).slug)) {
      sub = undefined;
    }

    return {
      parentName: (rootCategory as any)?.name || 'Shop',
      parentSlug: (rootCategory as any)?.slug || 'shop',
      subName: sub?.name,
      subSlug: sub?.slug
    };
  }, [product]);

  const [selectedColor, setSelectedColor] = useState<{ name: string; image: string } | null>(
    initialMapped?.variants.colors[0] || null
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(() => {
    if (!initialMapped) return null;
    const initialColor = initialMapped.variants.colors[0];
    const sizes = initialColor
      ? unique(
        initialMapped.variantRows
          .filter((v) => (v.color || "").toLowerCase() === initialColor.name.toLowerCase())
          .map((v) => v.size)
          .filter((s) => s && s !== "Default")
      )
      : initialMapped.variants.sizes;
    return sizes[0] || null;
  });

  const [quantity, setQuantity] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(() => {
    if (!initialMapped) return null;
    const hasColors = initialMapped.variants.colors.length > 0;
    const hasSizes = initialMapped.variants.sizes.length > 0;
    const hasBenefits = (initialMapped.benefits as string)?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
    const hasFaqs = Boolean(initialMapped.faqs?.length);

    return hasColors ? "Colors"
      : hasSizes ? "Sizes"
        : hasBenefits ? "Benefits"
          : hasFaqs ? "FAQs"
            : null;
  });
  const [showWishlistBurst, setShowWishlistBurst] = useState(false);
  const [flyingBox, setFlyingBox] = useState<{ id: number; startX: number; startY: number; endX: number; endY: number } | null>(null);

  // Upsell Selection Modal State
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
  const [activeUpsell, setActiveUpsell] = useState<DetailedProduct['upsellProducts'][0] | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      if (!slug) {
        if (!mounted) return;
        setLoadError('Invalid product link.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        let productData = initialProduct;

        if (!productData) {
          const response = await getExploreProductBySlugApi(slug);
          productData = response.product;
        }

        if (!mounted) return;
        const mapped = mapToDetailedProduct(productData);
        setProduct(mapped);

        const initialColor = mapped.variants.colors[0] || null;
        setSelectedColor(initialColor);

        const initialSizes = initialColor
          ? unique(
            mapped.variantRows
              .filter((variant) => (variant.color || '').toLowerCase() === initialColor.name.toLowerCase())
              .map((variant) => variant.size)
              .filter((entry) => entry && entry !== 'Default')
          )
          : mapped.variants.sizes;

        setSelectedSize(initialSizes[0] || null);
        const hasColorsNow = mapped.variants.colors.length > 0;
        const hasSizesNow = mapped.variants.sizes.length > 0;
        const hasBenefitsNow = (mapped.benefits as string)?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
        const hasFaqsNow = Boolean(mapped.faqs?.length);
        setActiveAccordion(
          hasColorsNow ? 'Colors'
            : hasSizesNow ? 'Sizes'
              : hasBenefitsNow ? 'Benefits'
                : hasFaqsNow ? 'FAQs'
                  : null
        );
      } catch {
        if (!mounted) return;
        setLoadError('Product not found or unavailable.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProduct();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const hasColorVariants = Boolean(product?.variants.colors.length);
  const hasSizeVariants = Boolean(product?.variants.sizes.length);

  const availableSizes = selectedColor && product
    ? unique(
      product.variantRows
        .filter((variant) => variant.color.toLowerCase() === selectedColor.name.toLowerCase())
        .map((variant) => variant.size)
        .filter((entry) => entry && entry !== 'Default')
    )
    : product?.variants.sizes || [];

  const selectedVariant = product?.variantRows.find((variant) => {
    const colorMatch = selectedColor ? variant.color.toLowerCase() === selectedColor.name.toLowerCase() : true;
    const sizeMatch = selectedSize ? variant.size === selectedSize : true;
    return colorMatch && sizeMatch;
  });

  const selectedStock = Number(selectedVariant?.stock ?? product?.inventory ?? 0);
  const inventoryMax = Math.max(Number(product?.inventoryMax || 0), selectedStock || 0, 20);
  const stockPercent = Math.max(0, Math.min(100, (selectedStock / inventoryMax) * 100));

  const thumbnails = product
    ? unique([
      ...(selectedColor ? [selectedColor.image] : []),
      ...product.variantRows
        .filter((variant) =>
          selectedColor ? variant.color.toLowerCase() === selectedColor.name.toLowerCase() : true
        )
        .map((variant) => variant.imageUrl || ''),
      product.image,
      ...(product.galleryImages || []),
    ])
    : [];

  const productPrice = Number(product?.price ?? 0);
  const productRegPrice = Number(product?.originalPrice ?? 0);
  const variantPrice = Number(selectedVariant?.price ?? 0);

  // If variant price matches regular price and there's a sale, use the sale price.
  // Otherwise use the variant's custom price or the product's base price.
  const displayPrice = (variantPrice === productRegPrice && productPrice < productRegPrice)
    ? productPrice
    : (variantPrice || productPrice);

  const displayOriginalPrice = productRegPrice;
  const displaySku = selectedVariant?.sku || product?.sku || '00001';

  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedColor?.name, product?.id]);

  useEffect(() => {
    if (!selectedColor || !availableSizes.length) return;
    if (!selectedSize || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedColor, selectedSize]);

  // Strip HTML tags to check if benefits has REAL text content (Quill saves empty as '<p><br></p>')
  const benefitsText = product?.benefits?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() ?? '';
  const hasBenefits = benefitsText.length > 0;
  const hasFaqs = Boolean(product?.faqs?.length);

  const accordions = [
    ...(hasColorVariants ? [{ id: "Colors", title: "Colors", type: 'colors' as const }] : []),
    ...(hasSizeVariants ? [{ id: "Sizes", title: "Sizes", type: 'sizes' as const }] : []),
    ...(hasBenefits ? [{ id: "Benefits", title: "Benefits", type: 'benefits' as const }] : []),
  ];

  const termsAccordions = [
    { id: "Payment", title: "Payment Terms", content: ["Credit Card", "Apple Pay", "Google Pay", "Split Payment"] },
    { id: "Shipping", title: "Shipping Terms", content: ["Standard (3-5 days)", "Express (1-2 days)", "Free over $100"] }
  ];

  const { addItem } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!product) return;
    setIsAddingToCart(true);

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const target = document.getElementById('af1-header-cart-trigger');
    const targetRect = target?.getBoundingClientRect();

    if (targetRect) {
      setFlyingBox({
        id: Date.now(),
        startX: buttonRect.left + buttonRect.width / 2,
        startY: buttonRect.top + buttonRect.height / 2,
        endX: targetRect.left + targetRect.width / 2,
        endY: targetRect.top + targetRect.height / 2,
      });

      window.setTimeout(() => {
        setFlyingBox(null);
      }, 3000);
    }

    await addItem({
      productId: product.id,
      variantSku: displaySku,
      slug: product.slug,
      name: product.title,
      imageUrl: thumbnails[0] || product.image,
      price: displayPrice,
      quantity,
      color: selectedColor?.name,
      size: selectedSize || undefined,
    });

    setIsAddingToCart(false);

    window.dispatchEvent(new CustomEvent('af1:add-to-cart', { detail: { qty: quantity } }));
  };

  const handleUpsellAddToCart = async (item: any, buttonRect: DOMRect) => {
    const target = document.getElementById('af1-header-cart-trigger');
    const targetRect = target?.getBoundingClientRect();

    if (targetRect) {
      setFlyingBox({
        id: Date.now(),
        startX: buttonRect.left + buttonRect.width / 2,
        startY: buttonRect.top + buttonRect.height / 2,
        endX: targetRect.left + targetRect.width / 2,
        endY: targetRect.top + targetRect.height / 2,
      });

      window.setTimeout(() => {
        setFlyingBox(null);
      }, 3000);
    }

    await addItem(item);
    window.dispatchEvent(new CustomEvent('af1:add-to-cart', { detail: { qty: 1 } }));
  };

  const handleUpsellBundleAction = (upsell: DetailedProduct['upsellProducts'][0]) => {
    setActiveUpsell(upsell);
    setIsUpsellModalOpen(true);
  };

  const handleUpsellConfirm = async (selection: { color?: string; size?: string; sku: string; price: number; imageUrl: string }) => {
    if (!product || !activeUpsell) return;

    const bundleId = `bundle-${product.id}-${activeUpsell.id}-${Date.now()}`;
    const bundleName = `Tactical Bundle: ${product.title} + ${activeUpsell.name}`;

    // Calculate prices for splitting if admin-defined bundle price exists
    let mainCartPrice = displayPrice;
    let upsellCartPrice = selection.price;

    if (activeUpsell.bundlePrice) {
      // Split logic: Main keeps its current price, Upsell covers the delta to reach bundle total
      mainCartPrice = displayPrice;
      upsellCartPrice = Math.max(0, activeUpsell.bundlePrice - displayPrice);
    }

    // 1. Add Main Product to Cart as bundle component
    await addItem({
      productId: product.id,
      variantSku: displaySku,
      slug: product.slug,
      name: product.title,
      imageUrl: thumbnails[0] || product.image,
      price: mainCartPrice,
      originalPrice: displayPrice,
      quantity: quantity,
      color: selectedColor?.name,
      size: selectedSize || undefined,
      bundleId,
      bundleName
    });

    // 2. Add Upsell Product to Cart as bundle component
    await addItem({
      productId: activeUpsell.id,
      variantSku: selection.sku,
      slug: activeUpsell.slug,
      name: activeUpsell.name,
      imageUrl: selection.imageUrl,
      price: upsellCartPrice,
      originalPrice: selection.price,
      quantity: 1,
      color: selection.color,
      size: selection.size,
      bundleId,
      bundleName
    });

    setIsUpsellModalOpen(false);
    toast.success("Bundle added! Redirecting to checkout...", { theme: "dark" });

    // 3. Instant Extraction to Checkout
    setTimeout(() => {
      router.push('/checkout');
    }, 800);
  };

  const { toggleItem, isInWishlist } = useWishlist();
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleWishlistToggle = () => {
    if (!product) return;

    setShowWishlistBurst(true);
    window.setTimeout(() => setShowWishlistBurst(false), 850);

    toggleItem({
      productId: product.id,
      name: product.title,
      imageUrl: product.image,
      price: product.price
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden w-full max-w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 lg:gap-24">
            <div className="space-y-6">
              <Skeleton className="h-[520px] rounded-[40px]" />
              <Skeleton className="h-40 rounded-4xl" />
              <Skeleton className="h-28 rounded-4xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-11/12" />
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-16 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (!product || loadError) {
    return (
      <div className="min-h-screen bg-white w-full flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-slate-700 font-black uppercase tracking-wide">{loadError || 'Product not found.'}</p>
          <Link href="/" className="text-[#FF7348] text-xs font-bold uppercase tracking-wider">Back to Collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full max-w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:pb-20 lg:py-10 overflow-x-hidden">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-black mb-10 group transition-colors">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-wider text-xs">Back to Collection</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 lg:gap-24">
          {/* Left Column: Images & Reviews List */}
          <div className="space-y-12">
            {/* Image Gallery with Thumbnails on Left */}
            <div className="flex flex-col-reverse md:flex-row gap-6">
              {/* Thumbnails Rail */}
              <div className="w-full md:w-24 shrink-0 overflow-x-auto md:overflow-visible">
                <div className="flex md:flex-col gap-3 md:gap-4 w-max md:w-full pr-1">
                  {thumbnails.map((thumb, idx) => (
                    <button
                      key={idx}
                      onClick={() => onThumbClick(idx)}
                      className={`relative min-w-[64px] w-[20vw] max-w-[80px] md:min-w-0 md:w-full aspect-square rounded-xl overflow-hidden bg-slate-50 border-2 transition-all p-1 group shrink-0 ${selectedIndex === idx ? "border-black scale-95" : "border-transparent hover:border-slate-200"
                        }`}
                    >
                      <img src={thumb} alt={`thumb-${idx}`} loading="lazy" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                      {selectedIndex === idx && (
                        <div className="absolute inset-0 bg-black/5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Carousel */}
              <div className="flex-1 overflow-hidden rounded-[24px] sm:rounded-[40px] bg-slate-50 border border-slate-100 shadow-sm w-full relative group" ref={emblaRef}>
                <div className="flex h-full select-none cursor-grab active:cursor-grabbing">
                  {thumbnails.map((img, idx) => (
                    <div key={idx} className="flex-[0_0_100%] min-w-0 aspect-square sm:aspect-4/4 relative">
                      <img
                        src={img}
                        alt={`${product.title}-${idx}`}
                        loading={idx === 0 ? "eager" : "lazy"}
                        className="w-full h-full object-contain mix-blend-multiply pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Mobile Slide Index */}
                <div className="sm:hidden absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                  {selectedIndex + 1} / {thumbnails.length}
                </div>
              </div>
            </div>

            {/* Latest Review — Mobile Optimized Feed */}
            {product.reviews.length > 0 && (() => {
              const latest = product.reviews[product.reviews.length - 1];
              const avatarUrl = latest.userAvatar?.url || (latest.photos?.length > 0 ? latest.photos[0].url : null);
              
              return (
                <div className="hidden sm:block bg-slate-50 rounded-3xl p-5 sm:p-8 space-y-4 border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={latest.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-slate-400 uppercase">{latest.fullName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 leading-none">{latest.fullName}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Verified Operator</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < latest.rating ? 'fill-[#FF7348] text-[#FF7348]' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 text-[13px] leading-relaxed font-medium italic">"{latest.reviewText}"</p>
                </div>
              );
            })()}

            {/* Overall Rating Section (Image 1) */}
            {/* Overall Rating Section */}
            <div className="hidden sm:block">
              {(() => {
                const reviewCount = product.reviews.length;
                const avgRating = reviewCount
                  ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
                  : '—';
                const reviewLabel = reviewCount > 0 ? `${reviewCount} REVIEWS` : 'NO REVIEWS';
                return (
                  <div className="bg-white border border-slate-500 rounded-none px-4 py-3 sm:px-6 sm:py-4 shadow-none">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-center shrink-0 w-[90px] sm:w-[132px]">
                        <div className={`${reviewCount === 0 ? 'text-[2.5rem] sm:text-[3.5rem]' : 'text-[3.2rem] sm:text-[4.5rem]'} font-black tracking-tighter text-[#E56437] leading-[0.9]`}>
                          {reviewCount === 0 ? 'NEW' : avgRating}
                        </div>
                        <div className="text-[1.4rem] sm:text-[2.2rem] font-black uppercase tracking-[0.06em] text-[#E56437] mt-0 leading-none">
                          {reviewCount === 0 ? 'Rating' : 'Rating'}
                        </div>
                      </div>

                      <div className="h-20 sm:h-24 w-px bg-slate-300 shrink-0" />

                      <div className="flex-1 min-w-0 flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2">
                          {product.reviews.length > 0 && (
                            <div className="flex -space-x-2">
                              {product.reviews.slice(0, 4).map((r: any, i) => {
                                const avatarUrl = r.userAvatar?.url || (r.photos?.length > 0 ? r.photos[0].url : null);
                                const initial = r.fullName.charAt(0);
                                
                                return (
                                  <div 
                                    key={i} 
                                    className="relative w-6 h-6 sm:w-10 sm:h-10 rounded-full border-2 border-white overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm"
                                  >
                                    {avatarUrl ? (
                                      <img src={avatarUrl} className="w-full h-full object-cover" alt="reviewer" />
                                    ) : (
                                      <span className="text-[10px] sm:text-sm font-black text-slate-500 uppercase">{initial}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className={`text-[1.4rem] sm:text-[1.4rem] font-black uppercase tracking-[0.04em] leading-none whitespace-nowrap ${reviewCount === 0 ? 'text-slate-400 italic' : 'text-[#E56437]'}`}>
                            {reviewCount === 0 ? 'Be the first to review' : reviewLabel}
                          </div>
                        </div>

                        <button
                          onClick={() => setIsReviewModalOpen(true)}
                          className="shrink-0 bg-[#0F1116] text-white px-5 sm:px-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black uppercase tracking-tight italic text-[1.2rem] sm:text-[2.1rem] leading-none hover:bg-black transition-colors"
                        >
                          Write Review
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column: Product Info & Buy */}
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              {/* Breadcrumbs */}
              <nav className="flex items-center flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/collections/${breadcrumbInfo.parentSlug}`} className="hover:text-black transition-colors">
                  {breadcrumbInfo.parentName}
                </Link>
                {breadcrumbInfo.subName && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/collections/${breadcrumbInfo.parentSlug}/${breadcrumbInfo.subSlug}`} className="text-orange-600 italic hover:text-orange-700 transition-colors">
                      {breadcrumbInfo.subName}
                    </Link>
                  </>
                )}
              </nav>

              <div className="flex justify-between items-start gap-3">
                <h1 className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-[0.95]">
                  {product.title}
                </h1>
                <motion.button
                  type="button"
                  onClick={handleWishlistToggle}
                  whileTap={{ scale: 0.9 }}
                  animate={isWishlisted ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  transition={{ duration: 2.35, ease: 'easeOut' }}
                  className="relative p-3 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                >
                  <Heart className={`w-6 h-6 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />

                  <AnimatePresence>
                    {showWishlistBurst ? (
                      <motion.span
                        initial={{ opacity: 0, y: 6, scale: 0.5 }}
                        animate={{ opacity: 1, y: -24, scale: 1.05 }}
                        exit={{ opacity: 0, y: -38, scale: 0.75 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2"
                      >
                        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400 text-sm font-bold tracking-widest uppercase">SKU: {displaySku}</span>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full">
                  <div className="flex -space-x-1.5">
                    {(product.reviews.length > 0 ? product.reviews.slice(0, 3) : [1, 2, 3]).map((r: any, i) => {
                      const avatarUrl = typeof r === 'object' ? r.userAvatar?.url : null;
                      const initial = typeof r === 'object' ? r.fullName.charAt(0) : '';

                      return (
                        <div 
                          key={i} 
                          className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-white overflow-hidden bg-slate-200 flex items-center justify-center shrink-0"
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} loading="lazy" className="w-full h-full object-cover" alt="av" />
                          ) : (
                            <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase">{initial}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs font-black text-slate-900 leading-none">4.5 <span className="text-[#FF7348] uppercase italic">Rating</span></span>
                </div>
              </div>
            </div>

            {/* Accordions */}
            <div className="space-y-4 pt-1 border-t border-slate-100">
              {accordions.map((acc) => (
                <div key={acc.id} className="border-b border-slate-100 last:border-0 pb-4">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === acc.id ? null : acc.id)}
                    className="w-full flex justify-between items-center py-2 group"
                  >
                    <span className="text-[14px] font-medium uppercase tracking-widest text-slate-900 group-hover:text-black transition-colors">
                      {acc.title}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${activeAccordion === acc.id ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {activeAccordion === acc.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 pb-2">
                          {acc.type === 'colors' ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-4">
                                <div className="text-[11px] font-medium uppercase tracking-widest text-[#FF7348]">Color: <span className="italic">{selectedColor?.name || 'N/A'}</span></div>
                                <button
                                  onClick={() => setSelectedColor(product.variants.colors[0] || null)}
                                  className="text-black text-[10px] font-black uppercase tracking-widest hover:underline"
                                >
                                  Clear
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {product.variants.colors.map((color, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className={`relative w-[47px] h-[47px] rounded-xl overflow-hidden bg-slate-50 border-2 transition-all p-1 ${selectedColor?.name === color.name ? "border-black ring-4 ring-black/5" : "border-slate-100 hover:border-slate-300"
                                      }`}
                                  >
                                    <img src={color.image} alt={color.name} loading="lazy" className="w-full h-full object-cover mix-blend-multiply" />
                                    {selectedColor?.name === color.name && (
                                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                        <Check className="w-6 h-6 text-white bg-black rounded-full p-1" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : acc.type === 'sizes' ? (
                            <div className="grid grid-cols-6 sm:grid-cols-10 gap-0">
                              {(availableSizes.length ? availableSizes : product.variants.sizes).map((size) => (
                                <button
                                  key={size}
                                  onClick={() => setSelectedSize(size)}
                                  className={`py-1 w-[47px] h-[47px] rounded-xl font-black text-[11px] transition-all ${selectedSize === size
                                    ? "bg-black text-white shadow-md scale-95"
                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-black border border-slate-100"
                                    }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          ) : acc.type === 'benefits' ? (
                            <div
                              className="prose prose-sm max-w-none text-slate-600 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-1 [&_strong]:font-black [&_strong]:text-slate-900"
                              dangerouslySetInnerHTML={{ __html: product.benefits }}
                            />
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Inventory Status (Image 1) */}
            {product.orderType !== 'request' && (
              <div className="space-y-4 pt-0">
                <div className="relative">
                  <div className="flex items-end justify-between mb-2">
                    <div className="flex items-end gap-2 text-2xl font-black italic uppercase tracking-tighter text-[#FF7348]">
                      <span>{selectedStock}</span>
                      <span className="text-sm mb-1">Left</span>
                    </div>
                    
                    {selectedStock > 0 && selectedStock < 10 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest italic flex items-center gap-1.5 shadow-lg shadow-red-500/20"
                      >
                        <Zap className="w-3 h-3 fill-white animate-pulse" />
                        <span>Hurry Up! Almost Gone</span>
                      </motion.div>
                    )}
                  </div>

                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-linear-to-r from-red-500 via-blue-500 to-red-500 animate-rainbow opacity-80" />
                    <div className="absolute top-0 right-0 h-full bg-slate-100 transition-all duration-1000" style={{ width: `${50 - stockPercent}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg z-10" style={{ left: `calc(${stockPercent}% + 48%)` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="space-y-2">
              {product.orderType !== 'request' ? (
                <div className="flex flex-row items-baseline gap-3 sm:gap-4">
                  <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-slate-900">${displayPrice.toFixed(2)}</span>
                  {displayOriginalPrice > displayPrice && (
                    <span className="text-lg sm:text-xl text-slate-300 font-bold line-through">${displayOriginalPrice.toFixed(2)}</span>
                  )}
                  <Link href="#" className="hidden sm:block sm:ml-auto text-xs font-black uppercase tracking-[0.18em] text-[#FF7348] border-b-2 border-[#FF7348] hover:text-[#ff8f6d] hover:border-[#ff8f6d] transition-colors pb-1 italic w-fit">
                    Sizes & Colors Guide
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-orange-50 p-6 rounded-2xl border border-orange-100">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 leading-none mb-1">Deployment Phase</p>
                    <h4 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Custom Quote Required</h4>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-orange-600 sm:ml-auto" />
                </div>
              )}
            </div>

            <div ref={buyBoxRef} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {product.orderType !== 'request' && (
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-slate-400 hover:text-black transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-12 text-center font-black italic text-lg sm:text-xl tabular-nums">
                    {quantity.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => {
                      const inv = product?.inventory as any;
                      const baseStock = typeof inv === 'number' ? inv : inv?.globalStock;
                      const maxStock = selectedVariant?.stock ?? baseStock ?? 99;
                      setQuantity(Math.min(maxStock, quantity + 1));
                    }}
                    className="p-2 text-slate-400 hover:text-black transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              {product.orderType === 'request' ? (
                <Link
                  href={`/request-order-form?productId=${product.id}&product=${encodeURIComponent(product.title)}&category=${encodeURIComponent(product.collections?.find(c => !c.parentId)?.name || 'Product')}&subcategory=${encodeURIComponent(product.collections?.find(c => c.parentId)?.name || '')}`}
                  className="flex-1 flex items-center justify-center gap-2 sm:gap-3 rounded-2xl font-black uppercase italic tracking-tighter text-lg sm:text-xl px-4 py-4 bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-xl active:scale-95 w-full"
                >
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Request Quote</span>
                </Link>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="relative flex-1 flex items-center justify-center gap-2 sm:gap-3 rounded-2xl font-black uppercase italic tracking-tighter text-lg sm:text-xl px-4 py-4 bg-[#141414] hover:bg-black text-white transition-all shadow-xl active:scale-95 w-full"
                >
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Add to Cart</span>
                </button>
              )}
            </div>

            {/* Big Action Button */}
            {product.orderType === 'request' ? (
              <Link
                href={`/request-order-form?productId=${product.id}&product=${encodeURIComponent(product.title)}&category=${encodeURIComponent(product.collections?.find(c => !c.parentId)?.name || 'Product')}&subcategory=${encodeURIComponent(product.collections?.find(c => c.parentId)?.name || '')}`}
                className="w-full text-white py-4 sm:py-6 rounded-3xl font-black uppercase italic tracking-tighter text-xl sm:text-2xl transition-all shadow-xl active:scale-95 bg-black hover:bg-slate-900 border-2 border-orange-500 hover:shadow-2xl flex items-center justify-center gap-3 sm:gap-4"
              >
                <span>Submit Inquiry</span>
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </Link>
            ) : (
              <button
                onClick={undefined}
                className="w-full text-white py-4 sm:py-6 rounded-3xl font-black uppercase italic tracking-tighter text-xl sm:text-2xl transition-all shadow-xl active:scale-95 bg-[#E5633D] hover:bg-[#d45431] hover:shadow-2xl flex items-center justify-center gap-3 sm:gap-4"
              >
                <span>Buy Now</span>
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Trust Badges (Moved to bottom) */}

            {/* Payment & Shipping Terms (moved below trust badges) */}
            <div className="pt-8 border-t border-slate-100 space-y-4">
              {termsAccordions.map((acc) => (
                <div key={acc.id} className="border-b border-slate-100 pb-4">
                  <button
                    className="w-full flex justify-between items-center py-2"
                    onClick={() => setActiveAccordion(activeAccordion === acc.id ? null : acc.id)}
                  >
                    <span className="text-lg font-black italic uppercase tracking-tighter text-slate-900">{acc.title}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${activeAccordion === acc.id ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {activeAccordion === acc.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4">
                          <ul className="space-y-3">
                            {acc.content?.map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF7348]" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Tactical Bundle — One Time Offer Section */}
            {product.upsellProducts.length > 0 && product.orderType !== 'request' && (
              <div className="pt-12 md:pt-16 space-y-8">
                <div className="flex justify-between items-center gap-3">
                  <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-slate-900">One-Time Tactical Offer</h3>
                  <div className="bg-[#FF7348] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest italic animate-pulse">Save on Bundle</div>
                </div>

                {product.upsellProducts.map((upsell) => {
                  const upsellCurrentPrice = Number(upsell.salePrice ?? upsell.regularPrice ?? upsell.basePrice ?? 0);
                  const mainCurrentPrice = product.price; // Current sale or regular price

                  const combinedCurrentTotal = mainCurrentPrice + upsellCurrentPrice;
                  const bundleTotal = upsell.bundlePrice ?? combinedCurrentTotal;

                  const hasBundleDiscount = bundleTotal < combinedCurrentTotal;

                  return (
                    <div key={upsell.id} className="group p-6 sm:p-8 md:p-10 border-4 border-slate-100 rounded-[40px] md:rounded-[48px] relative overflow-hidden hover:border-black transition-all duration-500 bg-white">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-10">
                        {/* Main Product */}
                        <div className="space-y-4 text-center">
                          <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden p-4 group-hover:scale-105 transition-transform">
                            <img src={product.image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase text-slate-400 line-clamp-1 leading-tight">{product.title}</p>
                            <p className="text-sm font-black text-slate-900">${mainCurrentPrice.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="text-3xl font-black text-slate-200">+</div>

                        {/* Upsell Product */}
                        <div className="space-y-4 text-center">
                          <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden p-4 group-hover:scale-105 transition-transform">
                            <img src={upsell.mainImageUrl || ''} alt={upsell.name} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase text-slate-400 line-clamp-1 leading-tight">{upsell.name}</p>
                            <p className="text-sm font-black text-slate-900">${upsellCurrentPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 pt-8 border-t-2 border-dashed border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-center sm:text-left">
                          {hasBundleDiscount && (
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 line-through mb-1">
                              ${combinedCurrentTotal.toFixed(2)}
                            </p>
                          )}
                          <p className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
                            ${bundleTotal.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUpsellBundleAction(upsell)}
                          className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-[24px] font-black uppercase italic tracking-tighter text-xl flex items-center justify-center gap-3 hover:bg-[#FF7348] transition-all shadow-2xl active:scale-95"
                        >
                          <ShoppingBag className="w-6 h-6" />
                          <span>Grab the Bundle</span>
                        </button>
                      </div>

                      {/* High-Fidelity Badge */}
                      <div className="absolute top-0 right-0 bg-black text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest italic">
                        Tactical Sync
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Agent Contact */}
            <button className="w-full border-2 border-black py-4 sm:py-6 rounded-2xl font-black uppercase italic tracking-tighter text-xl sm:text-2xl hover:bg-black hover:text-white transition-all group flex items-center justify-center gap-3 sm:gap-4">
              <span>Contact Our Agent</span>
              <Zap className="w-6 h-6 group-hover:fill-current" />
            </button>
          </div>
        </div>

        <div className="mt-10 space-y-8 lg:mt-14">
          {product.description && product.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0 && (
            <div className="rounded-3xl p-6 sm:p-8 bg-[#efefef] w-full overflow-hidden">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 text-center">Description of Product</h3>
              <div
                className="mt-4 text-sm font-medium leading-relaxed text-slate-600 prose prose-sm max-w-none w-full overflow-hidden break-words 
  text-center
  [&_p]:text-center
  [&_ul]:list-disc [&_ul]:pl-0 [&_ul]:text-left [&_ul]:list-inside
  [&_ol]:list-decimal [&_ol]:pl-0 [&_ol]:text-left [&_ol]:list-inside
  [&_li]:text-center [&_li]:my-1
  [&_table]:mx-auto [&_table]:text-center [&_table]:table-auto
  [&_th]:text-center [&_td]:text-center
  [&_img]:mx-auto [&_img]:block
  [&_strong]:font-medium [&_strong]:text-slate-900
  [&_pre]:overflow-x-auto
  [&_*]:max-w-full"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* FAQ section removed from here */}

          {product.mainVideo && <MainVideoSection mainVideo={product.mainVideo} />}
          {product.videoReviews.length > 0 && <VideoReviews videoReviews={product.videoReviews} />}
          <ShopFeaturesFaqSection />
          <ProductReviews reviews={product.reviews} />

          {/* Overall Rating Section (Mobile Only at the end) */}
          <div className="sm:hidden mt-10">
            {(() => {
              const reviewCount = product.reviews.length;
              const avgRating = reviewCount
                ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
                : '—';
              const reviewLabel = reviewCount > 0 ? `${reviewCount} REVIEWS` : 'NO REVIEWS';
              return (
                <div className="bg-white border border-slate-500 rounded-none px-4 py-3 shadow-none">
                  <div className="flex items-center gap-4">
                    <div className="text-center shrink-0 w-[90px]">
                      <div className="text-[3.2rem] font-black tracking-tighter text-[#E56437] leading-[0.9]">
                        {avgRating}
                      </div>
                      <div className="text-[1.4rem] font-black uppercase tracking-[0.06em] text-[#E56437] mt-0 leading-none">
                        Rating
                      </div>
                    </div>

                    <div className="h-20 w-px bg-slate-300 shrink-0" />

                    <div className="flex-1 min-w-0 flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {(product.reviews.length > 0 ? product.reviews.slice(0, 4) : [1, 2, 3, 4]).map((r: any, i) => {
                            const hasPhoto = typeof r === 'object' && r.photos?.length > 0;
                            const avatarUrl = hasPhoto ? r.photos[0].url : null;
                            const initial = typeof r === 'object' ? r.fullName.charAt(0) : '?';

                            return (
                              <div 
                                key={i} 
                                className="relative w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm"
                              >
                                {avatarUrl ? (
                                  <img src={avatarUrl} className="w-full h-full object-cover" alt="reviewer" />
                                ) : (
                                  <span className="text-[10px] font-black text-slate-500 uppercase">{initial}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-[1.4rem] font-black uppercase tracking-[0.04em] text-[#E56437] leading-none whitespace-nowrap">
                          {reviewLabel}
                        </div>
                      </div>

                      <button
                        onClick={() => setIsReviewModalOpen(true)}
                        className="shrink-0 bg-[#0F1116] text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-tight italic text-[1.2rem] leading-none hover:bg-black transition-colors"
                      >
                        Write Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productId={product.id}
        productTitle={product.title}
      />

      {activeUpsell && product && (
        <UpsellSelectionModal
          isOpen={isUpsellModalOpen}
          onClose={() => setIsUpsellModalOpen(false)}
          upsell={activeUpsell}
          mainProductPrice={product.price}
          onConfirm={handleUpsellConfirm}
        />
      )}

      {/* Dynamic styles for rainbow animation */}
      <style>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-rainbow {
          background-size: 200% 200%;
          animation: rainbow 5s ease infinite;
        }
      `}</style>

      <AnimatePresence>
        {flyingBox && (
          <motion.div
            key={flyingBox.id}
            initial={{ left: flyingBox.startX, top: flyingBox.startY, scale: 1, opacity: 1, rotate: 0 }}
            animate={{ left: flyingBox.endX, top: flyingBox.endY, scale: 0.25, opacity: 0.2, rotate: 24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="pointer-events-none fixed z-200 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-2xl">
              <ShoppingBag className="h-5 w-5 text-black" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical Sticky Action Bar (Universal) */}
      <AnimatePresence>
        {showStickyBar && product && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-15px_40px_rgba(0,0,0,0.12)]"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-8">
              {/* Desktop: Product Info Peek */}
              <div className="hidden sm:flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0">
                  <img src={thumbnails[0]} alt="product" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 truncate leading-none">
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {selectedColor?.name || 'Standard'} / {selectedSize || 'OS'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-8 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.1em] leading-none mb-1">Deployment Cost</p>
                  <div className="flex items-baseline gap-1 justify-start sm:justify-end">
                    <p className="text-xl sm:text-2xl font-black italic tracking-tighter text-slate-900 leading-none">${displayPrice.toFixed(2)}</p>
                    <span className="text-[10px] font-bold text-slate-400">x{quantity}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="bg-[#E5633D] text-white px-6 sm:px-12 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase italic tracking-tighter text-xs sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-orange-500/20 hover:bg-orange-600"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Deploy to Cart</span>
                  <span className="xs:hidden">Deploy</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic spacing spacer to avoid content overlap at the very bottom */}
      <div className="h-20 sm:h-24 lg:hidden" />
    </div>
  );
};

export default ProductSingleClient;
