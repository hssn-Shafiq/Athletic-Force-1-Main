import Image from "next/image";
import { Star } from "lucide-react";

type ReviewCard = {
  id: string;
  name: string;
  role: string;
  text: string;
  avatar: string;
};

const reviewCards: ReviewCard[] = [
  {
    id: "r1",
    name: "Lorem Ipsum",
    role: "CEO President",
    text:
      "Team, thanks for creating a consistent tracker for our organization with such a seamless flow. The platform has greatly improved our operations and employee satisfaction.",
    avatar: "https://i.pravatar.cc/80?u=review-1",
  },
  {
    id: "r2",
    name: "Lorem Ipsum",
    role: "CEO President",
    text:
      "Your teams professionalism and technical expertise were remarkable. Looking forward to work on more projects with you in future.",
    avatar: "https://i.pravatar.cc/80?u=review-2",
  },
  {
    id: "r3",
    name: "Lorem Ipsum",
    role: "CEO President",
    text:
      "Choosing this product gave us better confidence and comfort in game situations. The fit and material quality are top-level.",
    avatar: "https://i.pravatar.cc/80?u=review-3",
  },
  {
    id: "r4",
    name: "Lorem Ipsum",
    role: "CEO President",
    text:
      "Great quality for customization and bulk orders. We got exactly what we needed for our team collection and fan merchandise.",
    avatar: "https://i.pravatar.cc/80?u=review-4",
  },
  {
    id: "r5",
    name: "Lorem Ipsum",
    role: "CEO President",
    text:
      "From support to delivery everything felt premium. We would highly recommend this for teams that care about quality and turnaround.",
    avatar: "https://i.pravatar.cc/80?u=review-5",
  },
  {
    id: "r6",
    name: "Lorem Ipsum",
    role: "CEO President",
    text:
      "The comfort level, stitching and print durability really stood out. Even after multiple washes the product still looks fresh.",
    avatar: "https://i.pravatar.cc/80?u=review-6",
  },
];

function StarsRow() {
  return (
    <div className="flex items-center gap-1 text-[#f59e0b]">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star key={value} className="h-3.5 w-3.5 fill-current" />
      ))}
    </div>
  );
}

function ImageReviewCard() {
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
          <Image
            src="https://i.pravatar.cc/50?u=image-review"
            alt="Reviewer"
            width={20}
            height={20}
            className="rounded-full"
            unoptimized
          />
          <div>
            <p className="text-[10px] font-black text-slate-900">Lorem Ipsum</p>
            <p className="text-[9px] font-semibold text-slate-500">CEO President</p>
          </div>
        </div>
        <StarsRow />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-snug text-slate-600">
        Team, thanks for creating a consistent tracker for our organization with such a seamless flow. Looking forward to work on more projects with you in future.
      </p>
    </article>
  );
}

function TextReviewCard({ review }: { review: ReviewCard }) {
  return (
    <article className="rounded-xl bg-[#f4f1ee] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Image src={review.avatar} alt={review.name} width={20} height={20} className="rounded-full" unoptimized />
          <div>
            <p className="text-[10px] font-black text-slate-900">{review.name}</p>
            <p className="text-[9px] font-semibold text-slate-500">{review.role}</p>
          </div>
        </div>
        <StarsRow />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-snug text-slate-600">{review.text}</p>
    </article>
  );
}

export function ProductReviews() {
  return (
    <section className="rounded-2xl bg-[#efefef] p-5 sm:p-8">
      <h2 className="text-lg font-black text-slate-900">Product Reviews</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ImageReviewCard />
        <TextReviewCard review={reviewCards[0]} />
        <TextReviewCard review={reviewCards[1]} />
        <ImageReviewCard />
        <TextReviewCard review={reviewCards[2]} />
        <TextReviewCard review={reviewCards[3]} />
        <ImageReviewCard />
        <TextReviewCard review={reviewCards[4]} />
        <TextReviewCard review={reviewCards[5]} />
      </div>
    </section>
  );
}
