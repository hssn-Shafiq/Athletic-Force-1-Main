import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css"
import "react-toastify/dist/ReactToastify.css";
import { Header } from "../components/layout/Header";
import { ToastProvider } from "../components/ui/ToastProvider";
import { Footer } from "../components/layout/Footer";

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
      <body className={`${sora.variable} ${inter.variable} antialiased overflow-x-hidden`}>
        <Header />
        {children}
        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}
