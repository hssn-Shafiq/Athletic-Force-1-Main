
import type { Metadata, ResolvingMetadata } from "next";
import ProductSingleClient from "./ProductSingleClient";
import { getExploreProductBySlugApi } from "@/lib/api/publicProducts";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const response = await getExploreProductBySlugApi(slug);
    
    if (!response.ok || !response.product) {
       return {
         title: "Product Not Found | Athletic Force 1"
       };
    }

    const product = response.product;
    const previousImages = (await parent).openGraph?.images || [];

    return {
      title: `${product.name} | Athletic Force 1`,
      description: product.description || `Explore ${product.name}, ratings, available sizes, and complete your order with Athletic Force 1.`,
      openGraph: {
        title: `${product.name} | Athletic Force 1`,
        description: product.description || `Explore ${product.name} with Athletic Force 1.`,
        images: product.mainImageUrl ? [product.mainImageUrl, ...previousImages] : previousImages,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | Athletic Force 1`,
        description: product.description,
        images: product.mainImageUrl ? [product.mainImageUrl] : [],
      }
    };
  } catch (err) {
    return {
      title: "Product Details | Athletic Force 1"
    };
  }
}

export default function ProductSinglePage() {
  return <ProductSingleClient />;
}
