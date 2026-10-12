import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css"
import "react-quill-new/dist/quill.snow.css";
// import "react-toastify/dist/ReactToastify.css";
import { AppShell } from "../components/layout/AppShell";
import { ToastProvider } from "../components/ui/ToastProvider";
import { AppProviders } from "@/components/providers/AppProviders";
import { PopupRenderer } from "@/components/layout/PopupRenderer";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@700;800;900&family=Bebas+Neue&family=Graduate&family=Montserrat:wght@800;900&family=Oswald:wght@600;700&family=Russo+One&family=Teko:wght@600;700&display=swap"
        />
      </head>
      <body className={`${sora.variable} ${inter.variable} antialiased`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
          <PopupRenderer />
        </AppProviders>
        <ToastProvider />
      </body>
    </html>
  );
}
