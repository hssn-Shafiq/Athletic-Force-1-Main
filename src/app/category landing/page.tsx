import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Category Landing | Athletic Force 1',
  description: 'Browse parent collections and featured sub-collections.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CategoryLandingAliasPage() {
  redirect('/collections/custom-uniforms');
}
