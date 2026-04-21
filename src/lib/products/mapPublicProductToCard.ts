import { PublicProduct } from '@/lib/api/types';
import { Product } from '@/types';

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ');
}

export function mapPublicProductToCard(product: PublicProduct): Product {
  const regular = product.regularPrice ?? product.basePrice;
  const sale = product.salePrice ?? regular;
  const discount = regular > sale ? Math.round(((regular - sale) / regular) * 100) : 0;

  const category =
    product.collections.find((entry) => entry.slug?.toLowerCase() === 'merchandise')?.name ||
    product.collections[0]?.name ||
    'Product';

  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    category,
    price: Number(sale.toFixed(2)),
    originalPrice: Number(regular.toFixed(2)),
    discount: discount > 0 ? `-${discount}%` : '',
    rating: 4.8,
    image: product.mainImageUrl,
    isNew: product.badgeName?.toLowerCase() === 'new',
    badgeName: product.badgeName,
    description: product.description,
    variants: (product.variants || []).map((variant) => ({
      clientKey: variant.clientKey,
      color: variant.color,
      size: variant.size,
      stock: variant.stock,
      price: variant.price,
      imageUrl: variant.imageUrl,
      isActive: variant.isActive,
    })),
    galleryImages: product.galleryImages?.map((entry) => entry.url) || [],
    mainVideo: product.mainVideo,
    inventory: product.inventory,
    collections: product.collections.map((entry) => ({ name: entry.name, slug: entry.slug })),
    createdAt: product.createdAt,
    status: product.status,
    tags: product.tags,
    normalizedBadge: product.badgeName ? toTitleCase(product.badgeName) : undefined,
  };
}
