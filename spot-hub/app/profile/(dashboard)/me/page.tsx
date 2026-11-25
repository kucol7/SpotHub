import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import ProfileHeader, {
  type ProfileStat,
} from "../../../../components/ProfileHeader";
import FavoritesSection, {
  type FavoriteItem,
  type FavoriteVideo,
} from "../../../../components/FavoritesSection";


export const instant = false;

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

type Profile = {
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

type CatalogRow = {
  created_at: string;
  videos: FavoriteVideoRow | FavoriteVideoRow[] | null;
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

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let username =
    typeof user.user_metadata?.username === "string" &&
    user.user_metadata.username
      ? user.user_metadata.username
      : (user.email ?? "Użytkownik");

  let avatarUrl: string | null = null;
  let bio: string | null = null;
  let createdAt: string | null | undefined = user.created_at;

  try {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url, bio, created_at")
      .eq("id", user.id)
      .maybeSingle();

    const profile: Profile | null = data ?? null;

    if (profile?.username) {
      username = profile.username;
    }
    avatarUrl = profile?.avatar_url ?? null;
    bio = profile?.bio ?? null;
    if (profile?.created_at) {
      createdAt = profile.created_at;
    }
  } catch {
  }

  let watchedCount = 0;
  try {
    const { count, error } = await supabase
      .from("watched_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (!error && typeof count === "number") {
      watchedCount = count;
    }
  } catch {
  }

  let followingCount = 0;
  try {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id);
    if (!error && typeof count === "number") {
      followingCount = count;
    }
  } catch {
  }

  let followersCount = 0;
  try {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);
    if (!error && typeof count === "number") {
      followersCount = count;
    }
  } catch {
  }

  const joinDate = formatJoinDate(createdAt);

  const stats: ProfileStat[] = [
    { label: "Obejrzane filmy", value: String(watchedCount) },
    { label: "Obserwowani", value: String(followingCount) },
    { label: "Obserwujący", value: String(followersCount) },
    { label: "Data dołączenia", value: joinDate },
  ];

  let favoriteItems: FavoriteItem[] = [];
  try {
    const { data, error } = await supabase
      .from("user_favorites")
      .select("id, position, video_id, videos(*, reviews(rating))")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    if (!error && Array.isArray(data)) {
      favoriteItems = (data as FavoriteRow[])
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

  let catalogVideos: FavoriteVideo[] = [];
  try {
    const { data, error } = await supabase
      .from("watched_history")
      .select(
        "created_at, videos(id, season, episode, title, series_name, thumbnail_url, views_count, reviews(rating))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      catalogVideos = (data as CatalogRow[])
        .map((row) => {
          const videoRow = Array.isArray(row.videos)
            ? (row.videos[0] ?? null)
            : row.videos;
          return toVideo(videoRow);
        })
        .filter((video): video is FavoriteVideo => video !== null);
    }
  } catch {
  }

  return (
    <div>
      <ProfileHeader
        username={username}
        bio={bio}
        avatarUrl={avatarUrl}
        stats={stats}
      />
      <FavoritesSection
        userId={user.id}
        initialFavorites={favoriteItems}
        catalogItems={catalogVideos}
      />
    </div>
  );
}

