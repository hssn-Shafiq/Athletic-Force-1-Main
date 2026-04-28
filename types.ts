
export interface Product {
  id: string;
  slug?: string;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: string;
  rating: number;
  reviewCount?: number;
  image: string;
  isNew?: boolean;
  badgeName?: string;
  normalizedBadge?: string;
  description?: string;
  variants?:
    | Array<{
        clientKey?: string;
        color: string;
        size: string;
        stock: number;
        price: number;
        imageUrl?: string;
        isActive?: boolean;
      }>
    | {
        colors: { name: string; image: string }[];
        sizes: string[];
      };
  galleryImages?: string[];
  mainVideo?: {
    videoUrl: string;
    thumbnailUrl?: string;
    thumbnailPublicId?: string;
  };
  inventory?: {
    trackQuantity: boolean;
    allowBackorder: boolean;
    globalStock: number;
  };
  collections?: Array<{
    id: string;
    name: string;
    slug: string;
    parentId?: string | { id: string; name: string; slug: string } | null;
  }>;
  createdAt?: string;
  status?: 'active' | 'draft' | 'archived';
  tags?: string[];
  orderType: 'direct' | 'request';
}

export interface CartItem extends Product {
  quantity: number;
  size?: string;
}