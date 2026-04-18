import { Heart, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useSavedProvider } from "@/hooks/use-saved-provider";
import { cn } from "@/lib/utils";

type Props = {
  providerId: string;
  className?: string;
  size?: "sm" | "md";
  /** When true, render a square icon-only button (good for cards). */
  iconOnly?: boolean;
};

/**
 * Reusable heart-to-save toggle for an approved provider.
 *
 * Stops propagation so it can sit inside a parent <Link> (e.g. a card).
 */
export function SavedHeartButton({ providerId, className, size = "sm", iconOnly }: Props) {
  const navigate = useNavigate();
  const { saved, working, toggle, signedIn } = useSavedProvider(providerId);

  const sizeCls = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const iconCls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      navigate({ to: "/login" });
      return;
    }
    toggle();
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={working}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save provider"}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border bg-background/90 backdrop-blur transition-colors",
          sizeCls,
          saved
            ? "border-primary text-primary hover:bg-primary/10"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          className,
        )}
      >
        {working ? (
          <Loader2 className={cn(iconCls, "animate-spin")} />
        ) : (
          <Heart className={cn(iconCls, saved && "fill-primary")} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={working}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        saved
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground hover:bg-muted",
        className,
      )}
    >
      {working ? (
        <Loader2 className={cn(iconCls, "animate-spin")} />
      ) : (
        <Heart className={cn(iconCls, saved && "fill-primary")} />
      )}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
