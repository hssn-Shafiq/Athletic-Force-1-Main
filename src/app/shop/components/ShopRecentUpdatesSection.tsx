import { ArrowRight } from "lucide-react";

type NewsItem = {
  id: number;
  image: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
};

const newsItems: NewsItem[] = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=1200&auto=format&fit=crop",
    title: "PICKLEBALL FOR ALL AGES: WHY IT'S THE PERFECT FAMILY SPORT",
    excerpt:
      "Whether you're seeking cutting edge technology, superior craftsmanship, or the latest innovations, high end paddle",
    category: "Beginner's Corner",
    date: "Jul 14, 2025",
    author: "Admin",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1543357480-c60d400e2ef9?q=80&w=1200&auto=format&fit=crop",
    title: "INSIDE THE PICKLEBALL COMMUNITY INTERVIEWS WITH LOCAL PLAYERS",
    excerpt:
      "Whether you're seeking cutting edge technology, superior craftsmanship, or the latest innovations, high end paddle",
    category: "Beginner's Corner",
    date: "Jul 14, 2025",
    author: "Admin",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=1200&auto=format&fit=crop",
    title: "LOCAL PICKLEBALL COURTS: WHERE TO PLAY NEAR YOU",
    excerpt:
      "Whether you're seeking cutting edge technology, superior craftsmanship, or the latest innovations, high end paddle",
    category: "Player Stories",
    date: "Jul 14, 2025",
    author: "Admin",
  },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1567016549631-9f5b2cbb11f5?q=80&w=600&auto=format&fit=crop",
];

export function ShopRecentUpdatesSection() {
  return (
    <section className="mt-16 md:mt-20">
      <div className="flex items-center justify-between mb-7">
        <h2 className="text-[28px] md:text-[40px] font-extrabold tracking-tight text-heading leading-none">
          Latest news & updates
        </h2>
        <button className="text-accent text-[14px] md:text-[16px] font-medium flex items-center gap-2">
          View More
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
        {newsItems.map((item) => (
          <article key={item.id} className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-gray-200">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-[270px] md:h-[280px] object-cover"
                loading="lazy"
              />
            </div>

            <h3 className="text-[18px] md:text-[26px] font-black text-black leading-[1.1] uppercase tracking-tight">
              {item.title}
            </h3>

            <p className="text-[12px] md:text-[14px] text-black/70 leading-[1.4]">
              {item.excerpt}
            </p>

            <div className="flex items-center gap-5 text-[12px] md:text-[14px] pt-2">
              <span className="text-[#2196F3] font-semibold">{item.category}</span>
              <span className="text-black/55">{item.date}</span>
              <span className="text-black font-semibold">By {item.author}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14 md:mt-16 grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
        {galleryImages.map((image, index) => (
          <div key={`${image}-${index}`} className="rounded-2xl overflow-hidden bg-gray-200">
            <img
              src={image}
              alt={`Recent update ${index + 1}`}
              className="w-full h-[180px] md:h-[190px] object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
