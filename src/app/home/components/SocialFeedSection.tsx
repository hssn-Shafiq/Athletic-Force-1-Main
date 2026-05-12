
"use client";

import React, { useCallback } from 'react';
import Image from 'next/image';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

type SocialCard = {
  id?: string;
  title: string;
  duration: string;
  image?: string;
};

const FALLBACK_CARDS: SocialCard[] = [
  {
    id: '1',
    title: 'Game Day Energy',
    duration: '1 Min',
    image:
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=700&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Cheer Squad Goals',
    duration: '35 Sec',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=700&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Championship Moments',
    duration: '1 Min',
  },
  {
    id: '4',
    title: 'Training Never Stops',
    duration: '54 Sec',
  },
  {
    id: '5',
    title: '7v7 Highlights',
    duration: '2.5 Min',
    image:
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=700&auto=format&fit=crop',
  },
];

interface SocialFeedProps {
  initialData?: {
    username: string;
    buttonText: string;
    cards: SocialCard[];
  };
}

export const SocialFeedSection: React.FC<SocialFeedProps> = ({ initialData }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start', 
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps'
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const cards = initialData?.cards || FALLBACK_CARDS;
  const username = initialData?.username || "@AthleticForce1";
  const buttonText = initialData?.buttonText || "View TikTok";

  return (
    <section className="w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-[#7C3AED]/20 shrink-0">
            <Image
              src="https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=200&auto=format&fit=crop"
              alt="Athletic Force social"
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
              Trending On Social
            </p>
            <p className="text-base sm:text-xl font-black tracking-tight text-slate-900">{username}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={scrollPrev}
                className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <button 
                onClick={scrollNext}
                className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
           </div>
           <button className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap">
             {buttonText}
             <ExternalLink className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {cards.map((card, idx) => (
            <article
              key={idx}
              className="relative flex-[0_0_150px] sm:flex-[0_0_180px] lg:flex-[0_0_220px] aspect-[9/16] rounded-[24px] overflow-hidden bg-[#EDEEF0] border border-[#E1E4E8] shadow-sm group"
            >
              {card.image ? (
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(min-width: 1024px) 220px, 180px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-200 via-slate-300/70 to-slate-400/70" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              <div className="absolute left-4 right-4 bottom-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">{card.duration}</p>
                <p className="mt-1.5 text-xs sm:text-sm font-black leading-tight uppercase italic">{card.title} ⚡</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
