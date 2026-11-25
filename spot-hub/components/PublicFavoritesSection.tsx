import Link from "next/link";
import { Eye, Play } from "lucide-react";
import StarRating from "./StarRating";
import type { FavoriteItem } from "./FavoritesSection";

type PublicFavoritesSectionProps = {
  favorites: FavoriteItem[];
};

function formatEpisodeLabel(
  season: number | null,
  episode: number | null,
): string | null {
  if (season === null || episode === null) {
    return null;
  }
  return `S${season}E${episode}`;
}

export default function PublicFavoritesSection({
  favorites,
}: PublicFavoritesSectionProps) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 border-l-4 border-purple-600 pl-4 text-2xl font-semibold text-white">
        Ulubione
      </h2>

      {favorites.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Użytkownik nie wybrał jeszcze ulubionych filmów
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {favorites.map(({ position, video }) => {
            const label = formatEpisodeLabel(video.season, video.episode);
            const title = video.title ?? "Bez tytułu";
            const views =
              typeof video.viewsCount === "number" &&
              Number.isFinite(video.viewsCount)
                ? video.viewsCount
                : 0;

            return (
              <Link key={position} href={`/watch/${video.id}`} className="group">
                <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/20 to-neutral-800">
                      <Play className="h-12 w-12 text-purple-500 opacity-50" />
                    </div>
                  )}
                </div>

                <p className="mt-3 font-bold text-white transition-colors group-hover:text-purple-400">
                  {label ? `${label} - ${title}` : title}
                </p>

                <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <StarRating value={video.rating} size="sm" />
                    <span className="font-medium">{video.rating.toFixed(1)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {views}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
