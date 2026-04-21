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
  return <ProductForm productId={resolved.productId} />;
}
