"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const ShopBreadcrumb: React.FC = () => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link href="/" className="text-content hover:text-heading transition-colors">
        Home
      </Link>
      <ChevronRight className="w-4 h-4 text-content" />
      <span className="text-heading font-medium">Shop</span>
    </nav>
  );
};
