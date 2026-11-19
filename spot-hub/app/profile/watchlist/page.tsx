import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import WatchlistContent, {
  type WatchlistItem,
} from "../../../components/WatchlistContent";

// Strona czyta ciasteczka sesji (auth), więc nie może być prerenderowana.
export const instant = false;

type ReviewRatingRow = {
  rating: number | null;
};

type WatchlistVideoRow = {
  id: string;
  season: number | null;
  episode: number | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  views_count: number | null;
  reviews: ReviewRatingRow[] | null;
};

type WatchlistRow = {
  created_at: string;
  videos: WatchlistVideoRow | WatchlistVideoRow[] | null;
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

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let items: WatchlistItem[] = [];

  try {
    const { data, error } = await supabase
      .from("watchlist")
      .select(
        "created_at, videos(id, season, episode, title, description, thumbnail_url, views_count, reviews(rating))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      items = (data as WatchlistRow[])
        .filter((row) => row.videos != null)
        .map((row) => {
          const video = Array.isArray(row.videos)
            ? (row.videos[0] ?? null)
            : row.videos;

          if (!video) {
            return null;
          }

          return {
            watchlistCreatedAt: row.created_at,
            id: video.id,
            season: video.season,
            episode: video.episode,
            title: video.title,
            description: video.description,
            thumbnail_url: video.thumbnail_url,
            views_count: video.views_count,
            rating: averageRating(video.reviews),
          } satisfies WatchlistItem;
        })
        .filter((item): item is WatchlistItem => item !== null);
    }
  } catch {
    // Tabela "watchlist" może jeszcze nie istnieć — wyświetlamy pusty stan.
  }

  return <WatchlistContent items={items} userId={user.id} />;
}
