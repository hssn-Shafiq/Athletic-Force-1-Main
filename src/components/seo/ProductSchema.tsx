import React from 'react';
import { PublicProduct } from '@/lib/api/types';

interface ProductSchemaProps {
  product: any; // Using any for flexibility or use PublicProduct with expanded fields
}

export const ProductSchema: React.FC<ProductSchemaProps> = ({ product }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleticforce1.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.mainImageUrl,
    description: (product.seo?.metaDescription || product.description || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(),
    sku: product.variants?.[0]?.sku,
    gtin: product.gtin,
    mpn: product.mpn,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Athletic Force 1',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: 'USD',
      price: product.salePrice || product.regularPrice || product.basePrice,
      priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inventory?.globalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
