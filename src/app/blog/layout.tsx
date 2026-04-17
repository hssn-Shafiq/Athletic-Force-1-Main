import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Athletic Force 1",
  description:
    "Insights on uniforms, performance gear, team branding, and athlete-first product strategy from Athletic Force 1.",
};

export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
