import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { blogPosts } from "./blog-data";

export default function BlogPage() {
  const [featuredPost, ...otherPosts] = blogPosts;

  return (
    <main className="bg-[#f3f3f3] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-gradient-to-br from-white via-white to-zinc-100 p-8 md:p-12 mb-12">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-accent/20 blur-2xl" />
          <div className="absolute -left-12 -bottom-16 h-44 w-44 rounded-full bg-black/10 blur-2xl" />

          <p className="relative inline-flex items-center rounded-full border border-black/15 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-heading">
            Athletic Force 1 Journal
          </p>
          <h1 className="relative mt-4 text-4xl md:text-6xl font-black leading-[0.95] tracking-tight text-heading max-w-4xl">
            Ideas, Strategy, And Stories For Teams That Compete To Win
          </h1>
          <p className="relative mt-5 max-w-2xl text-sm md:text-lg text-black/70 leading-relaxed">
            Practical playbooks on team identity, premium uniforms, and athlete-focused equipment decisions.
          </p>
        </section>

        <section className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-2xl md:text-4xl font-black text-heading tracking-tight">Featured Story</h2>
            <Link href={`/blog/${featuredPost.slug}`} className="text-accent text-sm md:text-base font-semibold inline-flex items-center gap-2">
              Read Article
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <article className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-[28px] bg-white border border-black/10 overflow-hidden">
            <div className="h-[260px] md:h-[380px]">
              <img src={featuredPost.heroImage} alt={featuredPost.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-accent">{featuredPost.category}</p>
                <h3 className="mt-2 text-2xl md:text-4xl font-black text-heading leading-tight tracking-tight">
                  {featuredPost.title}
                </h3>
                <p className="mt-4 text-sm md:text-base text-black/70 leading-relaxed">{featuredPost.excerpt}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
                <div>
                  <p className="text-sm font-semibold text-heading">{featuredPost.author}</p>
                  <p className="text-xs text-black/60">{featuredPost.publishedAt}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-black/65">
                  <Clock3 className="w-4 h-4" />
                  {featuredPost.readTime}
                </div>
              </div>
            </div>
          </article>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-2xl md:text-4xl font-black text-heading tracking-tight">Latest Articles</h2>
            <div className="hidden md:flex items-center gap-2">
              {["All", "Team Strategy", "Performance", "Operations", "Planning"].map((tag) => (
                <button key={tag} className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-semibold text-heading bg-white hover:bg-black hover:text-white transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <article key={post.slug} className="rounded-[24px] overflow-hidden bg-white border border-black/10 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-[230px] overflow-hidden">
                  <img src={post.cardImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">{post.category}</p>
                  <h3 className="mt-2 text-xl md:text-2xl font-black text-heading leading-tight tracking-tight min-h-[5.5rem]">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm text-black/70 leading-relaxed min-h-[3.5rem]">{post.excerpt}</p>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs text-black/60">{post.publishedAt}</span>
                    <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading group-hover:text-accent transition-colors">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
