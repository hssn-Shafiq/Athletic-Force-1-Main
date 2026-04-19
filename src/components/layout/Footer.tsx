import React from "react";
import Link from "next/link";
import { Facebook, Instagram, Youtube, Music2 } from "lucide-react";

const aboutLinks = ["About Us", "Careers", "News", "Feedback", "Contact"];
const usefulLinks = [
  "New Products",
  "Best Sellers",
  "Bundles & Set",
  "1 to One Gift Card",
  "Store Locations",
];
const customerLinks = ["Help Center", "My Account", "Track My Order", "Return Policy", "Become Reseller"];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#f3f3f3] mt-16 px-0 pb-0">
      <div className="w-full bg-black text-white rounded-t-[36px] rounded-b-none border border-white/10 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 py-10 border-b border-white/10">
          <div>
            <p className="font-black text-2xl tracking-tight italic">ATHLETIC FORCE 1</p>
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

        <div className="grid grid-cols-1 md:grid-cols-10 gap-10 px-8 py-12 border-b border-white/10">
          <div className="md:col-span-4">
            <h3 className="text-[34px] md:text-[42px] font-black uppercase tracking-tight leading-none">
              Join Our Newsletter
            </h3>
            <p className="text-sm text-white/65 mt-3 mb-5 max-w-md">
              Sign up to hear about exclusive new products, discounts, events and more!
            </p>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-11 flex-1 rounded-sm bg-white/5 border border-white/25 px-3 text-base placeholder:text-white/45 outline-none"
              />
              <button className="h-11 px-5 rounded-sm bg-white text-black text-xs font-bold uppercase tracking-wide">
                Subscribe
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-white/55 mb-3">About Company</p>
            <ul className="space-y-2.5">
              {aboutLinks.map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-white/85 hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-white/55 mb-3">Useful Links</p>
            <ul className="space-y-2.5">
              {usefulLinks.map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-white/85 hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-white/55 mb-3">Customer Services</p>
            <ul className="space-y-2.5">
              {customerLinks.map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-white/85 hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-8 py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-white/60">Copyright (c) 2025 Reseller. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-white/60">
            <Link href="#" className="hover:text-white/90">
              Privacy & Cookie Policy
            </Link>
            <Link href="#" className="hover:text-white/90">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
