
import React from 'react';
import { ArrowRight, MoveRight } from 'lucide-react';

interface CategoryItemProps {
  title: string;
  image: string;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ title, image }) => {
  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-slate-100">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>
      <h3 className="font-black text-center text-sm md:text-base tracking-tight uppercase mb-1">
        {title}
      </h3>
      <button className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] md:text-xs uppercase tracking-wider group-hover:gap-2.5 transition-all">
        Customize now
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export const ExploreCategories: React.FC = () => {
  const categories = [
    {
      title: "Coach Uniforms",
      image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Frame-26.png"
    },
    {
      title: "Baseball Uniforms",
      image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Frame-32.png"
    },
    {
      title: "Wrestling Uniforms",
      image: "https://picsum.photos/seed/wrestling/400/500"
    },
    {
      title: "Cheer Uniforms",
      image: "https://picsum.photos/seed/cheer/400/500"
    },
    {
      title: "VolleyBall Uniforms",
      image: "https://picsum.photos/seed/volleyball/400/500"
    },
    {
      title: "Football Uniforms",
      image: "https://picsum.photos/seed/football/400/500"
    },
    {
      title: "Basketball Uniforms",
      image: "https://picsum.photos/seed/basketball/400/500"
    },
    {
      title: "7v7 Uniforms",
      image: "https://picsum.photos/seed/7v7/400/500"
    },
    {
      title: "Soccer Uniforms",
      image: "https://picsum.photos/seed/soccer/400/500"
    },
    {
      title: "Track & Field",
      image: "https://picsum.photos/seed/track/400/500"
    }
  ];

  return (
    <section className="w-full py-16">
      <div className="flex items-end justify-between mb-12">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
          Explore Categories
        </h2>
        <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-900 hover:opacity-70 transition-opacity pb-1 border-b border-transparent hover:border-slate-900">
          View All Sports
          <MoveRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-16">
        {categories.map((cat, idx) => (
          <CategoryItem key={idx} title={cat.title} image={cat.image} />
        ))}
      </div>

      <div className="mt-20 flex justify-center">
        <button className="group px-12 py-4 bg-[#F2F2F2] border border-slate-300 rounded-full flex items-center gap-3 font-bold uppercase tracking-widest text-xs text-slate-900 hover:bg-slate-200 transition-all shadow-sm">
          Customize Your Kit
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
