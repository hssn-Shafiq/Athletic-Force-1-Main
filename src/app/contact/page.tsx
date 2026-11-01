import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import { getPageMetaApi } from "@/lib/api/pageMeta";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi("contact");
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
    console.error("Failed to load Contact page SEO metadata:", error);
  }

  return {
    title: "Contact Us | Team Orders & Support | Athletic Force 1",
    description: "Connect with the Athletic Force 1 team desk. Get custom uniform quotes, high-performance gear support, and expert equipment advice.",
  };
}

export default function ContactPage() {
  return <ContactClient />;
}
