
import React from 'react';
import { ArrowRight } from 'lucide-react';

export const PromoBanner: React.FC = () => {
  return (
    <div className="relative p-[2px] rounded-[40px] bg-gradient-to-r from-orange-500 via-purple-600 to-green-500">
      <div className="bg-black rounded-[38px] overflow-hidden relative min-h-[400px] flex items-center px-12 md:px-20">
        {/* Background Decorative Gradient */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_50%,rgba(255,115,72,0.3),transparent_40%)]"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-xl">
          <div className="flex items-start gap-1 mb-2">
            <span className="text-[120px] font-black leading-none text-[#FF7348] tracking-tighter">10%</span>
            <span className="text-4xl font-black text-white mt-6 uppercase italic">Off</span>
          </div>
          <h3 className="text-5xl font-black text-white mb-8 tracking-tight leading-tight">
            On Custom Kit,<br />Make It Yours
          </h3>
          <button className="bg-white text-black px-10 py-5 rounded-full font-black text-sm uppercase tracking-wider flex items-center gap-3 hover:bg-slate-100 transition-colors">
            Customize Your Kit
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Image Side */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent z-10"></div>
          <img 
            src="https://af1.groomyorlife.com/wp-content/uploads/2026/01/image-3-e1767615776259.png" 
            alt="Team Sports"
            className="w-full h-full object-cover grayscale-[0.2] brightness-75"
          />
        </div>
      </div>
    </div>
  );
};
