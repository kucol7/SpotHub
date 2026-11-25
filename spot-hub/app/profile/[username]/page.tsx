import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import PublicProfileHeader from "../../../components/PublicProfileHeader";
import PublicFavoritesSection from "../../../components/PublicFavoritesSection";
import type {
  FavoriteItem,
  FavoriteVideo,
} from "../../../components/FavoritesSection";


export const instant = false;

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
};

type ReviewRatingRow = {
  rating: number | null;
};

type FavoriteVideoRow = {
  id: string;
  season: number | null;
  episode: number | null;
  title: string | null;
  series_name: string | null;
  thumbnail_url: string | null;
  views_count: number | null;
  reviews: ReviewRatingRow[] | null;
};

type FavoriteRow = {
  id: string;
  position: number | null;
  video_id: string | null;
  videos: FavoriteVideoRow | FavoriteVideoRow[] | null;
};

function formatJoinDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

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

function toVideo(row: FavoriteVideoRow | null | undefined): FavoriteVideo | null {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    season: typeof row.season === "number" ? row.season : null,
    episode: typeof row.episode === "number" ? row.episode : null,
    title: typeof row.title === "string" ? row.title : null,
    seriesName: typeof row.series_name === "string" ? row.series_name : null,
    thumbnailUrl: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
    viewsCount: typeof row.views_count === "number" ? row.views_count : null,
    rating: averageRating(row.reviews),
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username: rawUsername } = await params;

  let username: string;
  try {
    username = decodeURIComponent(rawUsername);
  } catch {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, created_at")
    .eq("username", username)
    .maybeSingle();

  const profile = (data ?? null) as ProfileRow | null;

  if (error || !profile) {
    notFound();
  }

  const targetUserId = profile.id;

  let currentUserId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
  } catch {
  }

  if (currentUserId && currentUserId === targetUserId) {
    redirect("/profile/me");
  }

  let watchedCount = 0;
  try {
    const { count, error: countError } = await supabase
      .from("watched_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId);
    if (!countError && typeof count === "number") {
      watchedCount = count;
    }
  } catch {
  }

  let followingCount = 0;
  try {
    const { count, error: countError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUserId);
    if (!countError && typeof count === "number") {
      followingCount = count;
    }
  } catch {

  }

  let followersCount = 0;
  try {
    const { count, error: countError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUserId);
    if (!countError && typeof count === "number") {
      followersCount = count;
    }
  } catch {
  }

  let isFollowing = false;
  if (currentUserId) {
    try {
      const { data: followRow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .maybeSingle();
      isFollowing = Boolean(followRow);
    } catch {
    }
  }

  let favoriteItems: FavoriteItem[] = [];
  try {
    const { data: favData, error: favError } = await supabase
      .from("user_favorites")
      .select("id, position, video_id, videos(*, reviews(rating))")
      .eq("user_id", targetUserId)
      .order("position", { ascending: true });

    if (!favError && Array.isArray(favData)) {
      favoriteItems = (favData as FavoriteRow[])
        .map((row) => {
          const position =
            typeof row.position === "number" ? row.position : null;
          if (position === null || position < 1 || position > 3) {
            return null;
          }
          const videoRow = Array.isArray(row.videos)
            ? (row.videos[0] ?? null)
            : row.videos;
          const video = toVideo(videoRow);
          if (!video) {
            return null;
          }
          return { position, video } satisfies FavoriteItem;
        })
        .filter((item): item is FavoriteItem => item !== null);
    }
  } catch {
  }

  const joinDate = formatJoinDate(profile.created_at);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:px-12">
      <PublicProfileHeader
        username={profile.username ?? "Użytkownik"}
        bio={profile.bio ?? null}
        avatarUrl={profile.avatar_url ?? null}
        joinDate={joinDate}
        watchedCount={watchedCount}
        followingCount={followingCount}
        followersCount={followersCount}
        currentUserId={currentUserId}
        targetUserId={targetUserId}
        initialIsFollowing={isFollowing}
      />

      <PublicFavoritesSection favorites={favoriteItems} />
    </main>
  );
}

