"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Pencil, Play, Plus, X } from "lucide-react";
import StarRating from "./StarRating";
import { createClient } from "../lib/supabase/client";

export type FavoriteVideo = {
  id: string;
  season: number | null;
  episode: number | null;
  title: string | null;
  seriesName: string | null;
  thumbnailUrl: string | null;
  viewsCount: number | null;
  rating: number;
};

export type FavoriteItem = {
  position: number;
  video: FavoriteVideo;
};

type FavoritesSectionProps = {
  userId: string;
  initialFavorites: FavoriteItem[];
  catalogItems: FavoriteVideo[];
};

type ModalMode = "add" | "edit" | null;

const SLOT_POSITIONS = [1, 2, 3] as const;

function formatEpisodeLabel(
  season: number | null,
  episode: number | null,
): string | null {
  if (season === null || episode === null) {
    return null;
  }
  return `S${season}E${episode}`;
}

function titleLabel(video: FavoriteVideo): { label: string | null; title: string } {
  const label = formatEpisodeLabel(video.season, video.episode);
  const title = video.title ?? "Bez tytułu";
  return { label, title };
}

function toViews(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export default function FavoritesSection({
  userId,
  initialFavorites,
  catalogItems,
}: FavoritesSectionProps) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>(initialFavorites);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [targetPosition, setTargetPosition] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setModalMode(null);
    setTargetPosition(null);
  }, []);

  useEffect(() => {
    if (!modalMode) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modalMode, closeModal]);
  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function isFavorite(videoId: string): boolean {
    return favorites.some((favorite) => favorite.video.id === videoId);
  }

  function findVideo(videoId: string): FavoriteVideo | undefined {
    return catalogItems.find((video) => video.id === videoId);
  }

  function firstFreePosition(): number | null {
    for (const position of SLOT_POSITIONS) {
      if (!favorites.some((favorite) => favorite.position === position)) {
        return position;
      }
    }
    return null;
  }

  function openAdd() {
    setTargetPosition(null);
    setModalMode("add");
  }

  function openEdit(position: number) {
    setTargetPosition(position);
    setModalMode("edit");
  }

  async function handleRemoveFavorite(videoId: string) {
    if (removingId) {
      return;
    }
    setRemovingId(videoId);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("video_id", videoId);

      if (error) {
        throw error;
      }

      setFavorites((prev) =>
        prev.filter((favorite) => favorite.video.id !== videoId),
      );
      router.refresh();
      showToast("Usunięto z ulubionych");
    } catch {
      showToast("Nie udało się usunąć. Spróbuj ponownie.");
    } finally {
      setRemovingId(null);
    }
  }
  async function handleSelect(videoId: string) {
    if (saving || isFavorite(videoId)) {
      return;
    }
    setSaving(true);

    try {
      const supabase = createClient();
      const video = findVideo(videoId);

      if (modalMode === "edit" && targetPosition !== null) {
        const exists = favorites.some(
          (favorite) => favorite.position === targetPosition,
        );

        if (exists) {
          const { error } = await supabase
            .from("user_favorites")
            .update({ video_id: videoId })
            .eq("user_id", userId)
            .eq("position", targetPosition);

          if (error) {
            throw error;
          }

          if (video) {
            setFavorites((prev) =>
              prev.map((favorite) =>
                favorite.position === targetPosition
                  ? { position: targetPosition, video }
                  : favorite,
              ),
            );
          }
        } else {
          const { error } = await supabase
            .from("user_favorites")
            .insert({ user_id: userId, video_id: videoId, position: targetPosition });

          if (error) {
            throw error;
          }

          if (video) {
            setFavorites((prev) => [
              ...prev,
              { position: targetPosition, video },
            ]);
          }
        }
      } else {
        const position = firstFreePosition();
        if (position === null) {
          showToast("Masz już 3 ulubione filmy");
          return;
        }

        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: userId, video_id: videoId, position });

        if (error) {
          throw error;
        }

        if (video) {
          setFavorites((prev) => [...prev, { position, video }]);
        }
      }

      router.refresh();
      closeModal();
    } catch {
      showToast("Nie udało się zapisać. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <section className="mt-12">
        <h2 className="mb-4 border-l-4 border-purple-600 pl-4 text-2xl font-semibold text-white">
          Ulubione
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {SLOT_POSITIONS.map((position) => {
            const favorite = favorites.find(
              (item) => item.position === position,
            );

            if (!favorite) {
              return (
                <button
                  key={position}
                  type="button"
                  onClick={openAdd}
                  aria-label="Dodaj ulubiony film"
                  className="group flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-neutral-800 bg-neutral-900/60 transition-colors hover:border-purple-500/60"
                >
                  <Plus className="h-8 w-8 text-neutral-600 transition-colors group-hover:text-purple-400" />
                </button>
              );
            }

            const { label, title } = titleLabel(favorite.video);
            const views = toViews(favorite.video.viewsCount);

            return (
              <div key={position} className="group">
                <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                  {favorite.video.thumbnailUrl ? (
                    <img
                      src={favorite.video.thumbnailUrl}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/20 to-neutral-800">
                      <Play className="h-12 w-12 text-purple-500 opacity-50" />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/75 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(position)}
                      className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                    >
                      <Pencil className="h-4 w-4" />
                      Edytuj
                    </button>
                  </div>
                </div>

                <p className="mt-3 font-bold text-white">
                  {label ? `${label} - ${title}` : title}
                </p>

                <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <StarRating value={favorite.video.rating} size="sm" />
                    <span className="font-medium">
                      {favorite.video.rating.toFixed(1)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {views}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {modalMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Wybierz film do ulubionych"
            className="relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Wybierz film z katalogu
                </h3>
                <p className="text-sm text-neutral-400">
                  {modalMode === "edit"
                    ? "Wybierz film, który zastąpi obecny w tym miejscu."
                    : "Wybierz film, który chcesz dodać do ulubionych."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Zamknij okno"
                className="text-neutral-400 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {catalogItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-neutral-300">Twój katalog jest pusty.</p>
                  <p className="mt-2 max-w-md text-sm text-neutral-400">
                    Najpierw dodaj obejrzane filmy do swojego katalogu, aby móc
                    wybrać je jako ulubione.
                  </p>
                  <Link
                    href="/profile/catalog"
                    className="mt-6 rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                  >
                    Przejdź do Mojego Katalogu
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catalogItems.map((video) => {
                    const { label, title } = titleLabel(video);
                    const added = isFavorite(video.id);

                    return (
                      <div key={video.id} className="relative">
                        <button
                          type="button"
                          onClick={() => handleSelect(video.id)}
                          disabled={added}
                          className="block w-full text-left"
                        >
                          <p className="mb-2 truncate text-sm font-bold text-white">
                            {video.seriesName ?? "Film"}
                          </p>

                          <div className="aspect-video overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/20 to-neutral-800">
                                <Play className="h-10 w-10 text-purple-500 opacity-50" />
                              </div>
                            )}
                          </div>

                          <p className="mt-2 text-sm font-bold text-white">
                            {label ? `${label} - ${title}` : title}
                          </p>
                        </button>

                        {added && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/70">
                            <button
                              type="button"
                              onClick={() => handleRemoveFavorite(video.id)}
                              disabled={removingId === video.id}
                              aria-label="Usuń z ulubionych"
                              title="Usuń z ulubionych"
                              className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {removingId === video.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <X className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}




