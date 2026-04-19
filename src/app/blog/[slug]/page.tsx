import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock3, UserRound } from "lucide-react";
import { blogPosts } from "../blog-data";

type BlogDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return {
      title: "Article Not Found | Athletic Force 1",
    };
  }

  return {
    title: `${post.title} | Athletic Force 1`,
    description: post.excerpt,
  };
}

export default async function BlogSinglePage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  return (
    <main className="bg-[#f3f3f3] min-h-screen">
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-heading/70 hover:text-heading mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <div className="rounded-[28px] overflow-hidden border border-black/10 mb-8">
          <img src={post.heroImage} alt={post.title} className="w-full h-[280px] md:h-[520px] object-cover" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">
          <div className="xl:col-span-8">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-accent">{post.category}</p>
            <h1 className="mt-3 text-4xl md:text-6xl font-black leading-[0.95] tracking-tight text-heading">
              {post.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-black/70">
              <span className="inline-flex items-center gap-1.5"><UserRound className="w-4 h-4" /> {post.author}</span>
              <span>{post.publishedAt}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="w-4 h-4" /> {post.readTime}</span>
            </div>

            <div className="mt-8 space-y-8">
              {post.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-2xl md:text-3xl font-black text-heading tracking-tight mb-3">{section.heading}</h2>
                  <div className="space-y-4">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.heading}-${index}`} className="text-base md:text-lg text-black/75 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-black/10 flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white border border-black/15 px-4 py-1.5 text-xs font-semibold text-heading">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <aside className="xl:col-span-4 space-y-6">
            <div className="rounded-[22px] bg-white border border-black/10 p-6">
              <p className="text-xs uppercase tracking-wider text-black/60">Written By</p>
              <h3 className="mt-1 text-2xl font-black text-heading">{post.author}</h3>
              <p className="text-sm text-black/60">{post.authorRole}</p>
              <p className="mt-4 text-sm text-black/70 leading-relaxed">
                Athletic Force 1 contributor focused on helping teams build elite identity through smart uniform and gear decisions.
              </p>
            </div>

            <div className="rounded-[22px] bg-white border border-black/10 p-6">
              <h3 className="text-2xl font-black text-heading tracking-tight mb-4">Related Posts</h3>
              <div className="space-y-4">
                {relatedPosts.map((item) => (
                  <Link key={item.slug} href={`/blog/${item.slug}`} className="group block rounded-xl border border-black/10 p-4 hover:bg-zinc-50 transition-colors">
                    <p className="text-[11px] uppercase tracking-wider text-accent font-semibold">{item.category}</p>
                    <p className="mt-1 text-sm font-bold text-heading leading-tight group-hover:text-accent transition-colors">
                      {item.title}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-black/60">
                      Read Article
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
