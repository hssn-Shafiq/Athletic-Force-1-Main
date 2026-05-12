import type { Metadata } from "next";
import { getPageMetaApi } from "@/lib/api/pageMeta";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await getPageMetaApi("home");
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
    title: "Athletic Force 1 | Elite Tactical Gear & Custom Uniforms",
    description: "Athletic Force 1 is your elite source for high-performance tactical gear, custom football uniforms, and premium athletic apparel.",
  };
}
import dynamic from "next/dynamic";
import { HeroSection } from "./home/components/HeroSection";
import { PromoBanner } from "./home/components/PromoBanner";
import { getPageContentApi } from "@/lib/api/pageContent";

const TopCategories = dynamic(
  () => import("../components/sections/features/TopCategories").then((m) => m.TopCategories),
  { ssr: true }
);

const ProductCollection = dynamic(
  () => import("./home/components/ProductCollection").then((m) => m.ProductCollection),
  { ssr: true }
);
const ExploreCategories = dynamic(
  () => import("./home/components/ExploreCategories").then((m) => m.ExploreCategories)
);
const CategoriesTabs = dynamic(
  () => import("./home/components/CategoriesTabs").then((m) => m.CategoriesTabs)
);
const VideoSection = dynamic(
  () => import("./home/components/VideoSections").then((m) => m.VideoSection)
);
const SocialFeedSection = dynamic(
  () => import("./home/components/SocialFeedSection").then((m) => m.SocialFeedSection)
);
const LockerRoomSection = dynamic(
  () => import("./home/components/LockerRoomSection").then((m) => m.LockerRoomSection),
  { 
    ssr: true,
    loading: () => <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse bg-slate-50/50 rounded-[40px] mb-20" />
  }
);

import { getExploreProductsApi } from "@/lib/api/publicProducts";

export default async function Home() {
  const [contentRes, productsRes] = await Promise.all([
    getPageContentApi("home"),
    getExploreProductsApi({ page: 1, pageSize: 40 })
  ]);

  const initialData = contentRes.ok ? contentRes.data : null;
  const initialProducts = productsRes.items || [];

  return (
    <main className="font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 lg:pt-4 pb-12 sm:pb-16 lg:pb-20">
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          <HeroSection initialSlides={initialData?.slides} />
          <TopCategories initialData={initialData?.topCategories} />
          <ProductCollection initialProducts={initialProducts} />
          <PromoBanner initialData={initialData?.promo} />
          <ExploreCategories />
          <CategoriesTabs />
          <VideoSection />
          <SocialFeedSection initialData={initialData?.socialFeed} />
          <LockerRoomSection />
        </div>
      </div>
    </main>
  );
}
