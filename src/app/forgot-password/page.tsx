import type { Metadata } from 'next';
import { ForgotPasswordPage } from '../forgetPassword/ForgetPasswordPage';

export const metadata: Metadata = {
  title: 'Forgot Password | Athletic Force 1',
  description: 'Request a secure password reset link to regain access to your Athletic Force 1 account.',
  openGraph: {
    title: 'Forgot Password | Athletic Force 1',
    description: 'Send a password recovery link to your email.',
    type: 'website',
  },
};

export default function Page() {
  return <ForgotPasswordPage />;
}
