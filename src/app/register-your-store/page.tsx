import type { Metadata } from 'next';
import { getPageMetaApi } from '@/lib/api/pageMeta';
import { VendorRegistration } from './_components/VendorRegistration';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi('register-your-store');
    if (res.ok && res.meta) {
      return {
        title: res.meta.title,
        description: res.meta.description,
        openGraph: {
          title: res.meta.title,
          description: res.meta.description,
        },
      };
    }
  } catch (_err) {}

  return {
    title: 'Register Your Store | Athletic Force 1',
    description:
      'Join the elite AF1 vendor network. Register your store and integrate your brand into the Athletic Force 1 ecosystem to reach high-performance athletes and teams.',
  };
}

export default function VendorRegistrationPage() {
  return (
    <main className="bg-[var(--color-page-background)] min-h-screen">
      <VendorRegistration />
    </main>
  );
}
