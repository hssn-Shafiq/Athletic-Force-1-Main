import { Metadata } from 'next';
import OrdersListClient from './OrdersListClient';

export const metadata: Metadata = {
  title: 'Order Management',
};

export default function AdminOrdersPage() {
  return <OrdersListClient />;
}
