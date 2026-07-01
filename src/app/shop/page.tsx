
import type { Metadata } from "next";
import ShopClient from "./ShopClient";
import { getPageMetaApi } from "@/lib/api/pageMeta";
import { getExploreProductsApi } from "@/lib/api/publicProducts";
import { getCollectionHierarchyApi } from "@/lib/api/publicCollections";
import { Suspense } from "react";

type PageProps = {
  searchParams: Promise<{ 
    collection?: string; 
    category?: string; 
    q?: string; 
    sort?: string; 
    maxPrice?: string; 
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi("shop");
    if (res.ok && res.meta) {
      return {
        title: res.meta.title,
        description: res.meta.description,
        openGraph: {
          title: res.meta.title,
          description: res.meta.description,
        }
      };
    }
  } catch (err) {}

  return {
    title: "Shop Elite Tactical Gear | Athletic Force 1",
    description: "Explore the Athletic Force 1 Armory. High-performance tactical gear, compression wear, and custom uniforms for elite athletes.",
  };
}

export default async function ShopPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Extract tactical parameters from URL
  const collection = params.category || params.collection;
  const search = params.q;
  const sortBy = params.sort || 'most-selling';
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : 1400;

  // Prefetch data on the server based on URL parameters
  const [productRes, hierarchyRes] = await Promise.all([
    getExploreProductsApi({
      collection: collection === "ALL" ? undefined : collection,
      search: search || undefined,
      maxPrice: maxPrice,
      sortBy: sortBy,
      pageSize: 40,
    }),
    getCollectionHierarchyApi()
  ]);

  const initialProducts = productRes.ok ? productRes.items : [];
  const initialHierarchy = hierarchyRes.ok ? hierarchyRes.hierarchy : [];

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ShopClient 
        initialProducts={initialProducts as any} 
        initialHierarchy={initialHierarchy as any} 
      />
    </Suspense>
  );
}
