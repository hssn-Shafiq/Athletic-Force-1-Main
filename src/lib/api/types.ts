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
