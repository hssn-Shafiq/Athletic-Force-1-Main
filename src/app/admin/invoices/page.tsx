import { Metadata } from 'next';
import { AdminInvoices } from '../../../admin/Invoices';

export const metadata: Metadata = {
  title: 'Invoice Management',
};

export default function AdminInvoicesPage() {
  return <AdminInvoices />;
}
