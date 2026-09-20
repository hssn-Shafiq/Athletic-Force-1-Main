import type { Metadata } from 'next';
import { VendorLayout } from '@/vendor/VendorLayout';

export const metadata: Metadata = {
  title: {
    default: 'Vendor Terminal | Athletic Force 1',
    template: '%s | AF1 Merchant',
  },
  description: 'Merchant dashboard for Athletic Force 1 team stores and branded products.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <VendorLayout>{children}</VendorLayout>;
}
