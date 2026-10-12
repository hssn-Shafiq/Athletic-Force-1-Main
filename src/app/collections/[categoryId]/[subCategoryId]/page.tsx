
import type { Metadata, ResolvingMetadata } from "next";
import SubCollectionClient from "./SubCollectionClient";
import { getCollectionHierarchyApi, getCollectionDetailsApi } from "@/lib/api/publicCollections";
import { getExploreProductsApi } from "@/lib/api/publicProducts";
import { ChildCollectionsGrid } from "@/components/collections/ChildCollectionsGrid";

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
    const res = await getCollectionDetailsApi(subCategoryId);
    
    if (res.ok && res.collection) {
      const col = res.collection;
      const title = col.seo?.pageTitle || `${col.name} | Athletic Force 1`;
      const description =
        col.seo?.metaDescription ||
        (col.description ||
          `Explore our elite selection of ${col.name}. High-performance gear from Athletic Force 1.`);
      const canonical = col.seo?.canonicalUrl || `/collections/${categoryId}/${subCategoryId}`;

      return {
        title,
        description,
        alternates: { canonical: `${baseUrl}${canonical}` },
        openGraph: { title, description, type: "website" },
        twitter: { card: "summary_large_image", title, description },
      };
    }
  } catch {
    // fallback below
  }

  // Legacy fallback using hierarchy
  try {
    const response = await getCollectionHierarchyApi();
    if (response.ok && response.hierarchy) {
      const hierarchy = response.hierarchy;
      const parentCollection = hierarchy.find(
        (p) => p.slug.toLowerCase() === categoryId.toLowerCase()
      );
      const subCollection = parentCollection?.subcategories.find(
        (s) => s.slug.toLowerCase() === subCategoryId.toLowerCase()
      );
      const parentName =
        parentCollection?.name ||
        categoryId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const subName =
        subCollection?.name ||
        subCategoryId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const title = `${subName} | ${parentName} | Athletic Force 1`;
      const description = `Explore our elite selection of ${subName}. High-performance tactical gear from Athletic Force 1.`;
      return { title, description };
    }
  } catch {
    // last resort
  }

  return { title: "Collection | Athletic Force 1" };
}

export default async function SubCollectionPage({ params }: Props) {
  const { categoryId, subCategoryId } = await params;

  // ── Fetch the sub-collection's details to check if it has children ──────────
  try {
    const subRes = await getCollectionDetailsApi(subCategoryId);

    if (subRes.ok && subRes.collection) {
      const subCollection = subRes.collection;

      // ── INTERMEDIATE PARENT: sub-collection itself has children ─────────────
      if (subCollection.hasChildren && subCollection.children.length > 0) {
        // Also fetch the parent name for breadcrumbs
        let parentInfo: { name: string; slug: string } | null = null;
        try {
          const parentRes = await getCollectionDetailsApi(categoryId);
          if (parentRes.ok && parentRes.collection) {
            parentInfo = { name: parentRes.collection.name, slug: parentRes.collection.slug };
          }
        } catch {
          parentInfo = {
            name: categoryId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            slug: categoryId,
          };
        }

        return (
          <ChildCollectionsGrid
            currentCollection={{
              id: subCollection.id,
              name: subCollection.name,
              slug: subCollection.slug,
              description: subCollection.description,
              imageUrl: subCollection.imageUrl,
            }}
            children={subCollection.children}
            parentCollection={parentInfo}
            baseHref={`/collections/${subCategoryId}`}
          />
        );
      }
    }
  } catch {
    // If the details API fails, fall through to the product grid
  }

  // ── LEAF COLLECTION: show product grid ──────────────────────────────────────
  const [productRes, hierarchyRes] = await Promise.all([
    getExploreProductsApi({
      collection: subCategoryId,
      pageSize: 40,
      sortBy: "newest",
    }),
    getCollectionHierarchyApi(),
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
