
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { toast } from 'react-toastify';
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
  ChevronRight,
  ArrowLeft,
  Play,
  X
} from 'lucide-react';
import { ReviewModal } from '../_components/ReviewModal';
import { VideoReviews } from '../_components/VideoReviews';
import { ProductReviews } from '../_components/ProductReviews';
import { Product } from '@/types';
import { getExploreProductBySlugApi } from '@/lib/api/publicProducts';

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
      <h2 className="text-lg font-black text-slate-900">Product Video</h2>
      <div className="mt-4 rounded-3xl bg-black p-4 sm:p-6">
        <div className="relative mx-auto aspect-video max-w-3xl overflow-hidden rounded-2xl bg-black">
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
  }[];
  reviews: {
    id: string;
    rating: number;
    fullName: string;
    reviewText: string;
    photos: { url: string; publicId: string }[];
    createdAt?: string;
  }[];
  mainVideo: MainVideoData | null;
  videoReviews: VideoReviewItem[];
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
    sku: variant.sku || `${(raw.slug || 'PRODUCT').toUpperCase()}-${index + 1}`,
    imageUrl: variant.imageUrl,
    isActive: variant.isActive,
  }));

  const inventoryTotalFromVariants = variantRows.reduce((sum: number, row: any) => sum + Number(row.stock || 0), 0);
  const inventoryTotal = Number(raw.inventory?.globalStock ?? inventoryTotalFromVariants ?? 0);

  const regularPrice = Number(raw.regularPrice ?? raw.basePrice ?? 0);
  const salePrice = Number(raw.salePrice ?? regularPrice);
  const discount = regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  return {
    id: raw.id,
    title: raw.name,
    sku: variantRows[0]?.sku || (raw.slug || '00001').toUpperCase(),
    category: raw.collections?.[0]?.name || 'Product',
    price: salePrice,
    originalPrice: regularPrice,
    discount: discount > 0 ? `${discount}% OFF` : '',
    rating: 4.5,
    image: raw.mainImageUrl,
    benefits: raw.benefits || '',
    faqs: raw.faqs || [],
    upsellProducts: raw.upsellProducts || [],
    reviews: raw.reviews || [],
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
    galleryImages: (raw.galleryImages || []).map((entry: any) => entry.url),
  };
}

const ProductSingleClient: React.FC = () => {
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<{ name: string; image: string } | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showWishlistBurst, setShowWishlistBurst] = useState(false);
  const [flyingBox, setFlyingBox] = useState<{ id: number; startX: number; startY: number; endX: number; endY: number } | null>(null);

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
        const response = await getExploreProductBySlugApi(slug);
        if (!mounted) return;

        const mapped = mapToDetailedProduct(response.product);
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

  const displayPrice = Number(selectedVariant?.price ?? product?.price ?? 0);
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
    ...(hasFaqs ? [{ id: "FAQs", title: "FAQs", type: 'faqs' as const }] : []),
  ];

  const termsAccordions = [
    { id: "Payment", title: "Payment Terms", content: ["Credit Card", "Apple Pay", "Google Pay", "Split Payment"] },
    { id: "Shipping", title: "Shipping Terms", content: ["Standard (3-5 days)", "Express (1-2 days)", "Free over $100"] }
  ];

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
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

    window.dispatchEvent(new CustomEvent('af1:add-to-cart', { detail: { qty: quantity } }));

    toast.success(`${quantity} item${quantity > 1 ? 's' : ''} added to cart`, {
      icon: <ShoppingBag className="h-4 w-4" />,
    });
  };

  const handleWishlistToggle = () => {
    const next = !isWishlisted;
    setIsWishlisted(next);
    setShowWishlistBurst(true);
    window.setTimeout(() => setShowWishlistBurst(false), 850);

    if (next) {
      toast.success('Added to wishlist', {
        icon: <Heart className="h-4 w-4 fill-red-500 text-red-500" />,
      });
      return;
    }

    toast.info('Removed from wishlist', {
      icon: <Heart className="h-4 w-4" />,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden w-full max-w-full animate-pulse">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="h-6 w-40 bg-slate-100 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 lg:gap-24">
            <div className="space-y-6">
              <div className="h-[520px] bg-slate-100 rounded-[40px]" />
              <div className="h-40 bg-slate-100 rounded-4xl" />
              <div className="h-28 bg-slate-100 rounded-4xl" />
            </div>
            <div className="space-y-4">
              <div className="h-10 w-11/12 bg-slate-100 rounded" />
              <div className="h-7 w-1/2 bg-slate-100 rounded" />
              <div className="h-44 bg-slate-100 rounded-2xl" />
              <div className="h-24 bg-slate-100 rounded-2xl" />
              <div className="h-14 bg-slate-100 rounded-2xl" />
              <div className="h-16 bg-slate-100 rounded-3xl" />
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
                      className={`relative min-w-[92px] w-[29vw] max-w-[124px] md:min-w-0 md:w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 border-2 transition-all p-1 group shrink-0 ${
                        selectedIndex === idx ? "border-black scale-95" : "border-transparent hover:border-slate-200"
                      }`}
                    >
                      <img src={thumb} alt={`thumb-${idx}`} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                      {selectedIndex === idx && (
                        <div className="absolute inset-0 bg-black/5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Carousel */}
              <div className="flex-1 overflow-hidden rounded-[40px] bg-slate-50 border border-slate-100 shadow-sm" ref={emblaRef}>
                <div className="flex h-full select-none cursor-grab active:cursor-grabbing">
                  {thumbnails.map((img, idx) => (
                    <div key={idx} className="flex-[0_0_100%] min-w-0 aspect-4/5 relative">
                      <img 
                        src={img} 
                        alt={`${product.title}-${idx}`}
                        className="w-full h-full object-contain mix-blend-multiply pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Latest Review — shown just below the images */}
            {product.reviews.length > 0 && (() => {
              const latest = product.reviews[product.reviews.length - 1];
              return (
                <div className="bg-slate-50 rounded-4xl p-8 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black text-lg uppercase ring-2 ring-white shrink-0">
                        {latest.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black italic uppercase tracking-tighter text-slate-900 leading-none">{latest.fullName}</h4>
                        <p className="text-slate-400 text-xs font-bold mt-1">Verified Buyer</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < latest.rating ? 'fill-[#FF7348] text-[#FF7348]' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  {latest.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {latest.photos.slice(0, 4).map((photo) => (
                        <img key={photo.publicId} src={photo.url} alt="Review photo" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200" />
                      ))}
                    </div>
                  )}
                  <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-4">{latest.reviewText}</p>
                </div>
              );
            })()}

            {/* Overall Rating Section (Image 1) */}
            {/* Overall Rating Section */}
            {(() => {
              const reviewCount = product.reviews.length;
              const avgRating = reviewCount
                ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
                : '—';
              return (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-4xl p-5 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="text-5xl sm:text-6xl font-black italic tracking-tighter text-[#FF7348] leading-none">{avgRating}</div>
                      <div className="text-xs font-black uppercase tracking-widest text-[#FF7348] mt-2 italic">Rating</div>
                    </div>
                    <div className="h-16 w-px bg-slate-200" />
                    <div>
                       <div className="flex -space-x-3 mb-2">
                         {[1,2,3,4].map(i => (
                           <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-2 border-white" alt="reviewer" />
                         ))}
                       </div>
                       <div className="text-sm font-black uppercase tracking-wider text-slate-900">
                         {reviewCount > 0 ? `${reviewCount} Review${reviewCount !== 1 ? 's' : ''}` : 'No Reviews Yet'}
                       </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsReviewModalOpen(true)}
                    className="bg-[#141414] text-white px-6 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-base sm:text-lg hover:bg-black transition-all hover:scale-105 shadow-xl w-full sm:w-auto"
                  >
                    Write Review
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Right Column: Product Info & Buy */}
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
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
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?u=${i+10}`} className="w-6 h-6 rounded-full border-2 border-white" alt="av" />
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-900 leading-none">4.5 <span className="text-[#FF7348] uppercase italic">Rating</span></span>
                </div>
              </div>
            </div>

            {/* Accordions */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              {accordions.map((acc) => (
                <div key={acc.id} className="border-b border-slate-100 last:border-0 pb-4">
                  <button 
                    onClick={() => setActiveAccordion(activeAccordion === acc.id ? null : acc.id)}
                    className="w-full flex justify-between items-center py-2 group"
                  >
                    <span className="text-sm font-black uppercase tracking-widest text-slate-900 group-hover:text-black transition-colors">
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
                            <div className="space-y-6">
                              <div className="text-lg font-bold text-slate-900">Color: <span className="italic">{selectedColor?.name || 'N/A'}</span></div>
                              <div className="flex flex-wrap gap-4">
                                {product.variants.colors.map((color, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className={`relative w-[52px] h-[52px] rounded-xl overflow-hidden bg-slate-50 border-2 transition-all p-1 ${
                                      selectedColor?.name === color.name ? "border-black ring-4 ring-black/5" : "border-slate-100 hover:border-slate-300"
                                    }`}
                                  >
                                    <img src={color.image} alt={color.name} className="w-full h-full object-cover mix-blend-multiply" />
                                    {selectedColor?.name === color.name && (
                                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                        <Check className="w-6 h-6 text-white bg-black rounded-full p-1" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <button 
                                onClick={() => setSelectedColor(product.variants.colors[0] || null)}
                                className="text-[#FF7348] text-xs font-black uppercase tracking-widest hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                          ) : acc.type === 'sizes' ? (
                            <div className="grid grid-cols-5 gap-3">
                              {(availableSizes.length ? availableSizes : product.variants.sizes).map((size) => (
                                <button 
                                  key={size}
                                  onClick={() => setSelectedSize(size)}
                                  className={`py-4 rounded-xl font-black transition-all ${
                                    selectedSize === size 
                                      ? "bg-black text-white shadow-xl scale-95" 
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
                          ) : acc.type === 'faqs' ? (
                            <div className="space-y-4">
                              {product.faqs.map((faq, i) => (
                                <div key={i} className="space-y-1">
                                  <p className="text-sm font-black text-slate-900">{faq.question}</p>
                                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{faq.answer}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Inventory Status (Image 1) */}
            <div className="space-y-4 pt-4">
              <div className="flex items-end gap-2 text-2xl font-black italic uppercase tracking-tighter text-[#FF7348]">
                <span>{selectedStock}</span>
                <span className="text-sm mb-1">Left</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-linear-to-r from-red-500 via-blue-500 to-red-500 animate-rainbow opacity-80" />
                <div className="absolute top-0 right-0 h-full bg-slate-100 transition-all duration-1000" style={{ width: `${100 - stockPercent}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg z-10" style={{ left: `calc(${stockPercent}% - 8px)` }} />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-4">
                  <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-slate-900">${displayPrice.toFixed(2)}</span>
                  <span className="text-lg sm:text-xl text-slate-300 font-bold line-through">${product.originalPrice}</span>
                  <Link href="#" className="sm:ml-auto text-xs font-black uppercase tracking-[0.18em] text-[#FF7348] border-b-2 border-[#FF7348] hover:text-[#ff8f6d] hover:border-[#ff8f6d] transition-colors pb-1 italic w-fit">
                  Sizes & Colors Guide
                </Link>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-slate-400 hover:text-black transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="relative flex-1 flex items-center justify-center gap-2 sm:gap-3 bg-[#141414] text-white rounded-2xl font-black uppercase italic tracking-tighter text-lg sm:text-xl px-4 py-4 hover:bg-black transition-all shadow-xl active:scale-95 w-full"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Add to Cart</span>
              </button>
            </div>

            {/* Big Action Button */}
            <button 
              className="w-full bg-[#E5633D] text-white py-4 sm:py-6 rounded-3xl font-black uppercase italic tracking-tighter text-xl sm:text-2xl hover:bg-[#d45431] transition-all shadow-xl active:scale-95 hover:shadow-2xl flex items-center justify-center gap-3 sm:gap-4"
            >
              <span>Buy Now</span>
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-2xl">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-tight italic">Worldwide Shipping</h5>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Free delivery on all orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-2xl">
                  <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-tight italic">24/7 Online Support</h5>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Always ready to assist you</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-2xl">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-tight italic">Free 30 Days Return</h5>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">30 days return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-tight italic">Safe Checkout</h5>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Ensuring your safety</p>
                </div>
              </div>
            </div>

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

            {/* Upsell / Bundle Section — only shown if upsell products exist */}
            {product.upsellProducts.length > 0 && (
              <div className="pt-10 md:pt-12 space-y-6">
                <div className="flex justify-between items-center gap-3">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Just for You — One Time Offer</h3>
                  <div className="bg-black text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest italic">Bundle Deal</div>
                </div>
                {product.upsellProducts.map((upsell) => {
                  const upsellPrice = Number(upsell.salePrice ?? upsell.regularPrice ?? upsell.basePrice ?? 0);
                  const upsellOriginal = Number(upsell.regularPrice ?? upsell.basePrice ?? 0);
                  const combinedOriginal = (product.originalPrice + upsellOriginal).toFixed(2);
                  const combinedSale = (product.price + upsellPrice).toFixed(2);
                  return (
                    <div key={upsell.id} className="p-5 sm:p-6 md:p-8 border-2 border-slate-200 rounded-[32px] md:rounded-[40px] relative overflow-hidden">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-6 min-w-0">
                        <div className="space-y-4 min-w-0">
                          <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden p-2">
                            <img src={product.image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-400 line-clamp-2 leading-tight">{product.title}</p>
                            <p className="text-xs font-black text-slate-900">${product.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="self-center text-2xl font-black text-slate-300">+</div>
                        <div className="space-y-4 min-w-0">
                          <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden p-2">
                            {upsell.mainImageUrl ? (
                              <img src={upsell.mainImageUrl} alt={upsell.name} className="w-full h-full object-contain mix-blend-multiply" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase">No Image</div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-400 line-clamp-2 leading-tight">{upsell.name}</p>
                            <p className="text-xs font-black text-slate-900">${upsellPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-8 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 line-through tracking-wider leading-none mb-1">${combinedOriginal}</span>
                          <span className="text-4xl font-black italic tracking-tighter text-slate-900 leading-none">${combinedSale}</span>
                        </div>
                        <button className="flex items-center justify-center gap-3 bg-black text-white px-6 sm:px-8 py-4 sm:py-5 rounded-[20px] font-black uppercase italic tracking-tighter text-lg sm:text-xl hover:scale-105 transition-all shadow-xl active:scale-95 w-full sm:w-auto">
                          <ShoppingBag className="w-6 h-6" />
                          <span>Buy Now</span>
                        </button>
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
            <div className="text-center rounded-3xl p-6 sm:p-8 bg-[#efefef]">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Description of Product</h3>
              <div 
                className="mt-4 text-sm font-semibold leading-relaxed text-slate-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-1 [&_strong]:font-black [&_strong]:text-slate-900 [&_p]:mb-3 mx-auto text-left sm:text-center"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {product.mainVideo && <MainVideoSection mainVideo={product.mainVideo} />}
          {product.videoReviews.length > 0 && <VideoReviews videoReviews={product.videoReviews} />}
          <ProductReviews reviews={product.reviews} />
        </div>
      </div>

      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
        productTitle={product.title} 
      />
      
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
    </div>
  );
};

export default ProductSingleClient;
