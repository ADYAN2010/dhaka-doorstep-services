import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export type SummaryCard = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  accent?: "primary" | "success" | "warning" | "danger" | "neutral";
  delta?: number; // percent
  hint?: string;
};

const accentMap: Record<NonNullable<SummaryCard["accent"]>, string> = {
  primary: "border-primary/30 ring-1 ring-primary/20",
  success: "border-emerald-500/30 ring-1 ring-emerald-500/15",
  warning: "border-amber-500/30 ring-1 ring-amber-500/15",
  danger: "border-rose-500/30 ring-1 ring-rose-500/15",
  neutral: "border-border",
};

const accentText: Record<NonNullable<SummaryCard["accent"]>, string> = {
  primary: "text-primary",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
  neutral: "text-foreground",
};

export function SummaryCardsRow({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <SummaryCardItem key={c.label} card={c} />
      ))}
    </div>
  );
}

export function SummaryCardItem({ card }: { card: SummaryCard }) {
  const Icon = card.icon;
  const accent = card.accent ?? "neutral";
  const positive = (card.delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 transition-shadow hover:shadow-sm",
        accentMap[accent],
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {card.label}
        </span>
        {Icon && <Icon className={cn("h-4 w-4", accentText[accent])} />}
      </div>
      <div className={cn("text-xl font-bold leading-tight", accentText[accent])}>
        {card.value}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {typeof card.delta === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            {positive ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            {Math.abs(card.delta).toFixed(1)}%
          </span>
        ) : null}
        {card.hint && <span className="truncate">{card.hint}</span>}
      </div>
    </div>
  );
}
