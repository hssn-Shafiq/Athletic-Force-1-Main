
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import ProductSingleClient from "./ProductSingleClient";
import { getExploreProductBySlugApi } from "@/lib/api/publicProducts";

import { ProductSchema } from "@/components/seo/ProductSchema";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleticforce1.com';

  try {
    const response = await getExploreProductBySlugApi(slug);

    if (!response.ok || !response.product) {
      return {
        title: "Product Not Found | Athletic Force 1"
      };
    }

    const product = response.product;
    const previousImages = (await parent).openGraph?.images || [];
    const canonical = product.seo?.canonicalUrl || `/products/${product.slug}`;

    const cleanDescription = (product.seo?.metaDescription || product.description || '')
      .replace(/<[^>]*>/g, '') // Strip tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim()
      .slice(0, 160);

    return {
      title: product.seo?.pageTitle || `${product.name} | Athletic Force 1`,
      description: cleanDescription || `Explore ${product.name} with Athletic Force 1.`,
      alternates: {
        canonical: `${baseUrl}${canonical}`,
      },
      keywords: product.seo?.keywords?.length ? product.seo.keywords : product.tags,
      openGraph: {
        title: product.seo?.pageTitle || `${product.name} | Athletic Force 1`,
        description: cleanDescription,
        images: product.mainImageUrl ? [{ url: product.mainImageUrl, alt: product.mainImageAlt || product.name }, ...previousImages] : previousImages,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.seo?.pageTitle || `${product.name} | Athletic Force 1`,
        description: cleanDescription,
        images: product.mainImageUrl ? [product.mainImageUrl] : [],
      }
    };
  } catch (err) {
    return {
      title: "Product Details | Athletic Force 1"
    };
  }
}

export default async function ProductSinglePage({ params }: Props) {
  const { slug } = await params;

  try {
    const response = await getExploreProductBySlugApi(slug);
    if (!response.ok || !response.product) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-black text-slate-900 italic uppercase">Product Not Found</h1>
            <p className="text-slate-500 font-medium">The tactical gear you are looking for has been extracted or relocated.</p>
            <Link href="/shop" className="inline-block bg-black text-white px-8 py-3 rounded-xl font-black uppercase italic tracking-tighter hover:bg-orange-600 transition-all">
              Return to Armory
            </Link>
          </div>
        </div>
      );
    }

    return (
      <>
        <ProductSchema product={response.product} />
        <ProductSingleClient initialProduct={response.product} />
      </>
    );
  } catch (error) {
    return <ProductSingleClient />; // Fallback to client-side fetch if server-side fails
  }
}
