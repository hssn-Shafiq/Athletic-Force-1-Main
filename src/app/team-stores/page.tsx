import type { Metadata } from 'next';
import { TeamStoresClient } from './_components/TeamStoresClient';

export const metadata: Metadata = {
  title: 'Official Team Stores | Athletic Force 1',
  description: 'Discover and shop official gear, spirit packs, and custom apparel for partner athletic team stores at Athletic Force 1.',
  openGraph: {
    title: 'Official Team Stores | Athletic Force 1',
    description: 'Discover and shop official gear, spirit packs, and custom apparel for partner athletic team stores at Athletic Force 1.',
    type: 'website',
  },
};

export default function TeamStoresPage() {
  return <TeamStoresClient />;
}
