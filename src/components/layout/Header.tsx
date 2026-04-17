
import React from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full">
      {/* Announcement Bar */}
      <div className="bg-heading text-white text-[10px] md:text-xs py-2 px-4 flex justify-between items-center font-medium">
        <div className="flex-1">
          <span>Get <span className="text-accent">20% Off</span> on Every Customized Uniform</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center uppercase tracking-wider">
            USD <ChevronDown className="w-3 h-3 ml-1" />
          </button>
          <button className="flex items-center uppercase tracking-wider">
            ENG <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="hidden md:block bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-10">
          <nav className="flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium text-heading hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="/shop" className="text-sm font-medium text-heading hover:text-accent transition-colors">
              Shop
            </Link>
            <button className="text-sm font-medium text-heading hover:text-accent transition-colors flex items-center gap-1">
              Categories <ChevronDown className="w-3 h-3" />
            </button>
          </nav>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Link href="/" className="flex flex-col leading-none font-black text-2xl tracking-tighter italic text-heading hover:text-accent transition-colors">
            <span className="flex items-center">
              <span className="text-3xl">A</span>
              <span className="ml-0.5">THLETIC</span>
            </span>
            <span className="text-sm tracking-[0.3em] font-extrabold ml-1">FORCE 1</span>
          </Link>
        </div>

        {/* Search & Categories */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center gap-0 border border-slate-200 rounded-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <button className="bg-heading text-white px-6 py-3 flex items-center gap-2 font-semibold text-sm rounded-l-full hover:bg-accent transition-colors">
            <Menu className="w-4 h-4" />
            <span>Categories</span>
          </button>
          <div className="flex-1 flex items-center px-4 bg-white">
            <input 
              type="text" 
              placeholder="Search for gear..." 
              className="w-full py-2 outline-none text-sm text-heading placeholder:text-content"
            />
            <Search className="w-5 h-5 text-content cursor-pointer hover:text-accent transition-colors" />
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-6 md:space-x-8">
          <button className="relative flex flex-col items-center group">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-heading group-hover:text-accent transition-colors" />
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">1</span>
            </div>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tight text-content">Cart</span>
          </button>
          <button className="flex flex-col items-center group">
            <Heart className="w-6 h-6 text-heading group-hover:text-accent transition-colors" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tight text-content">Saved</span>
          </button>
          <button className="flex flex-col items-center group">
            <div className="bg-slate-100 rounded-full p-1 group-hover:bg-accent/10 transition-colors">
              <User className="w-5 h-5 text-heading group-hover:text-accent transition-colors" />
            </div>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tight text-content">Account</span>
          </button>
        </div>
      </div>

      {/* Mobile Search - Only visible on small screens */}
      <div className="md:hidden px-4 pb-4">
        <div className="flex items-center border border-slate-200 rounded-full px-4 py-2 bg-slate-50">
          <Search className="w-4 h-4 text-content mr-2" />
          <input type="text" placeholder="Search for gear..." className="bg-transparent text-sm w-full outline-none text-heading placeholder:text-content" />
        </div>
      </div>
    </header>
  );
};
