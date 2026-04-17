
import React from 'react';
import { Globe, Headphones, RotateCcw, ShieldCheck, Play } from 'lucide-react';

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-[#F5F5F5] rounded-[32px] p-8 flex flex-col items-center text-center space-y-3 hover:bg-white hover:shadow-xl transition-all duration-300 group cursor-default">
    <div className="text-slate-900 group-hover:scale-110 transition-transform duration-300">
      <Icon className="w-6 h-6" strokeWidth={1.5} />
    </div>
    <div className="space-y-1">
      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">{title}</h4>
      <p className="text-[10px] text-slate-500 font-medium">{description}</p>
    </div>
  </div>
);

export const VideoSection: React.FC = () => {
  return (
    <section className="w-full space-y-12 py-12">
      {/* Video Banner */}
      <div className="relative w-full aspect-[21/9] rounded-[60px] overflow-hidden shadow-2xl group cursor-pointer">
        <img 
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop" 
          alt="Athletic Performance" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-500" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:bg-white/40 transition-all duration-500">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black fill-black ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureItem 
          icon={Globe}
          title="Worldwide Shipping"
          description="Free delivery on all orders"
        />
        <FeatureItem 
          icon={Headphones}
          title="24/7 Support"
          description="Always ready to assist you"
        />
        <FeatureItem 
          icon={RotateCcw}
          title="Free 30 Days Return"
          description="Hassle-free return policy"
        />
        <FeatureItem 
          icon={ShieldCheck}
          title="Safe Checkout"
          description="Bank-grade security"
        />
      </div>
    </section>
  );
};
