
import type { Metadata } from "next";
import ThankYouClient from "./ThankYouClient";

export const metadata: Metadata = {
  title: "Thank You | Athletic Force 1",
  description: "Your order has been placed successfully. Thank you for choosing Athletic Force 1.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThankYouPage() {
  return <ThankYouClient />;
}
