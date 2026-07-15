import { cn } from "@/lib/cn";

interface TrainerRatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export function TrainerRating({
  value,
  count,
  size = "md",
  showValue = true,
  className,
}: TrainerRatingProps) {
  const starSize = size === "sm" ? "text-sm" : "text-lg";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-0.5" aria-label={`التقييم ${value} من 5`}>
        {Array.from({ length: 5 }, (_, index) => {
          const filled = value >= index + 1 - 0.25;
          const half = !filled && value > index && value < index + 1;
          return (
            <span
              key={index}
              className={cn(
                starSize,
                filled || half ? "text-gold-500" : "text-foreground-muted/40",
              )}
            >
              ★
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-semibold text-navy-900", size === "sm" ? "text-sm" : "text-base")}>
          {value.toLocaleString("ar-SA")}
        </span>
      )}
      {count !== undefined && (
        <span className="text-sm text-foreground-muted">
          ({count.toLocaleString("ar-SA")} {count === 1 ? "تقييم" : "تقييمات"})
        </span>
      )}
    </div>
  );
}
