
import type { Metadata } from "next";
import CheckoutPageClient from "./CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout | Athletic Force 1",
  description: "Complete your Athletic Force 1 order securely with fast shipping details and payment options.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Checkout | Athletic Force 1",
    description: "Complete your Athletic Force 1 order securely with fast shipping details and payment options.",
    type: "website",
  },
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
