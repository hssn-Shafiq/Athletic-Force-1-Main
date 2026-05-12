
import type { Metadata, ResolvingMetadata } from "next";
import SubCollectionClient from "./SubCollectionClient";
import { getCollectionHierarchyApi } from "@/lib/api/publicCollections";
import { getExploreProductsApi } from "@/lib/api/publicProducts";

type Props = {
  params: Promise<{ categoryId: string; subCategoryId: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { categoryId, subCategoryId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleticforce1.com';
  
  try {
    const response = await getCollectionHierarchyApi();
    
    if (!response.ok || !response.hierarchy) {
       return { title: "Collection | Athletic Force 1" };
    }

    const hierarchy = response.hierarchy;
    
    // Fuzzy matching for slugs (case-insensitive)
    const parentCollection = hierarchy.find(p => p.slug.toLowerCase() === categoryId.toLowerCase());
    const subCollection = parentCollection?.subcategories.find(s => s.slug.toLowerCase() === subCategoryId.toLowerCase());

    const parentName = parentCollection?.name || categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const subName = subCollection?.name || subCategoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const title = (subCollection as any)?.seo?.pageTitle || `${subName} | ${parentName} | Athletic Force 1`;
    const description = (subCollection as any)?.seo?.metaDescription || `Explore our elite selection of ${subName}. High-performance tactical gear from Athletic Force 1.`;
    const canonical = (subCollection as any)?.seo?.canonicalUrl || `/collections/${categoryId}/${subCategoryId}`;

    return {
      title,
      description,
      alternates: {
        canonical: `${baseUrl}${canonical}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      }
    };
  } catch (err) {
    return {
      title: "Collections | Athletic Force 1"
    };
  }
}

export default async function SubCollectionPage({ params }: Props) {
  const { categoryId, subCategoryId } = await params;

  // Prefetch data on the server for lightning-fast initial load
  const [productRes, hierarchyRes] = await Promise.all([
    getExploreProductsApi({
      collection: subCategoryId,
      pageSize: 40,
      sortBy: 'newest'
    }),
    getCollectionHierarchyApi()
  ]);

  const initialProducts = productRes.ok ? productRes.items : [];
  const initialHierarchy = hierarchyRes.ok ? hierarchyRes.hierarchy : [];

  return (
    <SubCollectionClient 
      initialProducts={initialProducts as any} 
      initialHierarchy={initialHierarchy as any} 
    />
  );
}
