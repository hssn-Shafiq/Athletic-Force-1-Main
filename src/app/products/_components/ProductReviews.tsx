import Image from "next/image";
import { Star } from "lucide-react";


type Review = {
  id: string;
  rating: number;
  fullName: string;
  reviewText: string;
  userAvatar?: { url: string; publicId: string };
  createdAt?: string;
};

type ProductReviewsProps = {
  reviews?: Review[];
};

function StarsRow({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-3.5 w-3.5 ${value <= rating ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-slate-200 text-slate-200"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const avatarUrl = review.userAvatar?.url;

  return (
    <article className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col xs:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Tactical Avatar Slot */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={review.fullName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xs sm:text-sm font-black text-slate-500 uppercase">
                {review.fullName.charAt(0)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{review.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">Verified Operator</p>
            </div>
          </div>
        </div>
        <div className="shrink-0 pt-1 xs:pt-0">
          <StarsRow rating={review.rating} />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[13px] sm:text-sm leading-relaxed text-slate-600 font-medium italic">
          "{review.reviewText}"
        </p>
      </div>
    </article>
  );
}

export function ProductReviews({ reviews }: ProductReviewsProps) {
  const hasRealReviews = reviews && reviews.length > 0;

  if (!hasRealReviews) {
    return null;
  }

  return (
    <section className="rounded-2xl sm:rounded-[32px] bg-slate-50/50 border border-slate-100 p-5 sm:p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            Operational Feedback
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 sm:mt-1">
            Verified Intelligence from the field ({reviews.length})
          </p>
        </div>
        
        {/* Optional: Add sort/filter controls here if needed in future */}
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
