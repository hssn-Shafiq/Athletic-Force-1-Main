import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop | Athletic Force 1 - Elite Uniforms & Accessories",
  description: "Browse our premium collection of uniforms and accessories for all sports. High-quality, customizable, and affordable athletic wear.",
  keywords: ["uniforms", "athletic wear", "sports accessories", "team uniforms", "custom jerseys"],
  openGraph: {
    title: "Shop | Athletic Force 1",
    description: "Discover premium uniforms and accessories for every sport",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
