import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Film, Play } from "lucide-react";
import Navbar from "../../../components/Navbar";
import StarRating from "../../../components/StarRating";
import { createClient } from "../../../lib/supabase/server";
import { getSeriesBySlug } from "../../../lib/series";

// Strona pobiera dane z Supabase, więc nie może być prerenderowana.
export const instant = false;

type ReviewRatingRow = {
  rating: number | null;
};

type VideoRow = {
  id: string;
  season: number | null;
  episode: number | null;
  title: string | null;
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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const supabase = await createClient();

  // Wszystkie odcinki danego serialu wraz z ocenami (do wyliczenia średniej).
  const { data, error } = await supabase
    .from("videos")
    .select("id, season, episode, title, description, thumbnail_url, views_count, reviews(rating)")
    .ilike("series_name", series.seriesName)
    .order("season", { ascending: true })
    .order("episode", { ascending: true });

  const videos: VideoRow[] =
    !error && Array.isArray(data) ? (data as VideoRow[]) : [];

  // Dynamiczne grupowanie odcinków po numerze sezonu.
  const seasons = new Map<number | null, VideoRow[]>();
  for (const video of videos) {
    const key = video.season ?? null;
    const bucket = seasons.get(key);
    if (bucket) {
      bucket.push(video);
    } else {
      seasons.set(key, [video]);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12 md:px-12">
        <header className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            {series.title}
          </h1>
          <p className="max-w-2xl text-lg text-neutral-400">
            {series.description}
          </p>
        </header>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/50 px-6 py-20 text-center">
            <Film className="h-12 w-12 text-neutral-600" />
            <h2 className="mt-6 text-xl font-semibold text-white">
              Brak dostępnych odcinków
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-400">
              Odcinki dla tej kategorii pojawią się wkrótce. Zajrzyj tu ponownie
              później.
            </p>
          </div>
        ) : (
          [...seasons.entries()].map(([seasonNumber, seasonVideos]) => (
            <section
              key={seasonNumber ?? "poza-sezonem"}
              className="mb-12"
            >
              {seasonNumber !== null && (
                <h2 className="mb-8 border-l-4 border-purple-600 pl-4 text-2xl font-semibold text-white">
                  Sezon {seasonNumber}
                </h2>
              )}

              <div className="flex flex-col gap-6">
                {seasonVideos.map((video) => {
                  const rating = averageRating(video.reviews);
                  const views =
                    typeof video.views_count === "number" ? video.views_count : 0;
                  const label = formatEpisodeLabel(video.season, video.episode);
                  const title = video.title ?? "Bez tytułu";
                  const description = video.description ?? "";

                  return (
                    <Link
                      key={video.id}
                      href={`/watch/${video.id}`}
                      className="group flex flex-col gap-6 rounded-xl border border-transparent p-4 transition-all duration-300 hover:border-white/5 hover:bg-neutral-900/50 md:flex-row"
                    >
                      <div className="w-full shrink-0 md:w-80">
                        <div className="aspect-video overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
                          {video.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={video.thumbnail_url}
                              alt={title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/20 to-neutral-800">
                              <Play className="h-16 w-16 text-purple-500 opacity-50" />
                            </div>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-4 text-xs text-neutral-400">
                          <span className="flex items-center gap-1.5">
                            <StarRating value={rating} size="sm" />
                            <span className="font-medium">{rating.toFixed(1)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {views}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-start py-2">
                        <h3 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-purple-400">
                          {label ? `${label} - ${title}` : title}
                        </h3>
                        {description && (
                          <p className="line-clamp-3 max-w-xl text-base leading-relaxed text-neutral-400">
                            {description}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}