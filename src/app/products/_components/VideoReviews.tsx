"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";

// ─── URL helpers ───────────────────────────────────────────────────────────────

/**
 * Converts any YouTube URL variant into an embeddable src:
 *   https://youtu.be/ID
 *   https://www.youtube.com/watch?v=ID
 *   https://www.youtube.com/shorts/ID
 *   https://youtube.com/embed/ID  (already embedded)
 * Returns null if it's not a YouTube URL.
 */
function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    }

    if (host === 'youtube.com') {
      // /shorts/ID
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?#]+)/);
      if (shortsMatch) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0`;
      }
      // /embed/ID
      const embedMatch = u.pathname.match(/\/embed\/([^/?#]+)/);
      if (embedMatch) {
        return `${url.split('?')[0]}?autoplay=1&rel=0`;
      }
      // /watch?v=ID
      const videoId = u.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type VideoReviewItem = {
  videoUrl: string;
  thumbnailUrl: string | null;
};

type VideoReviewsProps = {
  videoReviews: VideoReviewItem[];
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function VideoReviews({ videoReviews }: VideoReviewsProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  if (!videoReviews || videoReviews.length === 0) return null;

  return (
    <section className="rounded-2xl bg-[#efefef] p-5 sm:p-8">
      <h2 className="text-lg font-black text-slate-900">Video Feedback on This Product</h2>

      {/* Inline video cards */}
      <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {videoReviews.map((item, index) => {
          const isPlaying = playingIndex === index;
          const embedUrl = toYouTubeEmbedUrl(item.videoUrl);

          return (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl border-2 border-transparent bg-black aspect-[3/4] sm:aspect-auto sm:h-64"
            >
              {isPlaying && embedUrl ? (
                <>
                  <iframe
                    src={embedUrl}
                    title={`Video review ${index + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setPlayingIndex(null)}
                    className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                    aria-label="Close video"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlayingIndex(index)}
                  className="group absolute inset-0 flex h-full w-full items-center justify-center"
                  aria-label={`Play video review ${index + 1}`}
                >
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt={`Video review ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 transition duration-500 group-hover:bg-slate-300">
                      <Play className="h-10 w-10 text-slate-400" />
                    </div>
                  )}
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-black/55 border border-white/60 text-white transition group-hover:scale-110">
                      <Play className="h-5 w-5" />
                    </div>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
