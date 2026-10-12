import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCollectionDetailsApi } from '@/lib/api/publicCollections';
import { ChildCollectionsGrid } from '@/components/collections/ChildCollectionsGrid';
import { CategoryLandingPage } from '../../category landing/CategoryLandingPage';
import { getCategoryLandingMetadata } from '../../../lib/categoryLandingData';
import SubCollectionClient from './[subCategoryId]/SubCollectionClient';
import { getExploreProductsApi } from '@/lib/api/publicProducts';
import { getCollectionHierarchyApi } from '@/lib/api/publicCollections';

type PageProps = {
  params: Promise<{
    categoryId: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoryId } = await params;

  if (categoryId === 'team-store') {
    return {
      title: 'Team Stores | Athletic Force 1',
      description: 'Discover and shop official gear for team stores at Athletic Force 1.',
    };
  }

  // Try to get SEO from the actual DB collection
  try {
    const res = await getCollectionDetailsApi(categoryId);
    if (res.ok && res.collection) {
      const col = res.collection;
      const title = col.seo?.pageTitle || `${col.name} | Athletic Force 1`;
      const description =
        col.seo?.metaDescription ||
        (col.description
          ? col.description
          : `Shop ${col.name} at Athletic Force 1 — premium performance gear.`);
      return { title, description };
    }
  } catch {
    // fallback below
  }

  return getCategoryLandingMetadata(categoryId);
}

export default async function CollectionsCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;

  if (categoryId === 'team-store') {
    redirect('/team-stores');
  }

  // ── Fetch collection details from DB ────────────────────────────────────────
  try {
    const res = await getCollectionDetailsApi(categoryId);

    if (res.ok && res.collection) {
      const collection = res.collection;

      // ── PARENT COLLECTION: has children → show child collection grid ────────
      if (collection.hasChildren && collection.children.length > 0) {
        return (
          <ChildCollectionsGrid
            currentCollection={{
              id: collection.id,
              name: collection.name,
              slug: collection.slug,
              description: collection.description,
              imageUrl: collection.imageUrl,
            }}
            children={collection.children}
            parentCollection={null} // top-level collection has no parent breadcrumb
            baseHref={`/collections/${collection.slug}`}
          />
        );
      }

      // ── LEAF COLLECTION: no children → show products directly ───────────────
      const [productRes, hierarchyRes] = await Promise.all([
        getExploreProductsApi({ collection: categoryId, pageSize: 40, sortBy: 'newest' }),
        getCollectionHierarchyApi(),
      ]);

      const initialProducts = productRes.ok ? productRes.items : [];
      const initialHierarchy = hierarchyRes.ok ? hierarchyRes.hierarchy : [];

      return (
        <SubCollectionClient
          initialProducts={initialProducts as any}
          initialHierarchy={initialHierarchy as any}
          overrideParentSlug={categoryId}
          overrideSubSlug={categoryId}
        />
      );
    }
  } catch {
    // Fallback to static landing page if collection not found in DB
  }

  // Fallback: static category landing page (handles custom-unifomrs / accessories / etc.)
  return <CategoryLandingPage categoryId={categoryId} />;
}
