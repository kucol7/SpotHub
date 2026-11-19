"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Bookmark, Check, Eye, Play } from "lucide-react";
import StarRating from "./StarRating";
import WatchlistButton from "./WatchlistButton";

export type WatchlistItem = {
  watchlistCreatedAt: string;
  id: string;
  season: number | null;
  episode: number | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  views_count: number | null;
  rating: number;
};

type SortMode = "newest" | "oldest";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Najpóźniej dodane" },
  { value: "oldest", label: "Najwcześniej dodane" },
];

function formatEpisodeLabel(
  season: number | null,
  episode: number | null,
): string | null {
  if (season === null || episode === null) {
    return null;
  }
  return `S${season}E${episode}`;
}

export default function WatchlistContent({
  items: initialItems,
  userId,
}: {
  items: WatchlistItem[];
  userId: string;
}) {
  const [items, setItems] = useState<WatchlistItem[]>(initialItems);
  const [sort, setSort] = useState<SortMode>("newest");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isEmpty = items.length === 0;

  const sorted = [...items].sort((a, b) => {
    const aTime = new Date(a.watchlistCreatedAt).getTime();
    const bTime = new Date(b.watchlistCreatedAt).getTime();
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });

  function handleRemoved(videoId: string) {
    setItems((prev) => prev.filter((item) => item.id !== videoId));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Do obejrzenia</h1>

        {!isEmpty && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neutral-400 transition-colors hover:text-white"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <ArrowDownUp className="h-4 w-4" />
              Sortuj
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-neutral-800 bg-neutral-900 py-1 shadow-lg">
                {SORT_OPTIONS.map((option) => {
                  const active = sort === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setSort(option.value);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                        active
                          ? "text-white"
                          : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      }`}
                    >
                      <span>{option.label}</span>
                      {active && <Check className="h-4 w-4 text-purple-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="mt-20 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
            <Bookmark className="h-9 w-9 text-neutral-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">
            Twoja lista Do Obejrzenia jest pusta!
          </h2>
          <p className="mt-2 text-neutral-400">Odkrywaj więcej filmów</p>
          <Link
            href="/"
            className="mt-6 rounded-full bg-purple-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
          >
            Przeglądaj
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {sorted.map((item) => {
            const label = formatEpisodeLabel(item.season, item.episode);
            const title = item.title ?? "Bez tytułu";
            const description = item.description ?? "";
            const views =
              typeof item.views_count === "number" ? item.views_count : 0;

            return (
              <Link
                key={item.id}
                href={`/watch/${item.id}`}
                className="group flex flex-col gap-6 rounded-xl border border-transparent p-4 transition-all duration-300 hover:border-white/5 hover:bg-neutral-900/50 md:flex-row"
              >
                <div className="w-full shrink-0 md:w-80">
                  <div className="aspect-video overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail_url}
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
                      <StarRating value={item.rating} size="sm" />
                      <span className="font-medium">{item.rating.toFixed(1)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {views}
                    </span>
                    <WatchlistButton
                      videoId={item.id}
                      userId={userId}
                      initialInWatchlist
                      variant="card"
                      onToggle={(next) => {
                        if (!next) {
                          handleRemoved(item.id);
                        }
                      }}
                    />
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
      )}
    </div>
  );
}

