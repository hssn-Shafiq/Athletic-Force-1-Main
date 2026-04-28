import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock3, UserRound } from "lucide-react";
import { getPublicBlogPostBySlugApi, getPublicBlogPostsApi } from "@/lib/api/blog";

type BlogDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await getPublicBlogPostBySlugApi(slug);
    if (!res.ok || !res.post) {
      return { title: "Article Not Found | Athletic Force 1" };
    }
    const post = res.post;
    return {
      title: post.seo?.title || `${post.title} | AF1 Journal`,
      description: post.seo?.description || post.excerpt,
      openGraph: {
        title: post.seo?.title || post.title,
        description: post.seo?.description || post.excerpt,
        images: [{ url: post.thumbnail }]
      }
    };
  } catch (err) {
    return { title: "Athletic Force 1 Journal" };
  }
}

export default async function BlogSinglePage({ params }: BlogDetailProps) {
  const { slug } = await params;

  let post;
  let relatedPosts = [];

  try {
    const [postRes, relatedRes] = await Promise.all([
      getPublicBlogPostBySlugApi(slug),
      getPublicBlogPostsApi({ limit: 4 })
    ]);

    if (!postRes.ok || !postRes.post) {
      notFound();
    }
    post = postRes.post;
    relatedPosts = relatedRes.posts.filter((p: any) => p.slug !== slug).slice(0, 3);
  } catch (err) {
    notFound();
  }

  return (
    <main className="bg-[#f3f3f3] min-h-screen pb-20">
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic text-slate-400 hover:text-black mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Journal
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-16">
          <div className="xl:col-span-8">

            {/* Main Thumbnail */}
            <div className="rounded-[32px] overflow-hidden border border-black/5 mb-10 shadow-xl">
              <img src={post.thumbnail} alt={post.title} className="w-full h-auto object-cover" />
            </div>

            {/* Title And Meta Info */}
            <div className="mb-5">
              <p className="text-orange-600 text-xs md:text-sm font-black uppercase tracking-[0.3em] mb-4 italic font-sora">
                {post.category?.name || "Tactical Sector"}
              </p>
              <h1 className="text-4xl md:text-5xl font-black leading-[0.95] tracking-tight text-slate-900 italic uppercase font-sora">
                {post.title}
              </h1>
            </div>


            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 mb-10 pb-8 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black italic">
                  {post.author.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black uppercase italic tracking-tight text-slate-900">{post.author.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.author.title}</p>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                <span className="flex items-center gap-1.5"><Clock3 className="w-4 h-4" /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Rich Text Content */}
            <div
              className="blog-content-vault max-w-none font-inter"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tactical FAQs Section */}
            {post.faqs?.length > 0 && (
              <div className="mt-20 pt-12 border-t border-slate-200">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-10 font-sora">FAQs</h2>
                <div className="space-y-10">
                  {post.faqs.map((faq: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <h3 className="text-lg font-black text-slate-900 leading-tight font-sora">{faq.question}</h3>
                      <p className="text-base text-slate-600 font-medium leading-relaxed font-inter">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Area */}
            {post.tags?.length > 0 && (
              <div className="mt-16 pt-8 border-t border-slate-200 flex flex-wrap items-center gap-2">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <aside className="xl:col-span-4 space-y-8">
            {/* Related Intelligence */}
            <div className="rounded-[40px] bg-white border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xs font-black italic uppercase tracking-widest text-slate-900 mb-8">Related Intelligence</h3>
              <div className="space-y-6">
                {relatedPosts.map((item: any) => (
                  <Link key={item.slug} href={`/blog/${item.slug}`} className="group block space-y-3">
                    <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 border border-slate-50 shadow-sm">
                      <img src={item.thumbnail} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-orange-600 font-black italic">{item.category?.name}</p>
                      <p className="mt-1 text-sm font-black italic uppercase text-slate-900 group-hover:text-orange-600 transition-colors leading-tight">
                        {item.title}
                      </p>
                    </div>
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

