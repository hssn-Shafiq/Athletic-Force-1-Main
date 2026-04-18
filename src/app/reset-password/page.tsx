import type { Metadata } from 'next';
import { ResetPasswordPage } from '../rest password/ResetPasswordPage';

export const metadata: Metadata = {
  title: 'Reset Password | Athletic Force 1',
  description: 'Set a new password to secure and restore access to your Athletic Force 1 account.',
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Reset Password | Athletic Force 1',
    description: 'Create a new password for your account.',
    type: 'website',
  },
};

export default function Page() {
  return <ResetPasswordPage />;
}
