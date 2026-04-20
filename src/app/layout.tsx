import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css"
import "react-toastify/dist/ReactToastify.css";
import { AppShell } from "../components/layout/AppShell";
import { ToastProvider } from "../components/ui/ToastProvider";
import { AppProviders } from "@/components/providers/AppProviders";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
export const metadata: Metadata = {
  title: "Athletic Force 1",
  description: "Elite Uniforms & Accessories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${inter.variable} antialiased`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
        <ToastProvider />
      </body>
    </html>
  );
}
