export type AuthUser = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  provider?: 'local' | 'google';
  isEmailVerified?: boolean;
  lastLoginAt?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
};

export type RefreshResponse = {
  ok: boolean;
};

export type LogoutResponse = {
  ok: boolean;
};

export type ApiErrorResponse = {
  message?: string;
  errors?: unknown;
};

export type AdminCollectionParent = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

export type AdminCollection = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parentId?:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
        slug?: string;
      }
    | null;
  parentName?: string | null;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCollectionsResponse = {
  ok: boolean;
  collections: AdminCollection[];
};

export type AdminCollectionParentsResponse = {
  ok: boolean;
  parents: AdminCollectionParent[];
};

export type CreateCollectionRequest = {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  imageFile?: File;
};

export type CreateCollectionResponse = {
  ok: boolean;
  message?: string;
  collection: AdminCollection;
};

export type UpdateCollectionRequest = {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
  removeImage?: boolean;
  imageFile?: File;
};

export type UpdateCollectionResponse = {
  ok: boolean;
  message?: string;
  collection: AdminCollection;
};

export type DeleteCollectionResponse = {
  ok: boolean;
  message?: string;
};

export type ExploreCollection = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: string | null;
};

export type ExploreCollectionsResponse = {
  ok: boolean;
  collections: ExploreCollection[];
};

export type ProductCollectionOption = {
  id: string;
  name: string;
  slug: string;
};

export type ProductVariant = {
  clientKey?: string;
  parentValueId?: string;
  size: string;
  color: string;
  gender?: string;
  optionSummary?: string;
  options?: Array<{
    key: string;
    name: string;
    value: string;
    colorHex?: string;
  }>;
  price: number;
  sku: string;
  stock: number;
  imageUrl?: string;
  imagePublicId?: string;
  isActive?: boolean;
};

export type ProductVideoReview = {
  clientKey?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
};

export type ProductFaq = {
  question: string;
  answer: string;
};

export type ProductUpsellOption = {
  id: string;
  name: string;
  slug: string;
  status?: 'active' | 'draft' | 'archived';
  mainImageUrl?: string;
};

export type ProductReview = {
  id: string;
  productId: string;
  source: 'admin' | 'customer';
  isPublished: boolean;
  rating: number;
  fullName: string;
  email: string;
  reviewText: string;
  photos: ProductImageAsset[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductImageAsset = {
  url: string;
  publicId: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  benefits?: string;
  faqs?: ProductFaq[];
  upsellProductIds?: string[];
  upsellProducts?: ProductUpsellOption[];
  orderType: 'direct' | 'request';
  status: 'active' | 'draft' | 'archived';
  collectionIds: string[];
  collections?: ProductCollectionOption[];
  basePrice: number;
  regularPrice?: number;
  salePrice?: number;
  badgeName?: string;
  useBasePriceForVariants: boolean;
  variantConfig?: {
    mode: 'global' | 'dependent';
    parentOptionKey?: string;
    childOptionKey?: string;
  };
  mainImageUrl: string;
  mainImagePublicId?: string;
  mainVideo?: {
    videoUrl: string;
    thumbnailUrl?: string;
    thumbnailPublicId?: string;
  };
  galleryImages?: ProductImageAsset[];
  variants: ProductVariant[];
  videoReviews?: ProductVideoReview[];
  reviews?: ProductReview[];
  tags?: string[];
  inventory?: {
    trackQuantity: boolean;
    allowBackorder: boolean;
    globalStock: number;
  };
  shipping?: {
    isPhysical: boolean;
    weightKg?: number;
    hsCode?: string;
  };
  seo?: {
    pageTitle?: string;
    metaDescription?: string;
    urlHandle?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type ProductListResponse = {
  ok: boolean;
  items: AdminProduct[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    resultCount: number;
  };
};

export type ProductCollectionsResponse = {
  ok: boolean;
  items: ProductCollectionOption[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  benefits?: string;
  faqs?: ProductFaq[];
  upsellProductIds?: string[];
  upsellProducts?: ProductUpsellOption[];
  status: 'active' | 'draft' | 'archived';
  regularPrice?: number;
  salePrice?: number;
  basePrice: number;
  badgeName?: string;
  mainImageUrl: string;
  mainVideo?: {
    videoUrl: string;
    thumbnailUrl?: string;
    thumbnailPublicId?: string;
  };
  galleryImages?: ProductImageAsset[];
  variants: ProductVariant[];
  inventory?: {
    trackQuantity: boolean;
    allowBackorder: boolean;
    globalStock: number;
  };
  tags?: string[];
  collections: ProductCollectionOption[];
  createdAt?: string;
  updatedAt?: string;
};

export type PublicProductsResponse = {
  ok: boolean;
  items: PublicProduct[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    resultCount: number;
  };
};

export type PublicProductResponse = {
  ok: boolean;
  product: PublicProduct;
};

export type UpsertProductVariantRequest = {
  clientKey: string;
  parentValueId?: string;
  size: string;
  color: string;
  gender?: string;
  optionSummary?: string;
  options?: Array<{
    key: string;
    name: string;
    value: string;
    colorHex?: string;
  }>;
  price?: number;
  sku?: string;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  imageFile?: File;
};

export type UpsertProductVideoReviewRequest = {
  clientKey: string;
  videoUrl: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  thumbnailFile?: File;
};

export type UpsertProductReviewRequest = {
  clientKey: string;
  source?: 'admin' | 'customer';
  isPublished?: boolean;
  rating: number;
  fullName: string;
  email: string;
  reviewText: string;
  photos?: ProductMediaAsset[];
  photoFiles?: File[];
};

export type ProductMediaAsset = {
  url: string;
  publicId: string;
};

export type UpsertProductRequest = {
  name: string;
  slug?: string;
  description?: string;
  benefits?: string;
  faqs?: ProductFaq[];
  upsellProductIds?: string[];
  orderType: 'direct' | 'request';
  collectionIds: string[];
  status: 'active' | 'draft' | 'archived';
  basePrice: number;
  regularPrice?: number;
  salePrice?: number;
  badgeName?: string;
  useBasePriceForVariants: boolean;
  variantConfig?: {
    mode: 'global' | 'dependent';
    parentOptionKey?: string;
    childOptionKey?: string;
  };
  tags?: string[];
  inventory?: {
    trackQuantity: boolean;
    allowBackorder: boolean;
    globalStock: number;
  };
  shipping?: {
    isPhysical: boolean;
    weightKg?: number;
    hsCode?: string;
  };
  seo?: {
    pageTitle?: string;
    metaDescription?: string;
    urlHandle?: string;
  };
  variants: UpsertProductVariantRequest[];
  videoReviews: UpsertProductVideoReviewRequest[];
  reviews?: UpsertProductReviewRequest[];
  mainVideo?: {
    videoUrl: string;
    thumbnailUrl?: string;
    thumbnailPublicId?: string;
  };
  mainImageUrl?: string;
  mainImagePublicId?: string;
  galleryImages?: ProductMediaAsset[];
  mainImageFile?: File;
  mainVideoThumbnailFile?: File;
  galleryImageFiles?: File[];
};

export type CreateProductRequest = UpsertProductRequest;

export type UpdateProductRequest = Partial<UpsertProductRequest> & {
  removeMainImage?: boolean;
};

export type ProductResponse = {
  ok: boolean;
  message?: string;
  product: AdminProduct;
};

export type ProductOptionsResponse = {
  ok: boolean;
  items: ProductUpsellOption[];
};

export type DeleteProductResponse = {
  ok: boolean;
  message?: string;
};

export type ApiCartItem = {
  productId: string;
  variantSku: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  addedAt?: string;
};

export type ApiCart = {
  id?: string;
  userId: string;
  items: ApiCartItem[];
};

export type CartResponse = {
  ok: boolean;
  message?: string;
  cart: ApiCart;
};

export type AddToCartRequest = {
  productId: string;
  variantSku: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
};

export type UpdateCartQuantityRequest = {
  variantSku: string;
  quantity: number;
};

export type SyncCartRequest = {
  guestItems: ApiCartItem[];
};

export type ApiWishlistItem = {
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  addedAt?: string;
};

export type ApiWishlist = {
  userId: string;
  items: ApiWishlistItem[];
};

export type WishlistResponse = {
  ok: boolean;
  message?: string;
  wishlist: ApiWishlist;
};

export type ToggleWishlistItemRequest = {
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
};

export type SyncWishlistRequest = {
  guestItems: ApiWishlistItem[];
};
