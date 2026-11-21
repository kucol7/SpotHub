"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "../lib/supabase/client";

type UserLibraryContextValue = {
  userId: string | null;
  ready: boolean;
  isWatched: (videoId: string) => boolean;
  isInWatchlist: (videoId: string) => boolean;
  setWatched: (videoId: string, watched: boolean) => void;
  setInWatchlist: (videoId: string, inWatchlist: boolean) => void;
};

const UserLibraryContext = createContext<UserLibraryContextValue>({
  userId: null,
  ready: false,
  isWatched: () => false,
  isInWatchlist: () => false,
  setWatched: () => {},
  setInWatchlist: () => {},
});

export function useUserLibrary(): UserLibraryContextValue {
  return useContext(UserLibraryContext);
}

type IdRow = { video_id: string | null };

function rowsToIdSet(rows: IdRow[] | null | undefined): Set<string> {
  const result = new Set<string>();
  if (!rows) {
    return result;
  }
  for (const row of rows) {
    if (typeof row?.video_id === "string" && row.video_id) {
      result.add(row.video_id);
    }
  }
  return result;
}

/**
 * Współdzielony stan zalogowanego użytkownika (watchlist + watched_history).
 *
 * Dzięki temu WatchlistButton na wszystkich kartach odczytuje stan z jednego
 * miejsca (jedno zapytanie o listy zamiast osobnego zapytania per karta), a po
 * dodaniu filmu do „obejrzanych” stan można zaktualizować natychmiast.
 */
export function UserLibraryProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function load() {
      let currentUserId: string | null = null;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        currentUserId = user?.id ?? null;
      } catch {
        currentUserId = null;
      }

      if (!mounted) {
        return;
      }

      if (!currentUserId) {
        setUserId(null);
        setWatchedIds(new Set());
        setWatchlistIds(new Set());
        setReady(true);
        return;
      }

      setUserId(currentUserId);

      let watchedRows: IdRow[] | null = null;
      let watchlistRows: IdRow[] | null = null;

      try {
        const { data } = await supabase
          .from("watched_history")
          .select("video_id")
          .eq("user_id", currentUserId);
        watchedRows = (data as IdRow[] | null) ?? null;
      } catch {
        watchedRows = null;
      }

      try {
        const { data } = await supabase
          .from("watchlist")
          .select("video_id")
          .eq("user_id", currentUserId);
        watchlistRows = (data as IdRow[] | null) ?? null;
      } catch {
        watchlistRows = null;
      }

      if (!mounted) {
        return;
      }

      setWatchedIds(rowsToIdSet(watchedRows));
      setWatchlistIds(rowsToIdSet(watchlistRows));
      setReady(true);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const isWatched = useCallback(
    (videoId: string) => watchedIds.has(videoId),
    [watchedIds],
  );

  const isInWatchlist = useCallback(
    (videoId: string) => watchlistIds.has(videoId),
    [watchlistIds],
  );

  const setWatched = useCallback((videoId: string, watched: boolean) => {
    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (watched) {
        next.add(videoId);
      } else {
        next.delete(videoId);
      }
      return next;
    });
  }, []);

  const setInWatchlist = useCallback((videoId: string, inWatchlist: boolean) => {
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (inWatchlist) {
        next.add(videoId);
      } else {
        next.delete(videoId);
      }
      return next;
    });
  }, []);

  const value: UserLibraryContextValue = {
    userId,
    ready,
    isWatched,
    isInWatchlist,
    setWatched,
    setInWatchlist,
  };

  return (
    <UserLibraryContext.Provider value={value}>
      {children}
    </UserLibraryContext.Provider>
  );
}
