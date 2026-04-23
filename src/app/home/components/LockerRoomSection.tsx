import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

type LockerArticle = {
  id: string;
  date: string;
  title: string;
  excerpt: string;
  image?: string;
};

const LOCKER_ARTICLES: LockerArticle[] = [
  {
    id: '1',
    date: 'Jul 14, 2025',
    title: "Pickleball For All Ages: Why It's The Perfect Family Sport",
    excerpt:
      "Whether you're seeking cutting edge technology, superior craftsmanship, or the latest innovations, high end paddles...",
  },
  {
    id: '2',
    date: 'Jul 14, 2025',
    title: 'Inside The Pickleball Community Interviews With Local Players',
    excerpt:
      "Whether you're seeking cutting edge technology, superior craftsmanship, or the latest innovations, high end paddles...",
  },
  {
    id: '3',
    date: 'Jul 14, 2025',
    title: 'Local Pickleball Courts: Where To Play Near You',
    excerpt:
      "Whether you're seeking cutting edge technology, superior craftsmanship, or the latest innovations, high end paddles...",
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
  },
];

export const LockerRoomSection: React.FC = () => {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">The Locker Room</h2>

        <button className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#FF5A2A] hover:opacity-80 transition-opacity whitespace-nowrap">
          Read All Articles
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {LOCKER_ARTICLES.map((article) => (
          <article key={article.id} className="group">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#E8EAEE] border border-[#E2E5E9]">
              {article.image ? (
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : null}

              <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded-md bg-white/95 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-700">
                {article.date}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 leading-[1.2]">{article.title}</h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 font-medium">{article.excerpt}</p>

            <button className="mt-3 inline-flex items-center gap-1 text-xs font-black tracking-wide text-slate-800 hover:text-black transition-colors">
              Read Story
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
