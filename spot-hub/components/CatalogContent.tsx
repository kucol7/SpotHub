"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  Check,
  Eye,
  Film,
  Loader2,
  MoreHorizontal,
  Play,
  Trash2,
} from "lucide-react";
import StarRating from "./StarRating";
import { createClient } from "../lib/supabase/client";
import { useUserLibrary } from "./user-library-context";

export type CatalogItem = {
  watchedAt: string;
  id: string;
  season: number | null;
  episode: number | null;
  title: string | null;
  seriesName: string | null;
  thumbnailUrl: string | null;
  viewsCount: number | null;
  rating: number;
};

type SortMode =
  | "newest"
  | "oldest"
  | "views-desc"
  | "views-asc"
  | "rating-desc"
  | "rating-asc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Data dodania: Najnowsze" },
  { value: "oldest", label: "Data dodania: Najstarsze" },
  { value: "views-desc", label: "Wyświetlenia: Najwyższe" },
  { value: "views-asc", label: "Wyświetlenia: Najniższe" },
  { value: "rating-desc", label: "Oceny: Najwyższe" },
  { value: "rating-asc", label: "Oceny: Najniższe" },
];

function toTimestamp(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function toViews(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatDate(value: string): string {
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

function formatEpisodeLabel(
  season: number | null,
  episode: number | null,
): string | null {
  if (season === null || episode === null) {
    return null;
  }
  return `S${season}E${episode}`;
}

export default function CatalogContent({
  items: initialItems,
  userId,
}: {
  items: CatalogItem[];
  userId: string;
}) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [sort, setSort] = useState<SortMode>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setWatched } = useUserLibrary();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  const isEmpty = items.length === 0;

  const sorted = [...items].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return toTimestamp(a.watchedAt) - toTimestamp(b.watchedAt);
      case "views-desc":
        return toViews(b.viewsCount) - toViews(a.viewsCount);
      case "views-asc":
        return toViews(a.viewsCount) - toViews(b.viewsCount);
      case "rating-desc":
        return b.rating - a.rating;
      case "rating-asc":
        return a.rating - b.rating;
      case "newest":
      default:
        return toTimestamp(b.watchedAt) - toTimestamp(a.watchedAt);
    }
  });

  async function handleDelete(videoId: string) {
    if (!userId || deletingId) {
      return;
    }

    setDeletingId(videoId);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("watched_history")
        .delete()
        .eq("user_id", userId)
        .eq("video_id", videoId);

      if (error) {
        throw error;
      }

      setItems((prev) => prev.filter((item) => item.id !== videoId));
      setWatched(videoId, false);
      setMenuId(null);
    } catch {
      showToast("Nie udało się usunąć z katalogu. Spróbuj ponownie.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isEmpty) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Mój Katalog</h1>

        <div className="mt-20 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
            <Film className="h-9 w-9 text-neutral-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">Twój katalog jest pusty!</h2>
          <p className="mt-2 text-neutral-400">Odkrywaj więcej filmów</p>
          <Link
            href="/"
            className="mt-6 rounded-full bg-purple-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
          >
            Przeglądaj
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mój Katalog</h1>

        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neutral-400 transition-colors hover:text-white"
            aria-haspopup="menu"
            aria-expanded={sortOpen}
          >
            <ArrowDownUp className="h-4 w-4" />
            Sortuj
          </button>

          {sortOpen && (
            <div className="absolute right-0 z-10 mt-1 w-64 rounded-md border border-neutral-800 bg-neutral-900 py-1 shadow-lg">
              {SORT_OPTIONS.map((option) => {
                const active = sort === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSort(option.value);
                      setSortOpen(false);
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
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((item) => {
          const label = formatEpisodeLabel(item.season, item.episode);
          const title = item.title ?? "Bez tytułu";
          const views = toViews(item.viewsCount);

          return (
            <div key={item.id} className="group">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {formatDate(item.watchedAt)}
                </span>

                <div
                  className="relative"
                  ref={menuId === item.id ? menuRef : undefined}
                >
                  <button
                    type="button"
                    aria-label="Opcje filmu"
                    aria-haspopup="menu"
                    aria-expanded={menuId === item.id}
                    onClick={() =>
                      setMenuId((prev) => (prev === item.id ? null : item.id))
                    }
                    className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>

                  {menuId === item.id && (
                    <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-neutral-800 bg-neutral-900 py-1 shadow-lg">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-neutral-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Usuń z katalogu
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-1 text-base font-bold text-white">
                {item.seriesName ?? "Film"}
              </p>

              <Link href={`/watch/${item.id}`} className="mt-3 block">
                <div className="aspect-video overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/20 to-neutral-800">
                      <Play className="h-12 w-12 text-purple-500 opacity-50" />
                    </div>
                  )}
                </div>
              </Link>

              <Link
                href={`/watch/${item.id}`}
                className="mt-3 block font-bold text-white transition-colors hover:text-purple-400"
              >
                {label ? `${label} - ${title}` : title}
              </Link>

              <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <StarRating value={item.rating} size="sm" />
                  <span className="font-medium">{item.rating.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {views}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
