import type { Metadata } from 'next';
import { CategoryLandingPage } from '../../category landing/CategoryLandingPage';
import { getCategoryLandingMetadata } from '../../../lib/categoryLandingData';

type PageProps = {
  params: Promise<{
    categoryId: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoryId } = await params;
  return getCategoryLandingMetadata(categoryId);
}

export default async function CollectionsCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;

  return <CategoryLandingPage categoryId={categoryId} />;
}
