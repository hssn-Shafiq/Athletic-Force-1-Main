
import React from 'react';
import Image from 'next/image';
import { ArrowRight, Shirt, PenTool, Truck } from 'lucide-react';

const PROMO_STEPS = [
  {
    title: 'Choose Base',
    description: 'Select from our premium templates engineered for peak performance.',
    icon: Shirt,
    iconColor: 'text-[#60A5FA]',
  },
  {
    title: 'Customize',
    description: 'Add unlimited colors, logos, names, and numbers in real-time.',
    icon: PenTool,
    iconColor: 'text-[#FF7348]',
  },
  {
    title: 'Deploy',
    description: 'Receive game-ready gear in just 3 weeks. Worldwide shipping.',
    icon: Truck,
    iconColor: 'text-[#22C55E]',
  },
] as const;

export const PromoBanner: React.FC<{ initialData?: { text: string, link: string } }> = ({ initialData }) => {
  return (
    <section className="w-full space-y-5 sm:space-y-6 lg:space-y-7">
      <div className="relative p-0.5 rounded-[28px] sm:rounded-[40px] bg-linear-to-r from-orange-500 via-purple-600 to-green-500">
        <div className="bg-black rounded-[26px] sm:rounded-[38px] overflow-hidden relative min-h-[260px] sm:min-h-[340px] lg:min-h-[420px] flex items-center px-5 sm:px-8 md:px-12 lg:px-20 py-8 sm:py-10">
          {/* Background Decorative Gradient */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_50%,rgba(255,115,72,0.3),transparent_40%)]"></div>

          {/* Content */}
          <div className="relative z-10 max-w-xl w-full text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-1 mb-2">
              <span className="text-[64px] sm:text-[90px] lg:text-[120px] font-black leading-none text-[#FF7348] tracking-tighter">10%</span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-4 sm:mt-6 uppercase italic">Off</span>
            </div>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 sm:mb-8 tracking-tight leading-tight whitespace-pre-line">
              {initialData?.text || "On Custom Kit,\nMake It Yours"}
            </h3>
            <button className="bg-white text-black px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-5 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors mx-auto lg:mx-0">
              Customize Your Kit
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Image Side */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2">
            <div className="absolute inset-0 bg-linear-to-r from-black via-black/20 to-transparent z-10"></div>
            <Image
              src="https://af1.groomyorlife.com/wp-content/uploads/2026/01/image-3-e1767615776259.png"
              alt="Team Sports"
              fill
              sizes="50vw"
              className="object-cover grayscale-[0.2] brightness-75"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {PROMO_STEPS.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.title} className="min-h-[108px] rounded-[14px] border border-[#D1D5DB] bg-white px-3.5 sm:px-4 py-3 sm:py-3.5 flex items-center gap-3.5">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[16px] border border-[#E5E7EB] bg-white flex items-center justify-center shrink-0 ${step.iconColor}`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.9} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-black text-slate-900 leading-none tracking-tight">{step.title}</p>
                <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500 font-medium leading-[1.35]">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
