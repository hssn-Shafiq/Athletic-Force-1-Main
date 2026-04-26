
import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import { getPageMetaApi } from "@/lib/api/pageMeta";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi("blog");
    if (res.ok && res.meta) {
      return {
        title: res.meta.title,
        description: res.meta.description,
        openGraph: {
          title: res.meta.title,
          description: res.meta.description,
        }
      };
    }
  } catch (err) {}

  return {
    title: "Journal | Strategy & Stories | Athletic Force 1",
    description: "Athletic Force 1 Journal. Tactical strategy, premium uniform insights, and high-performance equipment decisions for elite teams.",
  };
}

export default function BlogPage() {
  return <BlogClient />;
}
