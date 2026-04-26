
import type { Metadata, ResolvingMetadata } from "next";
import SubCollectionClient from "./SubCollectionClient";
import { getCollectionHierarchyApi } from "@/lib/api/publicCollections";

type Props = {
  params: Promise<{ categoryId: string; subCategoryId: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { categoryId, subCategoryId } = await params;
  
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

    const title = `${subName} | ${parentName} | Athletic Force 1`;
    const description = `Explore our elite selection of ${subName}. High-performance tactical gear from Athletic Force 1.`;

    return {
      title,
      description,
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

export default function SubCollectionPage() {
  return <SubCollectionClient />;
}
