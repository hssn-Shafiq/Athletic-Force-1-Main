
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface CategoryCardProps {
  title: string;
  image: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, image }) => {
  return (
    <div className="relative p-[3px] bg-gradient-to-tr from-accent via-red-500 to-orange-400 rounded-2xl sm:rounded-3xl lg:rounded-[32px] group cursor-pointer hover:scale-[1.02] transition-transform duration-300">
      <div className="relative w-full aspect-[4/5] rounded-[calc(theme(borderRadius.2xl)-3px)] sm:rounded-[calc(theme(borderRadius.3xl)-3px)] lg:rounded-[29px] overflow-hidden">
        {/* Background Image */}
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover brightness-90 group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Label Bar */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-full py-2 sm:py-2.5 px-4 sm:px-6 flex items-center justify-between shadow-lg">
            <span className="font-bold text-xs sm:text-sm tracking-tight">{title}</span>
            <div className="bg-accent text-white rounded-full p-1">
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
      image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Merchandise",
      image: "https://images.unsplash.com/photo-1521412644187-c49fa0b4e6a3?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Accessories",
      image: "https://images.unsplash.com/photo-1461896756670-f0c39f041762?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Team Store",
      image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=600&auto=format&fit=crop"
    }
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {categories.map((cat, idx) => (
          <CategoryCard key={idx} title={cat.title} image={cat.image} />
        ))}
      </div>
    </section>
  );
};
