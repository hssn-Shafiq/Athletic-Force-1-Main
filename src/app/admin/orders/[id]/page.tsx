import { Metadata } from 'next';
import OrderDetailClient from './OrderDetailClient';

export const metadata: Metadata = {
  title: 'Order Management | Admin',
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <OrderDetailClient orderId={resolvedParams.id} />;
}
