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
import { TopCategories } from "../components/sections/features/TopCategories";
import { ProductCollection } from "./home/components/ProductCollection";
import { PromoBanner } from "./home/components/PromoBanner";
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
  () => import("./home/components/LockerRoomSection").then((m) => m.LockerRoomSection)
);

export default function Home() {
  return (
    <main className="font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 lg:pt-4 pb-12 sm:pb-16 lg:pb-20">
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          <HeroSection />
          <TopCategories />
          <ProductCollection />
          <PromoBanner />
          <ExploreCategories />
          <CategoriesTabs />
          <VideoSection />
          <SocialFeedSection />
          <LockerRoomSection />
        </div>
      </div>
    </main>
  );
}
