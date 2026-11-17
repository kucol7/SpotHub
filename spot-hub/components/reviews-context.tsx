"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import ReviewModal from "./ReviewModal";
import type { WatchReview } from "../lib/watch";

type ReviewsContextValue = {
  openReview: () => void;
  editReview: (review: WatchReview) => void;
};

const ReviewsContext = createContext<ReviewsContextValue>({
  openReview: () => {},
  editReview: () => {},
});

export function useReviews() {
  return useContext(ReviewsContext);
}

type ReviewsProviderProps = {
  videoId: string;
  userId: string | null;
  userReview: WatchReview | null;
  children: ReactNode;
};

export function ReviewsProvider({
  videoId,
  userId,
  userReview,
  children,
}: ReviewsProviderProps) {
  const [open, setOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<WatchReview | null>(null);
  const [initialView, setInitialView] = useState<"info" | "form">("form");

  const openReview = useCallback(() => {
    if (userReview) {
      setEditingReview(userReview);
      setInitialView("info");
    } else {
      setEditingReview(null);
      setInitialView("form");
    }
    setOpen(true);
  }, [userReview]);

  const editReview = useCallback((review: WatchReview) => {
    setEditingReview(review);
    setInitialView("form");
    setOpen(true);
  }, []);

  const closeReview = useCallback(() => {
    setOpen(false);
    setEditingReview(null);
    setInitialView("form");
  }, []);

  return (
    <ReviewsContext.Provider value={{ openReview, editReview }}>
      {children}
      {open && (
        <ReviewModal
          editingReview={editingReview}
          initialView={initialView}
          onClose={closeReview}
          videoId={videoId}
          userId={userId}
        />
      )}
    </ReviewsContext.Provider>
  );
}
