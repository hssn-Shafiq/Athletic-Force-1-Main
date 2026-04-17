import type { Metadata } from 'next';

export type CategoryLandingData = {
  description: string;
  subCategories: string[];
  bgImage: string;
};

export const CATEGORY_LANDING_DATA: Record<string, CategoryLandingData> = {
  'Custom Uniforms': {
    description:
      "Design your team's identity with our professional-grade custom uniforms. Built for performance, tailored for victory.",
    subCategories: [
      'Football',
      'Basketball',
      '7v7 Uniforms',
      'Soccer',
      'Track & Field',
      'Coaches',
      'Cheer',
      'Wrestling',
      'Baseball',
    ],
    bgImage:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000',
  },
  Accessories: {
    description:
      'Complete your look and enhance your performance with our premium athletic accessories.',
    subCategories: [
      'Spirit Pack',
      'Shirts',
      'Polos',
      'Hoodies',
      'Warmups',
      'Compressions',
      'Shorts',
      'Socks',
      'Jackets',
      'Bags',
      'Gloves',
    ],
    bgImage:
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=2000',
  },
  Merchandise: {
    description:
      'High-quality gear and essentials for athletes who demand the best in every training session.',
    subCategories: [
      'Towels',
      'Mouthguards',
      'Helmet',
      'Leg Sleeves',
      'Arm Sleeves',
      'Visors',
      'Wristband',
      'Poms',
      'Shoes',
      'Practice Gear',
      'Spirit Pack',
      'Gloves',
    ],
    bgImage:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=2000',
  },
  'Team Store': {
    description:
      'Give your community one place to discover, order, and represent your team with custom gear.',
    subCategories: ['Find Your Team Store', 'Bulk Orders'],
    bgImage:
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=2000',
  },
};

export const categoryIdToKey = (id: string) =>
  id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const categoryKeyToId = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const getCategoryLandingData = (categoryId: string) => {
  const currentCategory = categoryId ? categoryIdToKey(categoryId) : '';
  const categoryData = CATEGORY_LANDING_DATA[currentCategory as keyof typeof CATEGORY_LANDING_DATA];

  return {
    currentCategory,
    categoryData,
  };
};

export const getCategoryLandingMetadata = (categoryId: string): Metadata => {
  const { currentCategory, categoryData } = getCategoryLandingData(categoryId);

  if (!categoryData) {
    return {
      title: 'Collection Not Found | Athletic Force 1',
      description: 'The requested collection could not be found.',
    };
  }

  return {
    title: `${currentCategory} | Athletic Force 1`,
    description: categoryData.description,
    openGraph: {
      title: `${currentCategory} | Athletic Force 1`,
      description: categoryData.description,
      type: 'website',
      images: [
        {
          url: categoryData.bgImage,
          alt: currentCategory,
        },
      ],
    },
  };
};
