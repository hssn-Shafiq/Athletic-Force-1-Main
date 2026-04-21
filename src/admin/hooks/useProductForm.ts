"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  createAdminProductApi,
  getAdminProductByIdApi,
  getAdminProductCollectionsApi,
  updateAdminProductApi,
} from '@/lib/api/products';
import {
  CreateProductRequest,
  ProductMediaAsset,
  ProductCollectionOption,
  UpdateProductRequest,
  UpsertProductVariantRequest,
  UpsertProductVideoReviewRequest,
} from '@/lib/api/types';
import { getApiErrorMessage } from '@/lib/api/errors';

export type ProductStatus = 'active' | 'draft' | 'archived';
export type OrderType = 'direct' | 'request';
export type VariantMode = 'global' | 'dependent';

export type OptionValue = {
  id: string;
  label: string;
  colorHex?: string;
};

export type GlobalOptionDefinition = {
  key: string;
  name: string;
  isColor: boolean;
  values: OptionValue[];
};

export type ProductOptionGroup = {
  id: string;
  key: string;
  name: string;
  isColor: boolean;
  values: OptionValue[];
  selectedValueIds: string[];
};

export type ProductFormVariant = {
  id: string;
  comboKey: string;
  parentValueId?: string;
  size: string;
  color: string;
  gender?: string;
  optionSummary: string;
  options?: Array<{
    key: string;
    name: string;
    value: string;
    colorHex?: string;
  }>;
  colorHex?: string;
  price: string;
  sku: string;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  imageFile?: File;
};

export type ProductFormVideoReview = {
  id: string;
  url: string;
  thumbnailUrl: string;
  thumbnailPublicId?: string;
  thumbnailFile?: File;
};

export type ProductFormMainVideo = {
  url: string;
  thumbnailUrl: string;
  thumbnailPublicId?: string;
  thumbnailFile?: File;
};

const LOCAL_STORAGE_KEY = 'af1-product-global-variant-options-v2';

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function toKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateSku(productName: string, index: number, labels: string[]) {
  const productPart = toKey(productName || 'product').toUpperCase() || 'PRODUCT';
  const variantPart = labels
    .slice(0, 3)
    .map((label) => toKey(label || 'na').toUpperCase() || 'NA')
    .join('-');
  const serial = String(index + 1).padStart(3, '0');
  return `${productPart}-${variantPart || 'DEFAULT'}-${serial}`;
}

function toNumber(value: string, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function getOptionValueByKeyword(
  options: Array<{ key: string; name: string; value: string; colorHex?: string }> | undefined,
  keywords: string[]
) {
  if (!options?.length) return undefined;

  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  const matched = options.find((option) => {
    const key = option.key.toLowerCase();
    const name = option.name.toLowerCase();
    return normalizedKeywords.some((keyword) => key.includes(keyword) || name.includes(keyword));
  });

  return matched?.value;
}

function cartesian<T>(groups: T[][]): T[][] {
  if (!groups.length) return [];
  return groups.reduce<T[][]>((acc, group) => {
    if (!acc.length) {
      return group.map((item) => [item]);
    }

    const next: T[][] = [];
    for (const prefix of acc) {
      for (const item of group) {
        next.push([...prefix, item]);
      }
    }
    return next;
  }, []);
}

function defaultGlobalDefinitions(): GlobalOptionDefinition[] {
  return [
    {
      key: 'color',
      name: 'Color',
      isColor: true,
      values: [
        { id: makeId(), label: 'Black', colorHex: '#000000' },
        { id: makeId(), label: 'White', colorHex: '#FFFFFF' },
        { id: makeId(), label: 'Orange', colorHex: '#FF7348' },
        { id: makeId(), label: 'Red', colorHex: '#E11D48' },
        { id: makeId(), label: 'Navy Blue', colorHex: '#1E3A8A' },
        { id: makeId(), label: 'Grey', colorHex: '#6B7280' },
      ],
    },
    {
      key: 'size',
      name: 'Size',
      isColor: false,
      values: [
        { id: makeId(), label: 'YS' },
        { id: makeId(), label: 'YM' },
        { id: makeId(), label: 'YL' },
        { id: makeId(), label: 'YXL' },
        { id: makeId(), label: 'AS' },
        { id: makeId(), label: 'AM' },
        { id: makeId(), label: 'AL' },
        { id: makeId(), label: 'AXL' },
        { id: makeId(), label: 'A2XL' },
        { id: makeId(), label: 'A3XL' },
        { id: makeId(), label: 'A4XL' },
      ],
    },
    {
      key: 'gender',
      name: 'Gender',
      isColor: false,
      values: [
        { id: makeId(), label: 'Male' },
        { id: makeId(), label: 'Female' },
      ],
    },
  ];
}

function createGroupFromDefinition(definition: GlobalOptionDefinition): ProductOptionGroup {
  return {
    id: makeId(),
    key: definition.key,
    name: definition.name,
    isColor: definition.isColor,
    values: definition.values,
    selectedValueIds: definition.values.length ? [definition.values[0].id] : [],
  };
}

function createDefaultProductOptionGroups(definitions: GlobalOptionDefinition[]) {
  const preferredOrder = ['color', 'size'];
  const picked = preferredOrder
    .map((key) => definitions.find((entry) => entry.key === key))
    .filter((entry): entry is GlobalOptionDefinition => Boolean(entry));

  return picked.map(createGroupFromDefinition);
}

type ParentImageMapEntry = {
  file?: File;
  previewUrl?: string;
  imageUrl?: string;
  imagePublicId?: string;
};

export function useProductForm(productId?: string) {
  const isEditMode = Boolean(productId);
  const skipRegenerateRef = useRef(false);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('direct');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [basePrice, setBasePrice] = useState('0');
  const [regularPrice, setRegularPrice] = useState('0');
  const [salePrice, setSalePrice] = useState('');
  const [badgeName, setBadgeName] = useState('');
  const [useBasePriceForVariants, setUseBasePriceForVariants] = useState(true);
  const [globalStock, setGlobalStock] = useState('0');

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [mainImagePublicId, setMainImagePublicId] = useState('');
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [galleryImages, setGalleryImages] = useState<ProductMediaAsset[]>([]);

  const [variants, setVariants] = useState<ProductFormVariant[]>([]);
  const [videoReviews, setVideoReviews] = useState<ProductFormVideoReview[]>([]);
  const [mainVideo, setMainVideo] = useState<ProductFormMainVideo>({
    url: '',
    thumbnailUrl: '',
  });

  const [globalOptionDefinitions, setGlobalOptionDefinitions] = useState<GlobalOptionDefinition[]>(defaultGlobalDefinitions);
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([]);

  const [variantMode, setVariantMode] = useState<VariantMode>('global');
  const [parentOptionKey, setParentOptionKey] = useState('color');
  const [childOptionKey, setChildOptionKey] = useState('size');

  const [dependentChildSelections, setDependentChildSelections] = useState<Record<string, string[]>>({});
  const [parentImageMap, setParentImageMap] = useState<Record<string, ParentImageMapEntry>>({});

  const [collections, setCollections] = useState<ProductCollectionOption[]>([]);
  const [isCollectionLoading, setIsCollectionLoading] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const defaults = defaultGlobalDefinitions();

      if (!raw) {
        setGlobalOptionDefinitions(defaults);
        setOptionGroups(createDefaultProductOptionGroups(defaults));
        return;
      }

      const parsed = JSON.parse(raw) as GlobalOptionDefinition[];
      if (!Array.isArray(parsed) || !parsed.length) {
        setGlobalOptionDefinitions(defaults);
        setOptionGroups(createDefaultProductOptionGroups(defaults));
        return;
      }

      setGlobalOptionDefinitions(parsed);
      setOptionGroups(createDefaultProductOptionGroups(parsed));
    } catch {
      const defaults = defaultGlobalDefinitions();
      setGlobalOptionDefinitions(defaults);
      setOptionGroups(createDefaultProductOptionGroups(defaults));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(globalOptionDefinitions));
  }, [globalOptionDefinitions]);

  const mainImagePreview = useMemo(() => {
    if (!mainImageFile) return mainImageUrl || null;
    return URL.createObjectURL(mainImageFile);
  }, [mainImageFile, mainImageUrl]);

  useEffect(() => {
    return () => {
      if (mainImagePreview && mainImageFile) {
        URL.revokeObjectURL(mainImagePreview);
      }

      Object.values(parentImageMap).forEach((entry) => {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parentGroup = useMemo(() => optionGroups.find((entry) => entry.key === parentOptionKey), [optionGroups, parentOptionKey]);
  const childGroup = useMemo(() => optionGroups.find((entry) => entry.key === childOptionKey), [optionGroups, childOptionKey]);

  const nonParentGroups = useMemo(() => optionGroups.filter((entry) => entry.key !== parentOptionKey), [optionGroups, parentOptionKey]);

  const availableGlobalOptions = useMemo(() => {
    const used = new Set(optionGroups.map((entry) => entry.key));
    return globalOptionDefinitions.filter((entry) => !used.has(entry.key));
  }, [globalOptionDefinitions, optionGroups]);

  const selectedParentValues = useMemo(() => {
    if (!parentGroup) return [] as OptionValue[];
    return parentGroup.values.filter((value) => parentGroup.selectedValueIds.includes(value.id));
  }, [parentGroup]);

  const selectedChildValues = useMemo(() => {
    if (!childGroup) return [] as OptionValue[];
    return childGroup.values.filter((value) => childGroup.selectedValueIds.includes(value.id));
  }, [childGroup]);

  const filteredCollections = useMemo(() => {
    const q = collectionSearch.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((entry) => entry.name.toLowerCase().includes(q) || entry.slug.toLowerCase().includes(q));
  }, [collectionSearch, collections]);

  useEffect(() => {
    let mounted = true;

    async function loadCollections() {
      setIsCollectionLoading(true);
      try {
        const response = await getAdminProductCollectionsApi({ page: 1, pageSize: 200 });
        if (!mounted) return;
        setCollections(response.items);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Unable to load collections.'));
      } finally {
        if (mounted) {
          setIsCollectionLoading(false);
        }
      }
    }

    void loadCollections();

    return () => {
      mounted = false;
    };
  }, []);

  const regenerateVariants = () => {
    const activeGroups = optionGroups.filter((entry) => entry.selectedValueIds.length > 0);
    if (!activeGroups.length) {
      setVariants([]);
      return;
    }

    setVariants((prev) => {
      const prevMap = new Map(prev.map((entry) => [entry.comboKey, entry]));
      const generated: ProductFormVariant[] = [];

      if (variantMode === 'dependent' && parentGroup) {
        const parentValues = parentGroup.values.filter((value) => parentGroup.selectedValueIds.includes(value.id));

        const resolvedChildGroup = childGroup && childGroup.key !== parentGroup.key ? childGroup : null;

        for (const parentValue of parentValues) {
          const inherited = parentImageMap[parentValue.id];

          const hasExplicitChildMapping = resolvedChildGroup
            ? Object.prototype.hasOwnProperty.call(dependentChildSelections, parentValue.id)
            : false;

          const selectedChildIds = resolvedChildGroup
            ? hasExplicitChildMapping
              ? dependentChildSelections[parentValue.id] ?? []
              : resolvedChildGroup.selectedValueIds
            : [];

          const childValues = resolvedChildGroup
            ? resolvedChildGroup.values.filter((value) =>
                selectedChildIds.includes(value.id) && resolvedChildGroup.selectedValueIds.includes(value.id)
              )
            : [];

          if (!childValues.length) {
            const labels = [parentValue.label];
            const comboKey = `${parentGroup.key}:${parentValue.id}|none`;
            const existing = prevMap.get(comboKey);

            const size = parentGroup.key === 'size' ? parentValue.label : 'Default';
            const color = parentGroup.key === 'color' ? parentValue.label : 'Default';
            const gender = parentGroup.key === 'gender' ? parentValue.label : '';

            generated.push({
              id: existing?.id || makeId(),
              comboKey,
              parentValueId: parentValue.id,
              size,
              color,
              gender,
              optionSummary: `${parentGroup.name}: ${parentValue.label}`,
              options: [
                {
                  key: parentGroup.key,
                  name: parentGroup.name,
                  value: parentValue.label,
                  colorHex: parentValue.colorHex,
                },
              ],
              colorHex: parentGroup.isColor ? parentValue.colorHex : undefined,
              price: existing?.price ?? (useBasePriceForVariants ? basePrice : '0'),
              sku: existing?.sku || generateSku(name, generated.length, labels),
              stock: existing?.stock ?? 0,
              isActive: existing?.isActive ?? true,
              imageUrl: existing?.imageUrl ?? inherited?.imageUrl ?? inherited?.previewUrl,
              imagePublicId: existing?.imagePublicId ?? inherited?.imagePublicId,
              imageFile: existing?.imageFile,
            });
            continue;
          }

          for (const childValue of childValues) {
            const labels = [parentValue.label, childValue.label];
            const comboKey = `${parentGroup.key}:${parentValue.id}|${resolvedChildGroup!.key}:${childValue.id}`;
            const existing = prevMap.get(comboKey);

            const size =
              parentGroup.key === 'size'
                ? parentValue.label
                : resolvedChildGroup!.key === 'size'
                ? childValue.label
                : 'Default';

            const color =
              parentGroup.key === 'color'
                ? parentValue.label
                : resolvedChildGroup!.key === 'color'
                ? childValue.label
                : 'Default';

            const gender =
              parentGroup.key === 'gender'
                ? parentValue.label
                : resolvedChildGroup!.key === 'gender'
                ? childValue.label
                : '';

            const optionItems = [
              {
                key: parentGroup.key,
                name: parentGroup.name,
                value: parentValue.label,
                colorHex: parentValue.colorHex,
              },
              {
                key: resolvedChildGroup!.key,
                name: resolvedChildGroup!.name,
                value: childValue.label,
                colorHex: childValue.colorHex,
              },
            ];

            const derivedSize =
              getOptionValueByKeyword(optionItems, ['size']) ||
              (parentGroup.key === 'size'
                ? parentValue.label
                : resolvedChildGroup!.key === 'size'
                ? childValue.label
                : 'Default');

            const derivedColor =
              getOptionValueByKeyword(optionItems, ['color', 'colour']) ||
              (parentGroup.key === 'color'
                ? parentValue.label
                : resolvedChildGroup!.key === 'color'
                ? childValue.label
                : 'Default');

            const derivedGender =
              getOptionValueByKeyword(optionItems, ['gender']) ||
              (parentGroup.key === 'gender'
                ? parentValue.label
                : resolvedChildGroup!.key === 'gender'
                ? childValue.label
                : '');

            generated.push({
              id: existing?.id || makeId(),
              comboKey,
              parentValueId: parentValue.id,
              size: derivedSize,
              color: derivedColor,
              gender: derivedGender,
              optionSummary: `${parentGroup.name}: ${parentValue.label} / ${resolvedChildGroup!.name}: ${childValue.label}`,
              options: optionItems,
              colorHex:
                parentGroup.key === 'color'
                  ? parentValue.colorHex
                  : resolvedChildGroup!.key === 'color'
                  ? childValue.colorHex
                  : undefined,
              price: existing?.price ?? (useBasePriceForVariants ? basePrice : '0'),
              sku: existing?.sku || generateSku(name, generated.length, labels),
              stock: existing?.stock ?? 0,
              isActive: existing?.isActive ?? true,
              imageUrl: existing?.imageUrl ?? inherited?.imageUrl ?? inherited?.previewUrl,
              imagePublicId: existing?.imagePublicId ?? inherited?.imagePublicId,
              imageFile: existing?.imageFile,
            });
          }
        }
      } else {
        const matrixGroups = activeGroups.map((group) =>
          group.values.filter((value) => group.selectedValueIds.includes(value.id)).map((value) => ({ group, value }))
        );

        const combos = cartesian(matrixGroups);
        combos.forEach((combo, index) => {
          const comboKey = combo.map((entry) => `${entry.group.key}:${entry.value.id}`).join('|');
          const existing = prevMap.get(comboKey);

          const optionItems = combo.map((entry) => ({
            key: entry.group.key,
            name: entry.group.name,
            value: entry.value.label,
            colorHex: entry.value.colorHex,
          }));

          const size =
            getOptionValueByKeyword(optionItems, ['size']) ||
            combo.find((entry) => entry.group.key === 'size')?.value.label ||
            'Default';
          const color =
            getOptionValueByKeyword(optionItems, ['color', 'colour']) ||
            combo.find((entry) => entry.group.key === 'color')?.value.label ||
            'Default';
          const gender =
            getOptionValueByKeyword(optionItems, ['gender']) ||
            combo.find((entry) => entry.group.key === 'gender')?.value.label ||
            '';

          generated.push({
            id: existing?.id || makeId(),
            comboKey,
            size,
            color,
            gender,
            optionSummary: combo.map((entry) => `${entry.group.name}: ${entry.value.label}`).join(' / '),
            options: optionItems,
            colorHex: combo.find((entry) => entry.group.key === 'color')?.value.colorHex,
            price: existing?.price ?? (useBasePriceForVariants ? basePrice : '0'),
            sku: existing?.sku || generateSku(name, index, combo.map((entry) => entry.value.label)),
            stock: existing?.stock ?? 0,
            isActive: existing?.isActive ?? true,
            imageUrl: existing?.imageUrl,
            imageFile: existing?.imageFile,
          });
        });
      }

      return generated;
    });
  };

  useEffect(() => {
    if (skipRegenerateRef.current) {
      skipRegenerateRef.current = false;
      return;
    }
    regenerateVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionGroups, variantMode, parentOptionKey, childOptionKey, dependentChildSelections, name]);

  useEffect(() => {
    if (!useBasePriceForVariants) return;
    setVariants((prev) => prev.map((entry) => ({ ...entry, price: basePrice })));
  }, [basePrice, useBasePriceForVariants]);

  useEffect(() => {
    setBasePrice(regularPrice || '0');
  }, [regularPrice]);

  useEffect(() => {
    if (!productId) return;
    const stableId = productId;

    let mounted = true;

    async function loadProduct() {
      setIsLoading(true);
      try {
        const response = await getAdminProductByIdApi(stableId);
        if (!mounted) return;

        const product = response.product;
        setName(product.name || '');
        setDescription(product.description || '');
        setOrderType(product.orderType || 'direct');
        setStatus(product.status || 'draft');
        setBasePrice(String(product.basePrice ?? 0));
        setRegularPrice(String(product.regularPrice ?? product.basePrice ?? 0));
        setSalePrice(product.salePrice !== undefined && product.salePrice !== null ? String(product.salePrice) : '');
        setBadgeName(product.badgeName || '');
        setUseBasePriceForVariants(Boolean(product.useBasePriceForVariants));
        setGlobalStock(String(product.inventory?.globalStock ?? 0));
        setMainImageUrl(product.mainImageUrl || '');
        setMainImagePublicId(product.mainImagePublicId || '');
        setGalleryImages((product.galleryImages || []).map((entry) => ({ url: entry.url, publicId: entry.publicId })));
        setMainVideo({
          url: product.mainVideo?.videoUrl || '',
          thumbnailUrl: product.mainVideo?.thumbnailUrl || '',
          thumbnailPublicId: product.mainVideo?.thumbnailPublicId,
        });
        setSelectedCollectionIds(product.collectionIds || []);

        const foundSizes = Array.from(new Set((product.variants || []).map((v) => v.size).filter(Boolean)));
        const foundColors = Array.from(new Set((product.variants || []).map((v) => v.color).filter(Boolean)));
        const foundGenders = Array.from(
          new Set((product.variants || []).map((v) => v.gender).filter((entry): entry is string => Boolean(entry)))
        );

        const sizeDef = globalOptionDefinitions.find((entry) => entry.key === 'size');
        const colorDef = globalOptionDefinitions.find((entry) => entry.key === 'color');
        const genderDef = globalOptionDefinitions.find((entry) => entry.key === 'gender');

        const nextGroups: ProductOptionGroup[] = [];

        if (colorDef) {
          nextGroups.push({
            id: makeId(),
            key: 'color',
            name: colorDef.name,
            isColor: true,
            values: colorDef.values,
            selectedValueIds: colorDef.values
              .filter((value) => foundColors.some((label) => label.toLowerCase() === value.label.toLowerCase()))
              .map((value) => value.id),
          });
        }

        if (sizeDef) {
          nextGroups.push({
            id: makeId(),
            key: 'size',
            name: sizeDef.name,
            isColor: false,
            values: sizeDef.values,
            selectedValueIds: sizeDef.values
              .filter((value) => foundSizes.some((label) => label.toLowerCase() === value.label.toLowerCase()))
              .map((value) => value.id),
          });
        }

        if (genderDef && foundGenders.length) {
          nextGroups.push({
            id: makeId(),
            key: 'gender',
            name: genderDef.name,
            isColor: false,
            values: genderDef.values,
            selectedValueIds: genderDef.values
              .filter((value) => foundGenders.some((label) => label.toLowerCase() === value.label.toLowerCase()))
              .map((value) => value.id),
          });
        }

        const colorToSizes = new Map<string, Set<string>>();
        (product.variants || []).forEach((variant) => {
          const color = variant.color || 'Default';
          const size = variant.size || '';
          if (!colorToSizes.has(color)) {
            colorToSizes.set(color, new Set());
          }
          if (size) {
            colorToSizes.get(color)?.add(size);
          }
        });

        let inferredDependent = (product.variants || []).some((variant) => Boolean(variant.parentValueId));
        if (!inferredDependent && foundColors.length && foundSizes.length) {
          const allSizeSet = new Set(foundSizes.map((entry) => entry.toLowerCase()));
          for (const set of colorToSizes.values()) {
            const local = new Set(Array.from(set).map((entry) => entry.toLowerCase()));
            if (local.size !== allSizeSet.size) {
              inferredDependent = true;
              break;
            }
            for (const key of allSizeSet) {
              if (!local.has(key)) {
                inferredDependent = true;
                break;
              }
            }
            if (inferredDependent) break;
          }
        }

        skipRegenerateRef.current = true;
        setOptionGroups(nextGroups);
        const configuredMode = product.variantConfig?.mode;
        const shouldUseDependent = configuredMode ? configuredMode === 'dependent' : inferredDependent;
        setVariantMode(shouldUseDependent ? 'dependent' : 'global');

        const nextParentOptionKey =
          product.variantConfig?.parentOptionKey && nextGroups.some((entry) => entry.key === product.variantConfig?.parentOptionKey)
            ? product.variantConfig.parentOptionKey
            : 'color';

        const nextChildOptionKey =
          product.variantConfig?.childOptionKey &&
          product.variantConfig.childOptionKey !== nextParentOptionKey &&
          nextGroups.some((entry) => entry.key === product.variantConfig?.childOptionKey)
            ? product.variantConfig.childOptionKey
            : 'size';

        setParentOptionKey(nextParentOptionKey);
        setChildOptionKey(nextChildOptionKey);

        if (shouldUseDependent && nextGroups.length >= 2) {
          const colorGroup = nextGroups.find((entry) => entry.key === nextParentOptionKey);
          const sizeGroup = nextGroups.find((entry) => entry.key === nextChildOptionKey);

          if (colorGroup && sizeGroup) {
            const nextDependent: Record<string, string[]> = {};
            colorGroup.values.forEach((colorValue) => {
              const set = colorToSizes.get(colorValue.label) || new Set<string>();
              const ids = sizeGroup.values
                .filter((sizeValue) => Array.from(set).some((entry) => entry.toLowerCase() === sizeValue.label.toLowerCase()))
                .map((sizeValue) => sizeValue.id);
              if (ids.length) {
                nextDependent[colorValue.id] = ids;
              }
            });
            setDependentChildSelections(nextDependent);
          } else {
            setDependentChildSelections({});
          }
        } else {
          setDependentChildSelections({});
        }

        const nextParentImageMap: Record<string, ParentImageMapEntry> = {};
        const colorGroup = nextGroups.find((entry) => entry.key === 'color');
        (product.variants || []).forEach((variant) => {
          if (!variant.imageUrl) return;

          if (variant.parentValueId && !nextParentImageMap[variant.parentValueId]) {
            nextParentImageMap[variant.parentValueId] = {
              previewUrl: variant.imageUrl,
              imageUrl: variant.imageUrl,
              imagePublicId: variant.imagePublicId,
            };
            return;
          }

          if (!variant.parentValueId && colorGroup) {
            const matched = colorGroup.values.find(
              (entry) => entry.label.toLowerCase() === (variant.color || '').toLowerCase()
            );

            if (matched && !nextParentImageMap[matched.id]) {
              nextParentImageMap[matched.id] = {
                previewUrl: variant.imageUrl,
                imageUrl: variant.imageUrl,
                imagePublicId: variant.imagePublicId,
              };
            }
          }
        });
        setParentImageMap(nextParentImageMap);

        setVariants(
          (product.variants || []).map((variant, index) => ({
            id: variant.clientKey || makeId(),
            comboKey: `existing:${index}`,
            parentValueId: variant.parentValueId,
            size: variant.size || getOptionValueByKeyword(variant.options, ['size']) || 'Default',
            color: variant.color || getOptionValueByKeyword(variant.options, ['color', 'colour']) || 'Default',
            gender: variant.gender || getOptionValueByKeyword(variant.options, ['gender']) || '',
            optionSummary: [variant.color, variant.size, variant.gender].filter(Boolean).join(' / '),
            options: variant.options || [],
            colorHex: colorDef?.values.find((entry) => entry.label.toLowerCase() === (variant.color || '').toLowerCase())?.colorHex,
            price: String(variant.price ?? 0),
            sku: variant.sku || generateSku(product.name, index, [variant.color || 'default', variant.size || 'default']),
            stock: variant.stock ?? 0,
            isActive: variant.isActive ?? true,
            imageUrl: variant.imageUrl,
            imagePublicId: variant.imagePublicId,
          }))
        );

        setVideoReviews(
          (product.videoReviews || []).map((review) => ({
            id: review.clientKey || makeId(),
            url: review.videoUrl,
            thumbnailUrl: review.thumbnailUrl || '',
            thumbnailPublicId: review.thumbnailPublicId,
          }))
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Unable to load product details.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProduct();

    return () => {
      mounted = false;
    };
  }, [globalOptionDefinitions, productId]);

  const setParentValueImage = (parentValueId: string, file: File | null) => {
    setParentImageMap((prev) => {
      const prevEntry = prev[parentValueId];
      if (prevEntry?.previewUrl) {
        URL.revokeObjectURL(prevEntry.previewUrl);
      }

      if (!file) {
        const { [parentValueId]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [parentValueId]: {
          file,
          previewUrl: URL.createObjectURL(file),
          imageUrl: undefined,
          imagePublicId: undefined,
        },
      };
    });
  };

  const setParentValueImageFromMedia = (parentValueId: string, media: ProductMediaAsset) => {
    setParentImageMap((prev) => {
      const prevEntry = prev[parentValueId];
      if (prevEntry?.previewUrl && prevEntry.file) {
        URL.revokeObjectURL(prevEntry.previewUrl);
      }

      return {
        ...prev,
        [parentValueId]: {
          file: undefined,
          previewUrl: media.url,
          imageUrl: media.url,
          imagePublicId: media.publicId,
        },
      };
    });
  };

  const setMainImageLocalFile = (file: File | null) => {
    setMainImageFile(file);
    if (file) {
      setMainImageUrl('');
      setMainImagePublicId('');
    }
  };

  const setMainImageFromMedia = (media: ProductMediaAsset) => {
    setMainImageFile(null);
    setMainImageUrl(media.url);
    setMainImagePublicId(media.publicId);
  };

  const addGalleryImagesFromMedia = (assets: ProductMediaAsset[]) => {
    setGalleryImageFiles([]);
    setGalleryImages((prev) => {
      const existing = new Set(prev.map((entry) => entry.publicId));
      const next = [...prev];
      assets.forEach((asset) => {
        if (!existing.has(asset.publicId)) {
          next.push(asset);
          existing.add(asset.publicId);
        }
      });
      return next;
    });
  };

  const removeGalleryMedia = (publicId: string) => {
    setGalleryImages((prev) => prev.filter((entry) => entry.publicId !== publicId));
  };

  const setVariantImageFromMedia = (variantId: string, media: ProductMediaAsset) => {
    updateVariant(variantId, {
      imageFile: undefined,
      imageUrl: media.url,
      imagePublicId: media.publicId,
    });
  };

  const setVideoThumbnailFromMedia = (reviewId: string, media: ProductMediaAsset) => {
    updateVideoReview(reviewId, {
      thumbnailFile: undefined,
      thumbnailUrl: media.url,
      thumbnailPublicId: media.publicId,
    });
  };

  const setMainVideoField = (patch: Partial<ProductFormMainVideo>) => {
    setMainVideo((prev) => ({ ...prev, ...patch }));
  };

  const setMainVideoThumbnailFile = (file: File | null) => {
    setMainVideo((prev) => {
      if (prev.thumbnailFile && prev.thumbnailUrl) {
        URL.revokeObjectURL(prev.thumbnailUrl);
      }

      if (!file) {
        return {
          ...prev,
          thumbnailFile: undefined,
        };
      }

      const localUrl = URL.createObjectURL(file);
      return {
        ...prev,
        thumbnailFile: file,
        thumbnailUrl: localUrl,
        thumbnailPublicId: undefined,
      };
    });
  };

  const setMainVideoThumbnailFromMedia = (media: ProductMediaAsset) => {
    setMainVideo((prev) => ({
      ...prev,
      thumbnailFile: undefined,
      thumbnailUrl: media.url,
      thumbnailPublicId: media.publicId,
    }));
  };

  const updateVariant = (id: string, patch: Partial<ProductFormVariant>) => {
    setVariants((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const applyBulkToVariants = () => {
    setVariants((prev) =>
      prev.map((entry) => ({
        ...entry,
        price: bulkPrice !== '' ? bulkPrice : entry.price,
        stock: bulkStock !== '' ? toNumber(bulkStock, entry.stock) : entry.stock,
      }))
    );
  };

  const setGalleryImageFilesLocal = (files: File[]) => {
    setGalleryImages([]);
    setGalleryImageFiles(files);
  };

  const addVideoReview = () => {
    setVideoReviews((prev) => [...prev, { id: makeId(), url: '', thumbnailUrl: '' }]);
  };

  const removeVideoReview = (id: string) => {
    setVideoReviews((prev) => prev.filter((entry) => entry.id !== id));
  };

  const updateVideoReview = (id: string, patch: Partial<ProductFormVideoReview>) => {
    setVideoReviews((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollectionIds((prev) => {
      if (prev.includes(collectionId)) {
        return prev.filter((id) => id !== collectionId);
      }
      return [...prev, collectionId];
    });
  };

  const addGlobalOptionDefinition = (nameValue: string, isColor: boolean) => {
    const normalized = nameValue.trim();
    if (!normalized) {
      toast.error('Option name is required.');
      return;
    }

    const baseKey = toKey(normalized);
    let key = baseKey;
    let sequence = 1;
    while (globalOptionDefinitions.some((entry) => entry.key === key)) {
      sequence += 1;
      key = `${baseKey}-${sequence}`;
    }

    setGlobalOptionDefinitions((prev) => [
      ...prev,
      {
        key,
        name: normalized,
        isColor,
        values: [],
      },
    ]);

    toast.success('Global option property added.');
  };

  const addOptionGroupToProduct = (definitionKey: string) => {
    const definition = globalOptionDefinitions.find((entry) => entry.key === definitionKey);
    if (!definition) return;

    if (optionGroups.some((entry) => entry.key === definition.key)) {
      toast.warn('Option already added to this product.');
      return;
    }

    setOptionGroups((prev) => [...prev, createGroupFromDefinition(definition)]);
  };

  const removeOptionGroupFromProduct = (groupId: string) => {
    const target = optionGroups.find((entry) => entry.id === groupId);
    setOptionGroups((prev) => prev.filter((entry) => entry.id !== groupId));

    if (target && target.key === parentOptionKey) {
      setParentOptionKey(optionGroups.find((entry) => entry.id !== groupId)?.key || 'color');
    }

    if (target && target.key === childOptionKey) {
      setChildOptionKey(optionGroups.find((entry) => entry.id !== groupId && entry.key !== parentOptionKey)?.key || '');
    }
  };

  const toggleOptionValueSelection = (groupId: string, valueId: string) => {
    setOptionGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;

        const selected = group.selectedValueIds.includes(valueId)
          ? group.selectedValueIds.filter((id) => id !== valueId)
          : [...group.selectedValueIds, valueId];

        return {
          ...group,
          selectedValueIds: selected,
        };
      })
    );
  };

  const addOptionValue = (groupId: string, labelValue: string, colorHex?: string) => {
    const normalized = labelValue.trim();
    if (!normalized) {
      toast.error('Option value is required.');
      return;
    }

    const group = optionGroups.find((entry) => entry.id === groupId);
    if (!group) return;

    if (group.values.some((entry) => entry.label.toLowerCase() === normalized.toLowerCase())) {
      toast.warn('Value already exists.');
      return;
    }

    const localValue: OptionValue = {
      id: makeId(),
      label: normalized,
      ...(group.isColor ? { colorHex: colorHex || '#000000' } : {}),
    };

    setOptionGroups((prev) =>
      prev.map((entry) =>
        entry.id === groupId
          ? {
              ...entry,
              values: [...entry.values, localValue],
              selectedValueIds: [...entry.selectedValueIds, localValue.id],
            }
          : entry
      )
    );

    setGlobalOptionDefinitions((prev) =>
      prev.map((definition) => {
        if (definition.key !== group.key) return definition;
        if (definition.values.some((entry) => entry.label.toLowerCase() === normalized.toLowerCase())) {
          return definition;
        }

        return {
          ...definition,
          values: [
            ...definition.values,
            {
              id: makeId(),
              label: normalized,
              ...(definition.isColor ? { colorHex: colorHex || '#000000' } : {}),
            },
          ],
        };
      })
    );
  };

  const updateOptionValueColor = (groupId: string, valueId: string, colorHex: string) => {
    const group = optionGroups.find((entry) => entry.id === groupId);
    if (!group || !group.isColor) return;

    const valueLabel = group.values.find((entry) => entry.id === valueId)?.label || '';

    setOptionGroups((prev) =>
      prev.map((entry) =>
        entry.id === groupId
          ? {
              ...entry,
              values: entry.values.map((value) => (value.id === valueId ? { ...value, colorHex } : value)),
            }
          : entry
      )
    );

    setGlobalOptionDefinitions((prev) =>
      prev.map((definition) => {
        if (definition.key !== group.key) return definition;

        return {
          ...definition,
          values: definition.values.map((value) =>
            value.label.toLowerCase() === valueLabel.toLowerCase() ? { ...value, colorHex } : value
          ),
        };
      })
    );
  };

  const setDependentChildrenForParent = (parentValueId: string, childValueIds: string[]) => {
    setDependentChildSelections((prev) => ({
      ...prev,
      [parentValueId]: childValueIds,
    }));
  };

  const toVariantPayload = () => {
    const inheritedSentForParent = new Set<string>();
    const colorImageMap = new Map<
      string,
      {
        imageUrl?: string;
        imagePublicId?: string;
        imageFile?: File;
      }
    >();

    for (const variant of variants) {
      const inherited = variant.parentValueId ? parentImageMap[variant.parentValueId] : undefined;
      const colorKey = (variant.color || '').trim().toLowerCase();
      const candidate = {
        imageUrl: variant.imageUrl || inherited?.imageUrl,
        imagePublicId: variant.imagePublicId || inherited?.imagePublicId,
        imageFile: variant.imageFile || inherited?.file,
      };

      if (colorKey && (candidate.imageUrl || candidate.imageFile) && !colorImageMap.has(colorKey)) {
        colorImageMap.set(colorKey, candidate);
      }
    }

    return variants.map<UpsertProductVariantRequest>((variant) => {
      const inherited = variant.parentValueId ? parentImageMap[variant.parentValueId] : undefined;
      const colorKey = (variant.color || '').trim().toLowerCase();
      const colorInherited = colorImageMap.get(colorKey);
      const canUseInheritedFile = Boolean(
        variant.parentValueId &&
          inherited?.file &&
          !variant.imageFile &&
          !inheritedSentForParent.has(variant.parentValueId)
      );

      if (canUseInheritedFile && variant.parentValueId) {
        inheritedSentForParent.add(variant.parentValueId);
      }

      return {
        clientKey: variant.id,
        parentValueId: variant.parentValueId,
        size:
          variant.size.trim() ||
          getOptionValueByKeyword(variant.options, ['size']) ||
          'Default',
        color:
          variant.color.trim() ||
          getOptionValueByKeyword(variant.options, ['color', 'colour']) ||
          'Default',
        gender:
          variant.gender?.trim() ||
          getOptionValueByKeyword(variant.options, ['gender']) ||
          undefined,
        optionSummary: variant.optionSummary,
        options: variant.options,
        price: useBasePriceForVariants ? undefined : toNumber(variant.price, 0),
        sku: variant.sku.trim(),
        stock: Number(variant.stock || 0),
        isActive: variant.isActive,
        imageUrl: variant.imageUrl || inherited?.imageUrl || colorInherited?.imageUrl,
        imagePublicId: variant.imagePublicId || inherited?.imagePublicId || colorInherited?.imagePublicId,
        imageFile: variant.imageFile || (canUseInheritedFile ? inherited?.file : undefined) || colorInherited?.imageFile,
      };
    });
  };

  const toVideoPayload = () => {
    return videoReviews
      .map<UpsertProductVideoReviewRequest>((review) => ({
        clientKey: review.id,
        videoUrl: review.url.trim(),
        thumbnailUrl: review.thumbnailUrl.trim() || undefined,
        thumbnailPublicId: review.thumbnailPublicId,
        thumbnailFile: review.thumbnailFile,
      }))
      .filter((review) => Boolean(review.videoUrl));
  };

  const validateBeforeSubmit = () => {
    if (!name.trim()) {
      toast.error('Product name is required.');
      return false;
    }

    if (!selectedCollectionIds.length) {
      toast.error('Select at least one collection.');
      return false;
    }

    if (!isEditMode && !mainImageFile && !mainImageUrl) {
      toast.error('Main image is required.');
      return false;
    }

    if (!variants.length) {
      toast.error('Select option values to generate variants.');
      return false;
    }

    const regular = toNumber(regularPrice || basePrice, 0);
    if (salePrice !== '' && toNumber(salePrice, 0) > regular) {
      toast.error('Sale price cannot be greater than regular price.');
      return false;
    }

    return true;
  };

  async function submitProduct(statusOverride?: ProductStatus) {
    if (!validateBeforeSubmit()) return false;

    setIsSubmitting(true);

    try {
      const payload: CreateProductRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        orderType,
        collectionIds: selectedCollectionIds,
        status: statusOverride ?? status,
        basePrice: toNumber(regularPrice || basePrice, 0),
        regularPrice: toNumber(regularPrice || basePrice, 0),
        salePrice: salePrice !== '' ? toNumber(salePrice, 0) : undefined,
        badgeName: badgeName.trim() || undefined,
        useBasePriceForVariants,
        variantConfig: {
          mode: variantMode,
          parentOptionKey,
          childOptionKey,
        },
        variants: toVariantPayload(),
        videoReviews: toVideoPayload(),
        mainVideo: mainVideo.url.trim()
          ? {
              videoUrl: mainVideo.url.trim(),
              thumbnailUrl: mainVideo.thumbnailUrl || undefined,
              thumbnailPublicId: mainVideo.thumbnailPublicId,
            }
          : undefined,
        mainImageUrl: mainImageUrl || undefined,
        mainImagePublicId: mainImagePublicId || undefined,
        galleryImages,
        mainImageFile: mainImageFile || undefined,
        mainVideoThumbnailFile: mainVideo.thumbnailFile,
        galleryImageFiles,
        inventory: {
          trackQuantity: true,
          allowBackorder: false,
          globalStock: toNumber(globalStock, 0),
        },
      };

      const response = await createAdminProductApi(payload);
      if (response.message) toast.warn(response.message);
      else toast.success('Product created successfully.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create product.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitProductUpdate(statusOverride?: ProductStatus) {
    if (!productId) return false;
    if (!validateBeforeSubmit()) return false;

    setIsSubmitting(true);

    try {
      const payload: UpdateProductRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        orderType,
        collectionIds: selectedCollectionIds,
        status: statusOverride ?? status,
        basePrice: toNumber(regularPrice || basePrice, 0),
        regularPrice: toNumber(regularPrice || basePrice, 0),
        salePrice: salePrice !== '' ? toNumber(salePrice, 0) : undefined,
        badgeName: badgeName.trim() || undefined,
        useBasePriceForVariants,
        variantConfig: {
          mode: variantMode,
          parentOptionKey,
          childOptionKey,
        },
        variants: toVariantPayload(),
        videoReviews: toVideoPayload(),
        mainVideo: mainVideo.url.trim()
          ? {
              videoUrl: mainVideo.url.trim(),
              thumbnailUrl: mainVideo.thumbnailUrl || undefined,
              thumbnailPublicId: mainVideo.thumbnailPublicId,
            }
          : undefined,
        mainImageUrl: mainImageUrl || undefined,
        mainImagePublicId: mainImagePublicId || undefined,
        galleryImages,
        mainImageFile: mainImageFile || undefined,
        mainVideoThumbnailFile: mainVideo.thumbnailFile,
        galleryImageFiles,
        inventory: {
          trackQuantity: true,
          allowBackorder: false,
          globalStock: toNumber(globalStock, 0),
        },
      };

      const response = await updateAdminProductApi(productId, payload);
      if (response.message) toast.warn(response.message);
      else toast.success('Product updated successfully.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update product.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isEditMode,
    isLoading,
    isSubmitting,
    name,
    setName,
    description,
    setDescription,
    orderType,
    setOrderType,
    status,
    setStatus,
    basePrice,
    setBasePrice,
    regularPrice,
    setRegularPrice,
    salePrice,
    setSalePrice,
    badgeName,
    setBadgeName,
    useBasePriceForVariants,
    setUseBasePriceForVariants,
    globalStock,
    setGlobalStock,
    mainImageFile,
    setMainImageFile: setMainImageLocalFile,
    mainImageUrl,
    mainImagePublicId,
    mainImagePreview,
    galleryImageFiles,
    setGalleryImageFiles: setGalleryImageFilesLocal,
    galleryImages,
    setMainImageFromMedia,
    addGalleryImagesFromMedia,
    removeGalleryMedia,
    variants,
    updateVariant,
    setVariantImageFromMedia,
    bulkPrice,
    setBulkPrice,
    bulkStock,
    setBulkStock,
    applyBulkToVariants,
    videoReviews,
    addVideoReview,
    removeVideoReview,
    updateVideoReview,
    setVideoThumbnailFromMedia,
    mainVideo,
    setMainVideoField,
    setMainVideoThumbnailFile,
    setMainVideoThumbnailFromMedia,
    filteredCollections,
    isCollectionLoading,
    collectionSearch,
    setCollectionSearch,
    selectedCollectionIds,
    toggleCollection,
    optionGroups,
    globalOptionDefinitions,
    availableGlobalOptions,
    variantMode,
    setVariantMode,
    parentOptionKey,
    setParentOptionKey,
    childOptionKey,
    setChildOptionKey,
    parentGroup,
    childGroup,
    nonParentGroups,
    selectedParentValues,
    selectedChildValues,
    dependentChildSelections,
    setDependentChildrenForParent,
    parentImageMap,
    setParentValueImage,
    setParentValueImageFromMedia,
    addGlobalOptionDefinition,
    addOptionGroupToProduct,
    removeOptionGroupFromProduct,
    toggleOptionValueSelection,
    addOptionValue,
    updateOptionValueColor,
    regenerateVariantsFromOptions: regenerateVariants,
    submitProduct,
    submitProductUpdate,
  };
}
