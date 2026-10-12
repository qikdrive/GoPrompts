import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Average rating with review count. Shows "New" when there are no reviews.
 * `compact` hides the count (used on cards).
 */
export function Rating({
  value,
  count,
  size = 14,
  compact = false,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  compact?: boolean;
  className?: string;
}) {
  if (count === 0) {
    return <span className={cn("text-sm font-medium text-accent", className)}>New</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star size={size} className="fill-warning text-warning" />
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && !compact && <span className="text-muted">({count})</span>}
    </span>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-warning text-warning" : "text-border"}
        />
      ))}
    </span>
  );
}
