import { Star } from "lucide-react";

type StarRatingProps = {
  value: number; // 0..5, obsługuje wartości ułamkowe (np. 3.5)
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Pięć gwiazdek z obsługą ułamkowych wartości.
 *
 * Szare (puste) gwiazdki stanowią tło, a żółte (wypełnione) są nakładane
 * w pozycjonowanym absolutnie kontenerze o szerokości proporcjonalnej do oceny
 * i przycinane przez `overflow-hidden`.
 */
export default function StarRating({
  value,
  size = "md",
  className = "",
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0));
  const percent = (clamped / 5) * 100;
  const starClass = SIZE_CLASSES[size];

  return (
    <span
      className={`relative inline-flex shrink-0 align-middle ${className}`}
      role="img"
      aria-label={`Ocena ${clamped.toFixed(1)} na 5`}
    >
      <span className="flex gap-0.5 text-neutral-700">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className={`${starClass} shrink-0 fill-current`} />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${percent}%` }}
      >
        <span className="flex gap-0.5 text-yellow-500">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={`${starClass} shrink-0 fill-current`} />
          ))}
        </span>
      </span>
    </span>
  );
}
