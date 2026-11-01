
import AboutClient from "./AboutClient";
import { getPageContentApi } from "@/lib/api/pageContent";
import { getPageMetaApi } from "@/lib/api/pageMeta";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi("about");
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
    console.error("Failed to load About page SEO metadata:", error);
  }

  return {
    title: "About Us | Athletic Force 1",
    description: "Learn about the mission, vision, and journey of Athletic Force 1 - the elite choice for high-performance team uniforms and gear.",
  };
}

export default async function AboutPage() {
  const res = await getPageContentApi("about");
  const initialData = res.ok ? res.data : null;
  
  return <AboutClient initialData={initialData} />;
}
