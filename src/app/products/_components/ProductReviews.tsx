import Image from "next/image";
import { Star } from "lucide-react";

type ReviewPhoto = {
  url: string;
  publicId: string;
};

type Review = {
  id: string;
  rating: number;
  fullName: string;
  reviewText: string;
  photos: ReviewPhoto[];
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

function PhotoReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-xl bg-[#f4f1ee] p-3">
      <div className="grid grid-cols-3 gap-2">
        {review.photos.slice(0, 3).map((photo) => (
          <div key={photo.publicId} className="relative aspect-square overflow-hidden rounded-md bg-slate-200">
            <Image
              src={photo.url}
              alt="Review photo"
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[9px] font-black text-slate-600 uppercase shrink-0">
            {review.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-900">{review.fullName}</p>
            <p className="text-[9px] font-semibold text-slate-500">Verified Buyer</p>
          </div>
        </div>
        <StarsRow rating={review.rating} />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-snug text-slate-600 line-clamp-4">{review.reviewText}</p>
    </article>
  );
}

function TextReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-xl bg-[#f4f1ee] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[9px] font-black text-slate-600 uppercase shrink-0">
            {review.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-900">{review.fullName}</p>
            <p className="text-[9px] font-semibold text-slate-500">Verified Buyer</p>
          </div>
        </div>
        <StarsRow rating={review.rating} />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-snug text-slate-600 line-clamp-4">{review.reviewText}</p>
    </article>
  );
}

// Static fallback placeholder cards when no real reviews exist
function PlaceholderImageCard() {
  return (
    <article className="rounded-xl bg-[#f4f1ee] p-3">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="relative aspect-square overflow-hidden rounded-md bg-slate-200">
            <Image
              src="https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png"
              alt={`Review gallery ${item}`}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Image src="https://i.pravatar.cc/50?u=image-review" alt="Reviewer" width={20} height={20} className="rounded-full" unoptimized />
          <div>
            <p className="text-[10px] font-black text-slate-900">Verified Customer</p>
            <p className="text-[9px] font-semibold text-slate-500">Verified Buyer</p>
          </div>
        </div>
        <StarsRow rating={5} />
      </div>
      <p className="mt-2 text-[10px] font-semibold leading-snug text-slate-600">
        Great product! Highly recommended. The quality and fit exceeded my expectations.
      </p>
    </article>
  );
}

export function ProductReviews({ reviews }: ProductReviewsProps) {
  const hasRealReviews = reviews && reviews.length > 0;

  if (!hasRealReviews) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-[#efefef] p-5 sm:p-8">
      <h2 className="text-lg font-black text-slate-900">
        Product Reviews ({reviews.length})
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) =>
          review.photos.length > 0 ? (
            <PhotoReviewCard key={review.id} review={review} />
          ) : (
            <TextReviewCard key={review.id} review={review} />
          )
        )}
      </div>
    </section>
  );
}
