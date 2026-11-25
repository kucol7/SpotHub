"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, Check, CircleUserRound, MessageSquare, Pencil, Star } from "lucide-react";
import type { WatchReview } from "../lib/watch";
import { useReviews } from "./reviews-context";
import ReviewLikeButton from "./ReviewLikeButton";

type SortMode = "newest" | "oldest" | "rating";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Najnowsze" },
  { value: "rating", label: "Najwyżej oceniane" },
  { value: "oldest", label: "Najstarsze" },
];

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function ReviewsSection({
  reviews,
  currentUserId,
}: {
  reviews: WatchReview[];
  currentUserId: string | null;
}) {
  const [sort, setSort] = useState<SortMode>("newest");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openReview, editReview } = useReviews();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sorted = [...reviews].sort((a, b) => {
    if (sort === "rating") {
      return b.rating - a.rating;
    }
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });

  if (reviews.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/50 px-6 py-10 text-center">
        <MessageSquare className="h-10 w-10 text-neutral-600" />
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
          Ten film nie ma jeszcze recenzji, bądź pierwszą osobą która go oceni!
        </p>
        <button
          type="button"
          onClick={() => openReview()}
          className="mt-5 rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
        >
          Napisz recenzję
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          {reviews.length}{" "}
          {reviews.length === 1 ? "Recenzja" : "Recenzje"}
        </h3>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-neutral-400 transition-colors hover:text-white"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <ArrowDownUp className="h-4 w-4" />
            Sortuj
          </button>

          {open && (
            <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-neutral-800 bg-neutral-900 py-1 shadow-lg">
              {SORT_OPTIONS.map((option) => {
                const active = option.value === sort;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSort(option.value);
                      setOpen(false);
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

      <div className="mt-4 space-y-6">
        {sorted.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Brak recenzji. Bądź pierwszy!
          </p>
        ) : (
          sorted.map((review) => {
            const isOwn =
              currentUserId !== null && review.userId === currentUserId;

            const authorUsername = review.username.trim();
            const authorHref =
              currentUserId !== null && review.userId === currentUserId
                ? "/profile/me"
                : authorUsername
                  ? `/profile/${encodeURIComponent(authorUsername)}`
                  : null;

            const authorContent = (
              <>
                {review.avatarUrl ? (
                  <img
                    src={review.avatarUrl}
                    alt={`Awatar użytkownika ${review.nickname}`}
                    className="h-8 w-8 shrink-0 rounded-full border border-neutral-800 object-cover transition-opacity group-hover:opacity-80"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-800">
                    <CircleUserRound className="h-4 w-4 text-neutral-500" />
                  </div>
                )}
                <span className="truncate text-sm font-medium text-white transition-colors group-hover:text-purple-400">
                  {review.nickname}
                </span>
              </>
            );

            return (
              <article key={review.id} className="w-full min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {authorHref ? (
                      <Link
                        href={authorHref}
                        title={`Zobacz profil: ${review.nickname}`}
                        className="group flex min-w-0 items-center gap-2.5"
                      >
                        {authorContent}
                      </Link>
                    ) : (
                      <div className="flex min-w-0 items-center gap-2.5">
                        {authorContent}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => editReview(review)}
                        aria-label="Edytuj recenzję"
                        title="Edytuj recenzję"
                        className="text-neutral-400 transition-colors hover:text-purple-400"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-white">
                        {review.rating.toFixed(1)}
                      </span>
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    </div>
                  </div>
                </div>

                {review.content.trim().length > 0 && (
                  <p className="mt-2 w-full min-w-0 break-words whitespace-pre-line text-sm text-neutral-300 [overflow-wrap:anywhere]">
                    {review.content}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    {formatReviewDate(review.createdAt)}
                  </span>

                  <ReviewLikeButton
                    reviewId={review.id}
                    initialCount={review.likeCount}
                    initialIsLiked={review.isLiked}
                    isAuthenticated={currentUserId !== null}
                    userId={currentUserId}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
