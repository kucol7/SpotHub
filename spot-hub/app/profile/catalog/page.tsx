import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import CatalogContent, {
  type CatalogItem,
} from "../../../components/CatalogContent";

// Strona czyta ciasteczka sesji (auth), więc nie może być prerenderowana.
export const instant = false;

type ReviewRatingRow = {
  rating: number | null;
};

type CatalogVideoRow = {
  id: string;
  season: number | null;
  episode: number | null;
  title: string | null;
  series_name: string | null;
  thumbnail_url: string | null;
  views_count: number | null;
  reviews: ReviewRatingRow[] | null;
};

type CatalogRow = {
  created_at: string;
  videos: CatalogVideoRow | CatalogVideoRow[] | null;
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

export default async function CatalogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let items: CatalogItem[] = [];

  try {
    const { data, error } = await supabase
      .from("watched_history")
      .select(
        "created_at, videos(id, season, episode, title, series_name, thumbnail_url, views_count, reviews(rating))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      items = (data as CatalogRow[])
        .filter((row) => row.videos != null)
        .map((row) => {
          const video = Array.isArray(row.videos)
            ? (row.videos[0] ?? null)
            : row.videos;

          if (!video) {
            return null;
          }

          return {
            watchedAt: row.created_at,
            id: video.id,
            season: video.season,
            episode: video.episode,
            title: video.title,
            seriesName: video.series_name,
            thumbnailUrl: video.thumbnail_url,
            viewsCount: video.views_count,
            rating: averageRating(video.reviews),
          } satisfies CatalogItem;
        })
        .filter((item): item is CatalogItem => item !== null);
    }
  } catch {
    // Tabela "watched_history" może jeszcze nie istnieć — wyświetlamy pusty stan.
  }

  return <CatalogContent items={items} userId={user.id} />;
}
