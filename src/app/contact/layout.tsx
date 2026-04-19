import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Can We Help you? | Athletic Force 1",
  description:
    "Connect with Athletic Force 1 for team uniform consultations, bulk order support, and custom gear guidance.",
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
