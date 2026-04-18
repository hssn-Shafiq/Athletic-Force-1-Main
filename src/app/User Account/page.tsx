import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Redirecting | Athletic Force 1',
	description: 'Redirecting to account page.',
	robots: { index: false, follow: true },
};

export default function Page() {
	redirect('/account');
}
