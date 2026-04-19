import type { Metadata } from 'next';
import { AdminLayout } from '../../admin/AdminLayout';

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard | Athletic Force 1',
    template: '%s | AF1 Admin',
  },
  description: 'Administrative dashboard for Athletic Force 1 operations.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
