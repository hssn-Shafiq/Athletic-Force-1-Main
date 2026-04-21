import type { Metadata } from 'next';
import { RegisterPage } from './RegisterPage';

export const metadata: Metadata = {
  title: 'Register | Athletic Force 1',
  description: 'Create your Athletic Force 1 account to start managing your orders and profile.',
  openGraph: {
    title: 'Register | Athletic Force 1',
    description: 'Join Athletic Force 1 and manage your team gear in one place.',
    type: 'website',
  },
};

export default function Page() {
  return <RegisterPage />;
}
