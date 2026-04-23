
import React from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

interface CategoryCardProps {
  title: string;
  image: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, image }) => {
  return (
    <div className="relative p-0.75 bg-linear-to-tr from-accent via-red-500 to-orange-400 rounded-2xl sm:rounded-3xl lg:rounded-4xl group cursor-pointer hover:scale-[1.02] transition-transform duration-300">
      <div className="relative w-full aspect-4/5 rounded-[calc(var(--radius-2xl)-3px)] sm:rounded-[calc(var(--radius-3xl)-3px)] lg:rounded-[29px] overflow-hidden">
        {/* Background Image */}
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover brightness-90 group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Label Bar */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-full py-2 sm:py-2.5 px-3 sm:px-6 flex items-center gap-2 shadow-lg">
            <span className="flex-1 min-w-0 pr-1 font-bold text-[11px] sm:text-sm leading-tight tracking-tight text-slate-500 whitespace-normal break-words">
              {title}
            </span>
            <div className="shrink-0 bg-accent text-white rounded-full p-1">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TopCategories: React.FC = () => {
  const categories = [
    {
      title: "Custom Uniforms",
      image: "/after-hero-categories/Custom-Uniform.png"
    },
    {
      title: "Merchandise",
      image: "/after-hero-categories/Marchandise.png"
    },
    {
      title: "Accessories",
      image: "/after-hero-categories/Accessories.png"
    },
    {
      title: "Team Store",
      image: "/after-hero-categories/Team%20Store.png"
    }
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {categories.map((cat, idx) => (
          <CategoryCard key={idx} title={cat.title} image={cat.image} />
        ))}
      </div>
    </section>
  );
};
