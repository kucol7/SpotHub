"use client";

import { useState } from "react";
import { Check, Loader2, MessageSquare, Plus, Share2 } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import { useReviews } from "./reviews-context";
import WatchlistButton from "./WatchlistButton";
import { useUserLibrary } from "./user-library-context";

type WatchActionsProps = {
  videoId: string;
  userId: string | null;
  initialWatched: boolean;
  initialInWatchlist: boolean;
};

export default function WatchActions({
  videoId,
  userId,
  initialWatched,
  initialInWatchlist,
}: WatchActionsProps) {
  const [watched, setWatched] = useState(initialWatched);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { openReview } = useReviews();
  const {
    setWatched: setLibraryWatched,
    setInWatchlist: setLibraryInWatchlist,
  } = useUserLibrary();

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function handleWatched() {
    if (!userId) {
      showToast("Zaloguj się, aby dodać do obejrzanych");
      return;
    }
    if (busy) {
      return;
    }
    setBusy(true);

    try {
      const supabase = createClient();
      if (watched) {
        await supabase
          .from("watched_history")
          .delete()
          .eq("user_id", userId)
          .eq("video_id", videoId);
        setWatched(false);
        setLibraryWatched(videoId, false);
      } else {
        await supabase
          .from("watched_history")
          .insert({ user_id: userId, video_id: videoId });
        setWatched(true);
        // Trigger w Supabase usuwa wpis z watchlist — synchronizujemy UI,
        // aby przycisk „Do obejrzenia” zniknął natychmiast.
        setLibraryWatched(videoId, true);
        setLibraryInWatchlist(videoId, false);
      }
    } catch {
      showToast("Nie udało się zapisać. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  function handleReview() {
    openReview();
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Skopiowano do schowka");
    } catch {
      showToast("Nie udało się skopiować");
    }
  }

  const base =
    "flex h-10 w-10 items-center justify-center rounded-full transition-colors";

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleWatched}
          disabled={busy}
          aria-label="Dodaj do obejrzanych"
          title="Dodaj do obejrzanych"
          className={`${base} ${
            watched
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
          }`}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : watched ? (
            <Check className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </button>

        <WatchlistButton
          videoId={videoId}
          userId={userId}
          initialInWatchlist={initialInWatchlist}
          initialWatched={initialWatched}
          variant="round"
        />

        <button
          type="button"
          onClick={handleReview}
          aria-label="Dodaj recenzję"
          title="Dodaj recenzję"
          className={`${base} bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white`}
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={handleShare}
          aria-label="Udostępnij"
          title="Udostępnij"
          className={`${base} bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white`}
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
