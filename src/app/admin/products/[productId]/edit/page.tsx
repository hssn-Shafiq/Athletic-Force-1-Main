import { Suspense } from 'react';
import { ProductForm } from '../../../../../admin/ProductForm';

type ProductEditPageProps = {
  params:
    | {
        productId: string;
      }
    | Promise<{
        productId: string;
      }>;
};

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const resolved = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-6" />}>
      <ProductForm productId={resolved.productId} />
    </Suspense>
  );
}
