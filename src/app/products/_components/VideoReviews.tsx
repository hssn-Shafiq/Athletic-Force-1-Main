"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

type VideoItem = {
  id: string;
  title: string;
  thumbnail: string;
};

const videoItems: VideoItem[] = [
  {
    id: "v1",
    title: "Coach review",
    thumbnail:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "v2",
    title: "Player review",
    thumbnail:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "v3",
    title: "Youth review",
    thumbnail:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "v4",
    title: "Team review",
    thumbnail:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?q=80&w=600&auto=format&fit=crop",
  },
];

export function VideoReviews() {
  const [activeVideo, setActiveVideo] = useState(videoItems[0]);

  return (
    <section className="rounded-2xl bg-[#efefef] p-5 sm:p-8">
      <h2 className="text-lg font-black text-slate-900">Video Feedback on This Products</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {videoItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveVideo(item)}
            className={`group relative overflow-hidden rounded-2xl border-2 transition ${
              activeVideo.id === item.id ? "border-[#9f7bea]" : "border-transparent"
            }`}
            aria-label={`Play ${item.title}`}
          >
            <div className="relative aspect-4/5">
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 48vw, 180px"
                className="object-cover transition duration-500 group-hover:scale-105"
                unoptimized
              />
            </div>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/75 p-1.5 text-white">
              <Play className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-2xl font-black tracking-tight text-slate-900">Description of Product</h3>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700">
          Choosing the right helmet matters for safety, comfort, and confidence. If youre comparing soft shell vs hard shell
          football helmet options for your program, this guide explains the real-world differences, when to use each type,
          and how to pick the best setup for practices, games, and 7v7.
        </p>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700">
          Choosing the right helmet matters for safety, comfort, and confidence. If youre comparing soft shell vs hard shell
          football helmet options for your program, this guide explains the real-world differences, when to use each type,
          and how to pick the best setup for practices, games, and 7v7.
        </p>
      </div>

      <div className="mt-6 rounded-3xl bg-black p-6 sm:p-8">
        <div className="relative mx-auto aspect-video max-w-3xl overflow-hidden rounded-2xl bg-black">
          <Image
            src={activeVideo.thumbnail}
            alt={`${activeVideo.title} preview`}
            fill
            sizes="(max-width: 1024px) 100vw, 960px"
            className="object-cover opacity-45"
            unoptimized
          />
          <div className="absolute inset-0 grid place-items-center">
            <button
              type="button"
              className="grid h-16 w-16 place-items-center rounded-full border border-white/60 bg-black/55 text-white transition hover:scale-105"
              aria-label="Play video"
            >
              <Play className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
