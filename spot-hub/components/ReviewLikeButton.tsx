"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "../lib/supabase/client";

type ReviewLikeButtonProps = {
  reviewId: string;
  initialCount: number;
  initialIsLiked: boolean;
  isAuthenticated: boolean;
  userId?: string | null;
};

export default function ReviewLikeButton({
  reviewId,
  initialCount,
  initialIsLiked,
  isAuthenticated,
  userId,
}: ReviewLikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState(initialCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function triggerPop() {
    setIsAnimating(true);
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
    }
    animationTimerRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      animationTimerRef.current = null;
    }, 300);
  }

  async function handleClick() {
    if (!isAuthenticated || !userId) {
      showToast("Zaloguj się, aby polubić recenzję");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const previousCount = count;
    const previousLiked = isLiked;
    const nextLiked = !previousLiked;
    setIsLiked(nextLiked);
    setCount(previousCount + (nextLiked ? 1 : -1));
    triggerPop();

    try {
      const supabase = createClient();

      if (nextLiked) {
        const { error } = await supabase
          .from("review_likes")
          .insert({ user_id: userId, review_id: reviewId });

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("review_likes")
          .delete()
          .eq("user_id", userId)
          .eq("review_id", reviewId);

        if (error) {
          throw error;
        }
      }
    } catch {
      setIsLiked(previousLiked);
      setCount(previousCount);
      showToast("Nie udało się zapisać polubienia. Spróbuj ponownie.");
    }
  }

  const label = isLiked ? "Usuń polubienie recenzji" : "Polub recenzję";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isLiked}
        aria-label={label}
        title={label}
        className="group flex items-center gap-1.5 text-sm"
      >
        <Heart
          className={`h-4 w-4 transition-transform duration-200 ease-out active:scale-90 ${
            isAnimating ? "scale-125" : "scale-100"
          } ${
            isLiked
              ? "fill-purple-500 text-purple-500 drop-shadow-[0_0_6px_rgba(168,85,247,0.55)]"
              : "text-neutral-400 group-hover:text-purple-400"
          }`}
        />
        <span
          className={
            isLiked ? "text-neutral-400" : "text-neutral-400"
          }
        >
          {count}
        </span>
      </button>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
