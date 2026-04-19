"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ShopFiltersProps {
  selectedCategory: string;
  priceRange: [number, number];
  sortBy: string;
  onFilterChange: (category: string, priceRange: [number, number], sort: string) => void;
}

const categories = [
  "All",
  "Football",
  "Basketball",
  "Soccer",
  "Baseball",
  "Volleyball",
  "Shorts",
  "Accessories",
];

export const ShopFilters: React.FC<ShopFiltersProps> = ({
  selectedCategory,
  priceRange,
  sortBy,
  onFilterChange,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    sort: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange(category, priceRange, sortBy);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseInt(e.target.value);
    const newRange: [number, number] = [priceRange[0], newPrice];
    onFilterChange(selectedCategory, newRange, sortBy);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(selectedCategory, priceRange, e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Sort Dropdown */}
      <div>
        <label className="block text-sm font-semibold text-heading mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-content bg-white focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection("category")}
          className="flex items-center justify-between w-full mb-3"
        >
          <h3 className="text-sm font-semibold text-heading">Category</h3>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections.category ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.category && (
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategory === category || selectedCategory === "All"}
                  onChange={() => handleCategoryChange(category)}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-content">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full mb-3"
        >
          <h3 className="text-sm font-semibold text-heading">Price Range</h3>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections.price ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.price && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-content mb-2 block">
                Max Price: ${priceRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={handlePriceChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
            <div className="flex space-x-2 text-xs">
              <span className="flex-1 px-2 py-1 border border-gray-200 rounded text-center">
                $0
              </span>
              <span className="flex-1 px-2 py-1 border border-gray-200 rounded text-center font-semibold">
                ${priceRange[1]}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={() => onFilterChange("All", [0, 500], "featured")}
        className="w-full px-4 py-2 border border-gray-300 text-heading font-medium rounded-lg hover:bg-gray-50 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
};
