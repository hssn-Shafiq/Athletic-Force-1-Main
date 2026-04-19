import type { Metadata } from 'next';
import { LoginPage } from './LoginPage';

export const metadata: Metadata = {
	title: 'Login | Athletic Force 1',
	description: 'Sign in to your Athletic Force 1 account to manage orders, favorites, and profile settings.',
	openGraph: {
		title: 'Login | Athletic Force 1',
		description: 'Access your account and keep your team gear in sync.',
		type: 'website',
	},
};

export default function Page() {
	return <LoginPage />;
}
