import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number; // 0-5
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  className?: string;
};

export function StarRating({ value, onChange, size = "md", readOnly, className }: Props) {
  const sizeCls = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} role={readOnly ? "img" : "radiogroup"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= Math.round(value);
        const Icon = (
          <Star
            className={cn(
              sizeCls,
              "transition-colors",
              active ? "fill-warning text-warning" : "text-muted-foreground/40",
            )}
          />
        );
        if (readOnly) return <span key={n}>{Icon}</span>;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange?.(n)}
            className="rounded transition-transform hover:scale-110"
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}
