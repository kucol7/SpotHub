import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Play } from "lucide-react";
import Navbar from "../../../components/Navbar";
import ReviewsSection from "../../../components/ReviewsSection";
import StarRating from "../../../components/StarRating";
import WatchActions from "../../../components/WatchActions";
import WatchlistButton from "../../../components/WatchlistButton";
import { createClient } from "../../../lib/supabase/server";
import {
  coerceReviewRow,
  coerceVideoRow,
  getMockVideo,
  type WatchReview,
  type WatchVideo,
} from "../../../lib/watch";
import { ReviewsProvider } from "../../../components/reviews-context";

// Strona czyta ciasteczka sesji (auth), więc nie może być prerenderowana.
export const instant = false;

type WatchPageProps = {
  params: Promise<{ id: string }>;
};

type ReviewRatingRow = {
  rating: number | null;
};

type CardVideoRow = {
  id: string;
  season: number | null;
  episode: number | null;
  title: string | null;
  series_name: string | null;
  thumbnail_url: string | null;
  views_count: number | null;
  created_at: string | null;
  reviews: ReviewRatingRow[] | null;
};

type WatchlistRow = {
  videos: CardVideoRow | CardVideoRow[] | null;
};

type CardVideo = {
  id: string;
  season: number | null;
  episode: number | null;
  title: string;
  seriesName: string | null;
  thumbnailUrl: string | null;
  viewsCount: number;
  rating: number;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function averageReviewRating(
  reviews: ReviewRatingRow[] | null | undefined,
): number {
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

function coerceCardVideo(row: unknown, fallbackId: string): CardVideo | null {
  if (!row || typeof row !== "object") {
    return null;
  }
  const record = row as Record<string, unknown>;

  const id =
    typeof record.id === "string" && record.id ? record.id : fallbackId;
  const season = toNumber(record.season);
  const episode = toNumber(record.episode);
  const title =
    typeof record.title === "string" && record.title
      ? record.title
      : "Bez tytułu";
  const seriesName =
    typeof record.series_name === "string" && record.series_name
      ? record.series_name
      : null;
  const thumbnailUrl =
    typeof record.thumbnail_url === "string" && record.thumbnail_url
      ? record.thumbnail_url
      : null;
  const viewsCount =
    typeof record.views_count === "number" && Number.isFinite(record.views_count)
      ? record.views_count
      : 0;
  const rating = averageReviewRating(
    record.reviews as ReviewRatingRow[] | null | undefined,
  );

  return {
    id,
    season,
    episode,
    title,
    seriesName,
    thumbnailUrl,
    viewsCount,
    rating,
  };
}

function formatCardTitle(video: CardVideo, includeSeries: boolean): string {
  if (video.season !== null && video.episode !== null) {
    const label = `S${video.season}E${video.episode}`;
    if (includeSeries && video.seriesName) {
      return `${video.seriesName}: ${label} - ${video.title}`;
    }
    return `${label} - ${video.title}`;
  }
  return video.title;
}

function renderCard(video: CardVideo, includeSeries: boolean) {
  const title = formatCardTitle(video, includeSeries);

  return (
    <>
      <Link href={`/watch/${video.id}`} className="group block">
        <div className="mt-3 aspect-video overflow-hidden rounded-lg bg-neutral-900">
          {video.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center border border-neutral-800 transition-colors group-hover:border-neutral-700">
              <Play className="h-10 w-10 text-purple-500 opacity-50" />
            </div>
          )}
        </div>
      </Link>

      <Link
        href={`/watch/${video.id}`}
        className="mt-3 block font-bold text-white transition-colors hover:text-purple-400"
      >
        {title}
      </Link>

      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
        <StarRating value={video.rating} size="sm" />
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" /> {video.viewsCount}
        </span>
        <WatchlistButton videoId={video.id} variant="card" />
      </div>
    </>
  );
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Wideo — z tabeli `videos`, z fallbackiem do danych mockowanych.
  let video: WatchVideo | null = null;
  let videoSeason: number | null = null;
  let nextEpisodeId: string | null = null;
  try {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      video = coerceVideoRow(data, id);
      const raw = data as Record<string, unknown>;
      videoSeason = toNumber(raw.season);
      const rawNextEpisodeId = raw.next_episode_id;
      nextEpisodeId =
        typeof rawNextEpisodeId === "string" && rawNextEpisodeId
          ? rawNextEpisodeId
          : null;
    }
  } catch {
    // Tabela `videos` może jeszcze nie istnieć — przechodzimy do mocków.
  }
  if (!video) {
    video = getMockVideo(id);
  }
  if (!video) {
    notFound();
  }

  // 2. Bieżący użytkownik (potrzebny dla listy „Do obejrzenia” i stanów).
  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch {
    // Brak sesji lub błąd pobierania użytkownika.
  }

  // 3. Następny odcinek — dynamicznie z tabeli `videos` (next_episode_id).
  let nextVideo: CardVideo | null = null;
  if (nextEpisodeId) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(
          "id, season, episode, title, series_name, thumbnail_url, views_count, reviews(rating)",
        )
        .eq("id", nextEpisodeId)
        .maybeSingle();
      if (!error && data) {
        nextVideo = coerceCardVideo(data, nextEpisodeId);
      }
    } catch {
      // Tabela `videos` może jeszcze nie istnieć.
    }
  }

  // 4. Polecany film — gdy to samodzielny film albo brak kolejnego odcinka.
  let recommendedVideo: CardVideo | null = null;
  if (videoSeason === null || nextVideo === null) {
    // Priorytet 1: lista „Do obejrzenia” zalogowanego użytkownika.
    if (userId) {
      try {
        const { data, error } = await supabase
          .from("watchlist")
          .select(
            "videos(id, season, episode, title, series_name, thumbnail_url, views_count, created_at, reviews(rating))",
          )
          .eq("user_id", userId);

        if (!error && Array.isArray(data)) {
          const candidates = (data as WatchlistRow[])
            .map((row) =>
              Array.isArray(row.videos) ? row.videos[0] : row.videos,
            )
            .filter(
              (row): row is CardVideoRow => row !== null && row.id !== id,
            )
            .sort((a, b) => {
              const aViews =
                typeof a.views_count === "number" ? a.views_count : 0;
              const bViews =
                typeof b.views_count === "number" ? b.views_count : 0;
              if (bViews !== aViews) {
                return bViews - aViews;
              }
              return (
                new Date(b.created_at ?? 0).getTime() -
                new Date(a.created_at ?? 0).getTime()
              );
            });

          const winner = candidates[0];
          recommendedVideo = winner ? coerceCardVideo(winner, winner.id) : null;
        }
      } catch {
        // Tabela `watchlist` może jeszcze nie istnieć.
      }
    }

    // Priorytet 2: fallback ogólny z całej tabeli `videos`.
    if (!recommendedVideo) {
      try {
        const { data, error } = await supabase
          .from("videos")
          .select(
            "id, season, episode, title, series_name, thumbnail_url, views_count, reviews(rating)",
          )
          .neq("id", id)
          .order("views_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          recommendedVideo = coerceCardVideo(data, id);
        }
      } catch {
        // Tabela `videos` może jeszcze nie istnieć.
      }
    }
  }

  // 5. Recenzje — z tabeli `reviews` (z profilem autora).
  let reviews: WatchReview[] = [];
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, user_id, rating, content, created_at, profiles(username, avatar_url)")
      .eq("video_id", id)
      .order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) {
      reviews = data
        .map((row, index) => coerceReviewRow(row, `${id}-review-${index + 1}`))
        .filter((review): review is WatchReview => review !== null);
    }
  } catch {
    // Tabela `reviews` może jeszcze nie istnieć — wyświetlamy pusty stan.
  }

  // Średnia arytmetyczna ocen na podstawie recenzji.
  const averageRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length;

  // 6. Stan "obejrzane" z tabeli `watched_history` oraz „do obejrzenia”.
  let initialWatched = false;
  let initialInWatchlist = false;
  try {
    if (userId) {
      const { data: watchedRow } = await supabase
        .from("watched_history")
        .select("id")
        .eq("user_id", userId)
        .eq("video_id", id)
        .maybeSingle();
      initialWatched = Boolean(watchedRow);

      const { data: watchlistRow } = await supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", userId)
        .eq("video_id", id)
        .maybeSingle();
      initialInWatchlist = Boolean(watchlistRow);
    }
  } catch {
    // Brak sesji lub tabela `watched_history`/`watchlist` nie istnieje.
  }

  // Recenzja bieżącego użytkownika dla tego filmu (jeśli istnieje).
  const userReview = userId
    ? reviews.find((review) => review.userId === userId) ?? null
    : null;

  // Wybór stanu prawej kolumny (4 przypadki).
  let sectionKind: "next-same" | "next-season" | "coming-soon" | "recommended";
  if (videoSeason === null) {
    sectionKind = "recommended";
  } else if (nextVideo) {
    if (nextVideo.season !== null && nextVideo.season > videoSeason) {
      sectionKind = "next-season";
    } else {
      sectionKind = "next-same";
    }
  } else {
    sectionKind = "coming-soon";
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white">
      <Navbar />

      <ReviewsProvider
        videoId={video.id}
        userId={userId}
        userReview={userReview}
      >
        <main className="mx-auto max-w-7xl px-6 py-8 md:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Lewa kolumna — odtwarzacz i opis */}
          <div className="lg:col-span-2">
            <h1 className="text-xl text-neutral-300">{video.seriesTitle}</h1>

            {/* Odtwarzacz (placeholder) */}
            <div className="mt-3 aspect-video overflow-hidden rounded-lg bg-neutral-900">
              <div className="flex h-full w-full items-center justify-center border border-neutral-800">
                <Play className="h-16 w-16 text-purple-500 opacity-50" />
              </div>
            </div>

            {/* Tytuł i metadane */}
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {video.episodeLabel} - {video.episodeTitle}
              </h2>

              <div className="flex items-center gap-5 text-sm text-neutral-300">
                <div className="flex items-center gap-2">
                  <StarRating value={averageRating} />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-neutral-400" />
                  <span>{video.views}</span>
                </div>
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="mt-5">
              <WatchActions
                videoId={video.id}
                userId={userId}
                initialWatched={initialWatched}
                initialInWatchlist={initialInWatchlist}
              />
            </div>

            {/* Opis */}
            <p className="mt-6 whitespace-pre-line leading-relaxed text-neutral-400">
              {video.description}
            </p>
          </div>

          {/* Prawa kolumna — następny odcinek / polecany film i recenzje */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <section>
              {sectionKind === "next-same" && nextVideo ? (
                <>
                  <h3 className="text-lg font-bold text-white">
                    Następny odcinek
                  </h3>
                  {renderCard(nextVideo, false)}
                </>
              ) : sectionKind === "next-season" && nextVideo ? (
                <>
                  <h3 className="text-lg font-bold text-white">Koniec Sezonu</h3>
                  <p className="mt-1 text-sm text-purple-400">
                    Rozpocznij oglądanie następnego sezonu
                  </p>
                  {renderCard(nextVideo, false)}
                </>
              ) : sectionKind === "coming-soon" ? (
                <>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm font-medium text-neutral-300">
                    Kolejny odcinek już wkrótce
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">
                    Polecany film
                  </h3>
                  {recommendedVideo ? (
                    renderCard(recommendedVideo, true)
                  ) : (
                    <p className="mt-3 text-sm text-neutral-500">
                      Brak polecanego filmu.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white">Polecany film</h3>
                  {recommendedVideo ? (
                    renderCard(recommendedVideo, true)
                  ) : (
                    <p className="mt-3 text-sm text-neutral-500">
                      Brak polecanego filmu.
                    </p>
                  )}
                </>
              )}
            </section>

            <hr className="my-6 border-neutral-800" />

            <ReviewsSection reviews={reviews} currentUserId={userId} />
          </aside>
        </div>
        </main>
      </ReviewsProvider>
    </div>
  );
}
