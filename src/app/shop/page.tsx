
import type { Metadata } from "next";
import ShopClient from "./ShopClient";
import { getPageMetaApi } from "@/lib/api/pageMeta";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi("shop");
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
    title: "Shop Elite Tactical Gear | Athletic Force 1",
    description: "Explore the Athletic Force 1 Armory. High-performance tactical gear, compression wear, and custom uniforms for elite athletes.",
  };
}

export default function ShopPage() {
  return <ShopClient />;
}

