import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "default",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  variant?: "default" | "compact";
}) {
  const compact = variant === "compact";
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/40 text-center backdrop-blur-sm",
        compact ? "px-5 py-10" : "px-6 py-16 md:py-20",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-50"
      />
      <div className="relative">
        <div className="relative mb-4 grid place-items-center">
          <span className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-2xl" />
          <span
            className={cn(
              "grid place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow",
              compact ? "h-11 w-11" : "h-14 w-14",
            )}
          >
            <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
          </span>
        </div>
        <h3 className={cn("font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>
          {title}
        </h3>
        {description && (
          <p className="mx-auto mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {(action || secondaryAction) && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadingState({
  rows = 5,
  className,
  label,
}: {
  rows?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-live="polite">
      {label && (
        <div className="sr-only">{label}</div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-3 w-1/3 rounded" />
            <div className="skeleton-shimmer h-2.5 w-2/3 rounded" />
          </div>
          <div className="skeleton-shimmer hidden h-7 w-20 rounded sm:block" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  icon: Icon,
  title = "Something went wrong",
  description = "We couldn't load this section. Please try again.",
  action,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      {Icon && (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
