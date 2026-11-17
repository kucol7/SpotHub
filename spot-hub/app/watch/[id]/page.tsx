import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Play } from "lucide-react";
import Navbar from "../../../components/Navbar";
import ReviewsSection from "../../../components/ReviewsSection";
import StarRating from "../../../components/StarRating";
import WatchActions from "../../../components/WatchActions";
import { createClient } from "../../../lib/supabase/server";
import {
  coerceReviewRow,
  coerceVideoRow,
  getMockNextVideo,
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

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Wideo — z tabeli `videos`, z fallbackiem do danych mockowanych.
  let video: WatchVideo | null = null;
  try {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      video = coerceVideoRow(data, id);
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

  // 2. Następny odcinek — póki co wyliczany z danych mockowanych.
  const nextVideo = getMockNextVideo(id);

  // 3. Recenzje — z tabeli `reviews` (z profilem autora).
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

  // 4. Bieżący użytkownik i stan "obejrzane" z tabeli `watched_history`.
  let userId: string | null = null;
  let initialWatched = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: watchedRow } = await supabase
        .from("watched_history")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", id)
        .maybeSingle();
      initialWatched = Boolean(watchedRow);
    }
  } catch {
    // Brak sesji lub tabela `watched_history` nie istnieje.
  }

  // Recenzja bieżącego użytkownika dla tego filmu (jeśli istnieje).
  const userReview = userId
    ? reviews.find((review) => review.userId === userId) ?? null
    : null;

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
              />
            </div>

            {/* Opis */}
            <p className="mt-6 whitespace-pre-line leading-relaxed text-neutral-400">
              {video.description}
            </p>
          </div>

          {/* Prawa kolumna — następny odcinek i recenzje */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <section>
              <h3 className="text-lg font-bold text-white">Następny odcinek:</h3>

              {nextVideo ? (
                <>
                  <Link href={`/watch/${nextVideo.id}`} className="group block">
                    <div className="mt-3 aspect-video overflow-hidden rounded-lg bg-neutral-900">
                      <div className="flex h-full w-full items-center justify-center border border-neutral-800 transition-colors group-hover:border-neutral-700">
                        <Play className="h-10 w-10 text-purple-500 opacity-50" />
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`/watch/${nextVideo.id}`}
                    className="mt-3 block font-bold text-white transition-colors hover:text-purple-400"
                  >
                    {nextVideo.episodeLabel} - {nextVideo.episodeTitle}
                  </Link>

                  <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                    <StarRating value={nextVideo.rating} size="sm" />
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {nextVideo.views}
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">
                  To ostatni dostępny odcinek.
                </p>
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
