
import type { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = {
  title: "Cart | Athletic Force 1",
  description: "Review your selected uniforms and accessories before checkout at Athletic Force 1.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Cart | Athletic Force 1",
    description: "Review your selected uniforms and accessories before checkout at Athletic Force 1.",
    type: "website",
  },
};

export default function CartPage() {
  return <CartPageClient />;
}
