import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

type SocialCard = {
  id: string;
  title: string;
  duration: string;
  image?: string;
};

const SOCIAL_CARDS: SocialCard[] = [
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

export const SocialFeedSection: React.FC = () => {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between gap-4">
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
            <p className="text-base sm:text-xl font-black tracking-tight text-slate-900">@AthleticForce1</p>
          </div>
        </div>

        <button className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap">
          View TikTok
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 sm:mt-6 overflow-x-auto">
        <div className="flex gap-3 sm:gap-4 min-w-max lg:min-w-0 lg:grid lg:grid-cols-5">
          {SOCIAL_CARDS.map((card) => (
            <article
              key={card.id}
              className="relative w-[148px] sm:w-[170px] lg:w-auto aspect-[9/16] rounded-[16px] sm:rounded-[18px] overflow-hidden bg-[#EDEEF0] border border-[#E1E4E8] shadow-[0_8px_30px_-20px_rgba(0,0,0,0.45)]"
            >
              {card.image ? (
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(min-width: 1024px) 18vw, 170px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-200 via-slate-300/70 to-slate-400/70" />
              )}

              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute left-2.5 right-2.5 bottom-2.5 text-white">
                <p className="text-[9px] font-bold uppercase tracking-wide text-white/80">{card.duration}</p>
                <p className="mt-1 text-[11px] sm:text-xs font-extrabold leading-tight">{card.title} ⚡</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
