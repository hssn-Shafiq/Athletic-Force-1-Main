
import type { Metadata } from "next";
import { Suspense } from "react";
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
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <ThankYouClient />
    </Suspense>
  );
}
