"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { BookmarkCheck, BookmarkPlus, Loader2 } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import { useUserLibrary } from "./user-library-context";

type WatchlistButtonProps = {
  videoId: string;
  userId?: string | null;
  initialInWatchlist?: boolean;
  initialWatched?: boolean;
  variant?: "card" | "round";
  className?: string;
  onToggle?: (nextInWatchlist: boolean) => void;
};

export default function WatchlistButton({
  videoId,
  userId: userIdProp,
  initialInWatchlist = false,
  initialWatched = false,
  variant = "card",
  className = "",
  onToggle,
}: WatchlistButtonProps) {
  const router = useRouter();
  const {
    ready,
    userId: contextUserId,
    isWatched,
    isInWatchlist,
    setInWatchlist,
  } = useUserLibrary();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const userId = userIdProp !== undefined ? userIdProp : contextUserId;

  // Gdy film jest już w historii obejrzanych, przycisk „Do obejrzenia”
  // nie renderuje się wcale.
  const watched =
    userId != null && (ready ? isWatched(videoId) : initialWatched);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  if (watched) {
    return null;
  }

  const inWatchlist =
    userId != null && ready ? isInWatchlist(videoId) : initialInWatchlist;

  async function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!ready) {
      return;
    }

    if (!userId) {
      showToast("Zaloguj się, aby dodać do listy do obejrzenia");
      router.push("/login");
      return;
    }

    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const supabase = createClient();

      if (inWatchlist) {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", userId)
          .eq("video_id", videoId);

        if (error) {
          throw error;
        }

        setInWatchlist(videoId, false);
        onToggle?.(false);
        showToast("Usunięto z listy do obejrzenia");
      } else {
        const { error } = await supabase
          .from("watchlist")
          .insert({ user_id: userId, video_id: videoId });

        if (error) {
          throw error;
        }

        setInWatchlist(videoId, true);
        onToggle?.(true);
        showToast("Dodano do listy do obejrzenia");
      }
    } catch {
      showToast("Nie udało się zapisać. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  const ariaLabel = inWatchlist
    ? "Usuń z listy do obejrzenia"
    : "Dodaj do listy do obejrzenia";

  if (variant === "round") {
    return (
      <>
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || !ready}
          aria-label={ariaLabel}
          title={ariaLabel}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            inWatchlist
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
          } ${className}`}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : inWatchlist ? (
            <BookmarkCheck className="h-5 w-5" />
          ) : (
            <BookmarkPlus className="h-5 w-5" />
          )}
        </button>

        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy || !ready}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          inWatchlist
            ? "text-purple-400 hover:text-purple-300"
            : "text-neutral-400 hover:text-purple-400"
        } ${className}`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : inWatchlist ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <BookmarkPlus className="h-4 w-4" />
        )}
      </button>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
