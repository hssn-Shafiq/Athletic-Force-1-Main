import type { Metadata } from 'next';
import { AccountPage } from '../User Account/AccountPage';

export const metadata: Metadata = {
  title: 'My Account | Athletic Force 1',
  description: 'Manage your profile, orders, addresses, wishlist, and security settings.',
  openGraph: {
    title: 'My Account | Athletic Force 1',
    description: 'Your account dashboard for orders, profile, and settings.',
    type: 'website',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <AccountPage />;
}
