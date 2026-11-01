import type { Metadata } from "next";
import PrivacyPolicyClient from "./PrivacyPolicyClient";
import { getPageMetaApi } from "@/lib/api/pageMeta";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi("privacy-policy");
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
    console.error("Failed to load Privacy Policy SEO metadata:", error);
  }

  return {
    title: "Privacy Policy | Athletic Force 1",
    description: "Review how Athletic Force 1 collects, protects, and uses customer information.",
  };
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
