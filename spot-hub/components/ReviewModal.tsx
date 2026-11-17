"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquare, Star, X } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import type { WatchReview } from "../lib/watch";

type ReviewModalProps = {
  editingReview: WatchReview | null;
  initialView: "info" | "form";
  onClose: () => void;
  videoId: string;
  userId: string | null;
};

function clampFill(rating: number, index: number): number {
  return Math.max(0, Math.min(1, rating - index));
}

function ReviewStar({ fill, active }: { fill: number; active: boolean }) {
  return (
    <span
      className={`relative inline-block shrink-0 ${
        active ? "scale-110" : "scale-100"
      } transition-transform duration-150`}
    >
      <Star className="h-10 w-10 fill-current text-neutral-700" />
      <span
        className="absolute inset-y-0 left-0 overflow-hidden transition-all duration-150"
        style={{ width: `${fill * 100}%` }}
      >
        <Star className="h-10 w-10 fill-current text-yellow-500" />
      </span>
    </span>
  );
}

export default function ReviewModal({
  editingReview,
  initialView,
  onClose,
  videoId,
  userId,
}: ReviewModalProps) {
  const router = useRouter();
  const [view, setView] = useState<"info" | "form">(initialView);
  const [rating, setRating] = useState(editingReview?.rating ?? 5);
  const [text, setText] = useState(editingReview?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function resetAndClose() {
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      if (editingReview) {
        const { error: updateError } = await supabase
          .from("reviews")
          .update({ rating, content: text.trim() || null })
          .eq("id", editingReview.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from("reviews").insert({
          video_id: videoId,
          user_id: userId,
          rating,
          content: text.trim() || null,
        });

        if (insertError) {
          throw insertError;
        }
      }

      router.refresh();
      onClose();
    } catch {
      setError("Nie udało się zapisać recenzji. Spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeIndex = rating > 0 ? Math.ceil(rating) - 1 : -1;
  const sliderProgress = ((rating - 0.5) / 4.5) * 100;
  const submitLabel = editingReview ? "Zapisz" : "Prześlij";
  const submittingLabel = editingReview ? "Zapisywanie..." : "Wysyłanie...";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={resetAndClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Dodaj recenzję"
        className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Zamknij okno"
          className="absolute right-4 top-4 text-neutral-400 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {!userId ? (
          <div className="flex flex-col items-center gap-5 px-2 py-10 text-center">
            <MessageSquare className="h-10 w-10 text-neutral-600" />
            <p className="text-neutral-200">
              Ta funkcja jest dostępna tylko dla zalogowanych użytkowników
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
              >
                Zaloguj
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-neutral-700 bg-neutral-800 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
              >
                Zarejestruj
              </Link>
            </div>
          </div>
        ) : view === "info" && editingReview ? (
          <div className="flex flex-col items-center gap-5 px-2 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-purple-500" />
            <div>
              <p className="text-lg font-semibold text-white">
                Już oceniłeś ten film
              </p>
              <p className="mt-2 text-sm text-neutral-400">
                Twoja ocena: {editingReview.rating.toFixed(1)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-full bg-neutral-800 px-6 py-2 text-sm font-semibold text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
              >
                Zamknij
              </button>
              <button
                type="button"
                onClick={() => setView("form")}
                className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
              >
                Edytuj recenzję
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-2">
            {/* Sekcja oceny */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <ReviewStar
                    key={index}
                    fill={clampFill(rating, index)}
                    active={index === activeIndex}
                  />
                ))}
              </div>

              <input
                type="range"
                min={0.5}
                max={5}
                step={0.5}
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                aria-label="Ocena od 0.5 do 5"
                className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:ring-4 [&::-webkit-slider-thumb]:ring-purple-500/25 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:bg-purple-400 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:ring-4 [&::-moz-range-thumb]:ring-purple-500/25 [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:bg-purple-400"
                style={{
                  background: `linear-gradient(to right, #9333ea 0%, #9333ea ${sliderProgress}%, #262626 ${sliderProgress}%, #262626 100%)`,
                }}
              />

              <p className="mt-2 text-sm text-neutral-300">
                Twoja ocena:{" "}
                <span className="font-semibold text-white">
                  {rating.toFixed(1)}
                </span>
              </p>
            </div>

            {/* Treść recenzji */}
            <div className="relative mt-6">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Napisz swoją recenzję (opcjonalnie)"
                className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 p-4 pb-8 pr-16 text-sm leading-relaxed text-white placeholder:text-neutral-500 transition-colors focus:border-purple-600 focus:outline-none"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-neutral-500">
                {text.length}/500
              </span>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            {/* Przyciski akcji */}
            <div className="mt-6 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={resetAndClose}
                className="text-sm text-neutral-400 underline underline-offset-2 transition-colors hover:text-white"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? submittingLabel : submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
