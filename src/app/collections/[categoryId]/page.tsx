import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CategoryLandingPage } from '../../category landing/CategoryLandingPage';
import { getCategoryLandingMetadata } from '../../../lib/categoryLandingData';

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
  return getCategoryLandingMetadata(categoryId);
}

export default async function CollectionsCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;

  if (categoryId === 'team-store') {
    redirect('/team-stores');
  }

  return <CategoryLandingPage categoryId={categoryId} />;
}
