import type { Metadata } from "next";
import ProductSingleClient from "./ProductSingleClient";

export const metadata: Metadata = {
  title: "Product Details | Athletic Force 1",
  description:
    "Explore product details, ratings, available sizes, and complete your order with Athletic Force 1.",
  openGraph: {
    title: "Product Details | Athletic Force 1",
    description:
      "Explore product details, ratings, available sizes, and complete your order with Athletic Force 1.",
    type: "website",
  },
};

export default function ProductSinglePage() {
  return <ProductSingleClient />;
}
