import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
 * StatTile — premium dashboard KPI card
 * ─────────────────────────────────────────────────────── */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  tone?: "default" | "success" | "warning" | "danger" | "primary";
}) {
  const toneMap = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft ring-inset-soft transition-all hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight md:text-[26px]">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneMap[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {trend && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            trend.positive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {trend.positive ? "▲" : "▼"} {trend.value}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * SectionCard — generic premium card wrapper
 * ─────────────────────────────────────────────────────── */
export function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-soft ring-inset-soft", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              {title && <div className="truncate text-sm font-semibold">{title}</div>}
              {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * StatusPill
 * ─────────────────────────────────────────────────────── */
export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "primary";
}) {
  const map = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold", map[tone])}>
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
 * SectionTabs — quick tab strip for grouped settings
 * ─────────────────────────────────────────────────────── */
export function SectionTabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string; icon?: LucideIcon; count?: number }[];
}) {
  return (
    <div className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span
                className={cn(
                  "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * SettingsRow — label + description + control
 * ─────────────────────────────────────────────────────── */
export function SettingsRow({
  title,
  description,
  control,
  className,
}: {
  title: string;
  description?: string;
  control: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start justify-between gap-3 border-b border-border/60 py-4 last:border-0 sm:flex-row sm:items-center", className)}>
      <div className="min-w-0 flex-1 pr-4">
        <div className="text-sm font-semibold">{title}</div>
        {description && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      <div className="w-full shrink-0 sm:w-auto">{control}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * ComingSoonBadge — quick UI marker for placeholder features
 * ─────────────────────────────────────────────────────── */
export function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
      Coming soon
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
 * AdminLink card list — used on group landing pages
 * ─────────────────────────────────────────────────────── */
export function GroupLinkCard({
  to,
  icon: Icon,
  title,
  description,
  meta,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold">{title}</div>
          {meta && (
            <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {meta}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</div>
      </div>
    </Link>
  );
}
