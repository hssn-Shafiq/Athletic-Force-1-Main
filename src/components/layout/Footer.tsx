import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube, Music2 } from "lucide-react";

const aboutLinks = [
  { name: "About Us", href: "/about" },
  { name: "Careers", href: "#" },
  { name: "News", href: "/blog" },
  { name: "Feedback", href: "#" },
  { name: "Contact", href: "#" },
];
const usefulLinks = [
  { name: "New Products", href: "/shop" },
  { name: "Best Sellers", href: "/shop" },
  { name: "Bundles & Set", href: "/shop" },
  { name: "1 to One Gift Card", href: "#" },
  { name: "Store Locations", href: "#" },
];
const customerLinks = [
  { name: "Help Center", href: "#" },
  { name: "My Account", href: "/account" },
  { name: "Track My Order", href: "#" },
  { name: "Return Policy", href: "/terms-and-conditions" },
  { name: "Become Reseller", href: "#" },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--color-page-background)] mt-16 px-0 pb-0">
      <div className="w-full bg-black text-white rounded-t-[36px] rounded-b-none border border-white/10 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 px-5 md:px-8 py-8 md:py-10 border-b border-white/10">
          <div>
            <Image
              src="/footer-logo.png"
              alt="Athletic Force 1"
              width={280}
              height={92}
              className="h-9 md:h-11 w-auto"
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-white/60 mb-1">Call Us</p>
            <p className="text-base font-medium">Shop 123-456</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-white/60 mb-1">Email Us</p>
            <p className="text-base font-medium">Support@example.com</p>
          </div>

          <div className="md:justify-self-end">
            <p className="text-xs uppercase tracking-wider text-white/60 mb-1">Follow Us</p>
            <div className="flex items-center gap-2.5">
              <Facebook className="w-4 h-4 text-white/90" />
              <Instagram className="w-4 h-4 text-white/90" />
              <Music2 className="w-4 h-4 text-white/90" />
              <Youtube className="w-4 h-4 text-white/90" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-10 gap-8 md:gap-10 px-5 md:px-8 py-9 md:py-12 border-b border-white/10">
          <div className="md:col-span-4">
            <h3 className="text-[28px] md:text-[42px] font-black uppercase tracking-tight leading-none">
              Join Our Newsletter
            </h3>
            <p className="text-sm text-white/65 mt-3 mb-5 max-w-md">
              Sign up to hear about exclusive new products, discounts, events and more!
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-full md:max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-11 flex-1 min-w-0 rounded-sm bg-white/5 border border-white/25 px-3 text-base placeholder:text-white/45 outline-none"
              />
              <button className="h-11 px-5 rounded-sm bg-white text-black text-xs font-bold uppercase tracking-wide w-full sm:w-auto">
                Subscribe
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-white/55 mb-3">About Company</p>
            <ul className="space-y-2.5">
              {aboutLinks.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-white/85 hover:text-white">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-white/55 mb-3">Useful Links</p>
            <ul className="space-y-2.5">
              {usefulLinks.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-white/85 hover:text-white">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-white/55 mb-3">Customer Services</p>
            <ul className="space-y-2.5">
              {customerLinks.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-white/85 hover:text-white">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-5 md:px-8 py-6 md:py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-white/60">Copyright (c) 2025 Reseller. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
            <Link href="/privacy-policy" className="hover:text-white/90">
              Privacy & Cookie Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-white/90">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
