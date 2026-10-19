import { Suspense } from 'react';
import { ProductForm } from '../../../../admin/ProductForm';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-6" />}>
      <ProductForm />
    </Suspense>
  );
}
