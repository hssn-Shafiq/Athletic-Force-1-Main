import type { Metadata } from "next";
import TermsAndConditionsClient from "./TermsAndConditionsClient";
import { getPageMetaApi } from "@/lib/api/pageMeta";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi("terms-and-conditions");
    if (res.ok && res.meta) {
      return {
        title: res.meta.title,
        description: res.meta.description,
        openGraph: {
          title: res.meta.title,
          description: res.meta.description,
          ...(res.meta.ogImage ? { images: [res.meta.ogImage] } : {})
        }
      };
    }
  } catch (error) {
    console.error("Failed to load Terms and Conditions SEO metadata:", error);
  }

  return {
    title: "Terms & Conditions | Athletic Force 1",
    description: "Review the terms and conditions for using Athletic Force 1 products and services.",
  };
}

export default function TermsAndConditionsPage() {
  return <TermsAndConditionsClient />;
}
