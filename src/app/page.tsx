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

export default function Home() {
  return (
    <main className="font-sans">
      {/* Hero takes full width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <HeroSection />
      </div>

      {/* Categories with spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <TopCategories />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <ProductCollection />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        <PromoBanner />

      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        <ExploreCategories />

      </div>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        <CategoriesTabs />

      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        <VideoSection />

      </div>
    </main>
  );
}
