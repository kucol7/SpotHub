"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Star, Play } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import Navbar from "./Navbar";

type ReviewRatingRow = {
  rating: number | null;
};

type VideoRow = {
  id: string;
  series_name: string | null;
  title: string | null;
  season: number | null;
  episode: number | null;
  description: string | null;
  thumbnail_url: string | null;
  views_count: number | null;
  reviews: ReviewRatingRow[] | null;
};

function averageRating(reviews: ReviewRatingRow[] | null | undefined): number {
  if (!reviews || reviews.length === 0) {
    return 0;
  }
  const total = reviews.reduce(
    (sum, review) =>
      sum + (typeof review?.rating === "number" ? review.rating : 0),
    0,
  );
  return total / reviews.length;
}

function formatEpisodeLabel(
  season: number | null,
  episode: number | null,
): string | null {
  if (season === null || episode === null) {
    return null;
  }
  return `S${season}E${episode}`;
}

function formatCardTitle(video: VideoRow): string {
  const parts = [
    video.series_name,
    formatEpisodeLabel(video.season, video.episode),
    video.title,
  ].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );

  return parts.join(" - ") || "Bez tytułu";
}

export default function SpotHubHome() {
  const [hero, setHero] = useState<VideoRow | null>(null);
  const [popular, setPopular] = useState<VideoRow[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadHome() {
      const supabase = createClient();

      // 1. Wyróżniony film (is_latest = true).
      const { data: latest } = await supabase
        .from("videos")
        .select(
          "id, series_name, title, season, episode, description, thumbnail_url, views_count, reviews(rating)",
        )
        .eq("is_latest", true)
        .limit(1)
        .maybeSingle();

      let heroVideo = latest as VideoRow | null;

      // 2. Fallback: najnowszy rekord posortowany po created_at.
      if (!heroVideo) {
        const { data: recent } = await supabase
          .from("videos")
          .select(
            "id, series_name, title, season, episode, description, thumbnail_url, views_count, reviews(rating)",
          )
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        heroVideo = (recent as VideoRow) ?? null;
      }

      // 3. Cztery najpopularniejsze filmy.
      const { data: popularRows } = await supabase
        .from("videos")
        .select(
          "id, series_name, title, season, episode, description, thumbnail_url, views_count, reviews(rating)",
        )
        .order("views_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);

      if (mounted) {
        setHero(heroVideo);
        setPopular(
          Array.isArray(popularRows) ? (popularRows as VideoRow[]) : [],
        );
      }
    }

    loadHome().catch(() => {
      if (mounted) {
        setHero(null);
        setPopular([]);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const title = hero?.title ?? hero?.series_name ?? "";
  const description = hero?.description ?? "";
  const views = hero?.views_count ?? 0;
  const rating = averageRating(hero?.reviews);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">

      <Navbar />

      {/* Hero Section */}

      <main className="mx-auto max-w-7xl px-6 py-4 md:px-12">
        <section className="grid items-center gap-8 md:grid-cols-2">
          <div className="aspect-video overflow-hidden rounded-xl bg-neutral-900 shadow-2xl">
            {hero?.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.thumbnail_url}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-purple-900/20 to-neutral-800 flex items-center justify-center border border-neutral-800">
                <Play className="h-16 w-16 text-purple-500 opacity-50" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-purple-500">
              Najnowszy odcinek
            </span>
            <h2 className="text-4xl font-bold md:text-5xl">{title}</h2>
            <p className="max-w-md text-neutral-400">{description}</p>
            <div className="flex items-center gap-6 text-sm font-medium text-neutral-300">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" /> {views}
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" /> {rating.toFixed(1)}
              </div>
            </div>
            <Link
              href={hero ? `/watch/${hero.id}` : "#"}
              className="flex w-fit items-center gap-2 rounded-lg bg-purple-600 px-8 py-3 font-bold transition hover:bg-purple-700"
            >
              <Play className="h-5 w-5 fill-current" /> Oglądaj
            </Link>
          </div>
        </section>

        {/* Popular Section */}
        <section className="mt-8">
          <h3 className="mb-6 text-xl font-bold">Popularne filmy</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((video) => (
              <Link
                key={video.id}
                href={`/watch/${video.id}`}
                className="group cursor-pointer"
              >
                <div className="aspect-video overflow-hidden rounded-xl bg-neutral-900 transition-transform duration-300 group-hover:scale-105">
                  {video.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail_url}
                      alt={formatCardTitle(video)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-neutral-900 to-neutral-800 border border-neutral-800" />
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="font-bold transition group-hover:text-purple-400">
                    {formatCardTitle(video)}
                  </h4>
                  <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {video.views_count ?? 0}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {averageRating(video.reviews).toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}