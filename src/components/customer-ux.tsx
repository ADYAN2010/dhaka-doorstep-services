/**
 * Customer UX — premium dashboard modules for the customer side.
 *
 * Self-contained components composed into the existing customer dashboard.
 * Pure presentational on top of data passed in from the parent route — no fetching here.
 */

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, Calendar, Check, CheckCircle2, ChevronRight, Clock, CreditCard,
  GitCompare, Heart, HeartOff, Loader2, MapPin, MessageCircle, RefreshCw,
  Search, Send, ShieldCheck, Sparkles, Star, Trash2, TrendingUp, Wallet, X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findArea } from "@/data/areas";
import { categories as ALL_CATEGORIES } from "@/data/categories";
import {
  useFavoriteServices, type FavoriteService,
} from "@/hooks/use-favorite-services";
import { useRecentlyViewed, type RecentService } from "@/hooks/use-recently-viewed";

/* ─────────────────────────────────────────────────────────────── Types ── */

export type CustomerBookingStatus = "new" | "confirmed" | "assigned" | "completed" | "cancelled";

export type CustomerBooking = {
  id: string;
  category: string;
  service: string | null;
  area: string;
  preferred_date: string;
  preferred_time_slot: string;
  budget_range: string | null;
  status: CustomerBookingStatus;
  created_at: string;
  provider_id: string | null;
};

export type CustomerProvider = {
  id: string;
  full_name: string;
  area: string | null;
  avatar_url: string | null;
};

export type CustomerPayment = {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  created_at: string;
};

/* ════════════════════════ 1) Booking timeline UI (compact) ══════════════════════ */

const STAGES = [
  { key: "new",       label: "Submitted",        icon: Sparkles },
  { key: "confirmed", label: "Confirmed",        icon: CheckCircle2 },
  { key: "assigned",  label: "Provider on the way", icon: Clock },
  { key: "completed", label: "Completed",        icon: Check },
] as const;

export function CompactBookingTimeline({ status }: { status: CustomerBookingStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="font-semibold">Booking cancelled</span>
      </div>
    );
  }
  const activeIndex = STAGES.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-1.5">
      {STAGES.map((s, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex flex-1 items-center gap-1.5">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                done && "border-success bg-success text-success-foreground",
                current && "border-primary bg-primary text-primary-foreground shadow-soft",
                !done && !current && "border-border bg-card text-muted-foreground",
              )}
              title={s.label}
            >
              {current && s.key === "assigned"
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Icon className="h-3 w-3" />}
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  done ? "bg-success" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════ 2) Live status tracker card ══════════════════════ */

export function BookingStatusTrackerCard({
  booking, providerName,
}: {
  booking: CustomerBooking;
  providerName?: string;
}) {
  const meta = statusMeta(booking.status);
  return (
    <div className={cn("rounded-2xl border p-4 transition-all hover:shadow-soft", meta.cardClass)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold", meta.badgeClass)}>
              <meta.icon className="h-3 w-3" /> {meta.label}
            </span>
            <span className="text-xs text-muted-foreground">#{booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <p className="mt-2 truncate text-sm font-bold text-foreground">{booking.service ?? booking.category}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Date(booking.preferred_date).toLocaleDateString()} · {booking.preferred_time_slot} · {findArea(booking.area)?.name ?? booking.area}
          </p>
          {providerName && (
            <p className="mt-1 text-xs text-foreground">
              <span className="text-muted-foreground">Provider:</span> <span className="font-semibold">{providerName}</span>
            </p>
          )}
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/booking-status/$id" params={{ id: booking.id }}>
            Track <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className="mt-4">
        <CompactBookingTimeline status={booking.status} />
      </div>
    </div>
  );
}

function statusMeta(s: CustomerBookingStatus) {
  switch (s) {
    case "new":
      return { label: "Submitted", icon: Sparkles, cardClass: "border-primary/20 bg-primary/[0.03]", badgeClass: "bg-primary/15 text-primary" };
    case "confirmed":
      return { label: "Confirmed", icon: CheckCircle2, cardClass: "border-primary/20 bg-primary/[0.03]", badgeClass: "bg-primary/15 text-primary" };
    case "assigned":
      return { label: "Provider on the way", icon: Clock, cardClass: "border-primary/30 bg-primary/[0.06] shadow-soft", badgeClass: "bg-primary text-primary-foreground" };
    case "completed":
      return { label: "Completed", icon: Check, cardClass: "border-success/30 bg-success/5", badgeClass: "bg-success/15 text-success" };
    case "cancelled":
      return { label: "Cancelled", icon: XCircle, cardClass: "border-destructive/20 bg-destructive/5", badgeClass: "bg-destructive/15 text-destructive" };
  }
}

/* ════════════════════════ 3) Rebook action ══════════════════════ */

export function rebookHref(b: Pick<CustomerBooking, "category" | "service" | "area">) {
  // Carries previous selections into the booking form via querystring.
  const qs = new URLSearchParams();
  if (b.category) qs.set("category", b.category);
  if (b.service)  qs.set("service",  b.service);
  if (b.area)     qs.set("area",     b.area);
  return `/book?${qs.toString()}`;
}

export function RebookButton({ booking, size = "sm" }: { booking: CustomerBooking; size?: "sm" | "default" }) {
  return (
    <Button asChild size={size} variant="outline">
      <a href={rebookHref(booking)}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Rebook
      </a>
    </Button>
  );
}

/* ════════════════════════ 4) Compare providers UI ══════════════════════ */

export function CompareProvidersPanel({
  providers,
  initialSelected = [],
}: {
  providers: { id: string; full_name: string; area: string | null; avatar_url: string | null; rating?: number; reviews?: number; jobs?: number; responseTime?: string }[];
  initialSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected.slice(0, 3));
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) => p.full_name.toLowerCase().includes(q));
  }, [providers, query]);

  function toggle(id: string) {
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= 3) {
        toast.info("You can compare up to 3 providers at a time.");
        return s;
      }
      return [...s, id];
    });
  }

  const chosen = providers.filter((p) => selected.includes(p.id));

  if (providers.length === 0) {
    return (
      <Empty
        icon={GitCompare}
        title="Save providers to compare them"
        hint="Tap the heart on any provider to add them to your saved list, then come back here to compare side by side."
        ctaTo="/providers"
        ctaLabel="Browse providers"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter saved providers" className="pl-9" />
        </div>
        <p className="text-xs text-muted-foreground">{selected.length}/3 selected</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const active = selected.includes(p.id);
          const initials = (p.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft",
                active ? "border-primary ring-2 ring-primary/30" : "border-border",
              )}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center">{initials}</span>}
                {active && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{p.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.area ? findArea(p.area)?.name ?? p.area : "Coverage area"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {chosen.length >= 2 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-1/4 p-3 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Compare</th>
                {chosen.map((p) => (
                  <th key={p.id} className="p-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-primary text-[10px] font-bold text-primary-foreground">
                        {p.avatar_url
                          ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                          : <span className="flex h-full w-full items-center justify-center">{(p.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}</span>}
                      </div>
                      <span className="truncate font-semibold text-foreground">{p.full_name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <CompareRow label="Rating" cells={chosen.map((p) => (
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {p.rating?.toFixed(1) ?? "—"}
                </span>
              ))} />
              <CompareRow label="Reviews" cells={chosen.map((p) => <span className="text-foreground">{p.reviews ?? 0}</span>)} />
              <CompareRow label="Jobs done" cells={chosen.map((p) => <span className="text-foreground">{p.jobs ?? "—"}</span>)} />
              <CompareRow label="Response" cells={chosen.map((p) => <span className="text-foreground">{p.responseTime ?? "Within 1 hr"}</span>)} />
              <CompareRow label="Coverage" cells={chosen.map((p) => <span className="text-foreground">{p.area ? findArea(p.area)?.name ?? p.area : "—"}</span>)} />
              <CompareRow label="" cells={chosen.map((p) => (
                <Button asChild size="sm">
                  <Link to="/p/$id" params={{ id: p.id }}>View profile <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              ))} />
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          Select at least 2 providers above to see them side by side.
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, cells }: { label: string; cells: ReactNode[] }) {
  return (
    <tr>
      <td className="p-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</td>
      {cells.map((c, i) => <td key={i} className="p-3 text-sm">{c}</td>)}
    </tr>
  );
}

/* ════════════════════════ 5) Service favorites ══════════════════════ */

export function FavoriteServicesPanel() {
  const { items, remove } = useFavoriteServices();

  if (items.length === 0) {
    return (
      <Empty
        icon={Heart}
        title="No favourite services yet"
        hint="Tap the heart on any service to save it here for one-tap booking next time."
        ctaTo="/services"
        ctaLabel="Browse services"
      />
    );
  }

  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {items.map((s) => <FavoriteServiceRow key={s.slug} item={s} onRemove={() => remove(s.slug)} />)}
    </ul>
  );
}

function FavoriteServiceRow({ item, onRemove }: { item: FavoriteService; onRemove: () => void }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Heart className="h-4 w-4 fill-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.category}{item.startingPrice ? ` · from ৳${item.startingPrice.toLocaleString()}` : ""}
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <a href={`/book?category=${item.categorySlug}&service=${encodeURIComponent(item.name)}`}>Book</a>
      </Button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1.5 text-muted-foreground opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100"
        aria-label="Remove favourite"
      >
        <HeartOff className="h-4 w-4" />
      </button>
    </li>
  );
}

/** Reusable heart toggle for use on service cards / detail pages. */
export function ServiceFavoriteHeart({
  slug, name, categorySlug, category, startingPrice, className,
}: { slug: string; name: string; categorySlug: string; category: string; startingPrice?: number; className?: string }) {
  const { isFavorite, toggle } = useFavoriteServices();
  const fav = isFavorite(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        const now = toggle({ slug, name, categorySlug, category, startingPrice });
        toast.success(now ? "Saved to favourites" : "Removed from favourites");
      }}
      aria-pressed={fav}
      aria-label={fav ? "Remove from favourites" : "Save to favourites"}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all",
        fav ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", fav && "fill-primary")} />
    </button>
  );
}

/* ════════════════════════ 6) Smart review submission flow ══════════════════════ */

const REVIEW_TAGS_BY_RATING: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  5: ["On time", "Friendly", "Great quality", "Fair price", "Would book again"],
  4: ["On time", "Good quality", "Polite", "Fair price"],
  3: ["Average work", "Acceptable", "Could be better"],
  2: ["Late", "Quality issues", "Poor communication"],
  1: ["Did not arrive", "Bad quality", "Unprofessional", "Overcharged"],
};

export function SmartReviewDialog({
  open, onOpenChange, booking, providerName, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  booking: CustomerBooking | null;
  providerName?: string;
  onSubmit: (input: { rating: 1 | 2 | 3 | 4 | 5; tags: string[]; comment: string }) => Promise<void> | void;
}) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | 0>(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // reset on close / open
  useEffect(() => {
    if (!open) {
      setRating(0); setHover(0); setTags([]); setComment(""); setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const tagPool = rating >= 1 ? REVIEW_TAGS_BY_RATING[rating as 1 | 2 | 3 | 4 | 5] : [];

  function toggleTag(t: string) {
    setTags((current) => current.includes(t) ? current.filter((x) => x !== t) : [...current, t]);
  }

  async function handleSubmit() {
    if (rating === 0) { toast.error("Please tap a star to rate."); return; }
    setSubmitting(true);
    try {
      await onSubmit({ rating: rating as 1 | 2 | 3 | 4 | 5, tags, comment: comment.trim() });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => !submitting && onOpenChange(false)} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-border bg-card shadow-soft sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Leave a review</p>
            <h3 className="mt-0.5 text-base font-bold text-foreground">{providerName ?? "Your provider"}</h3>
            {booking && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {booking.service ?? booking.category} · {new Date(booking.preferred_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <button type="button" onClick={() => !submitting && onOpenChange(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Star rating */}
          <div>
            <p className="mb-2 text-center text-sm font-semibold text-foreground">How was the service?</p>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hover || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setRating(n as 1 | 2 | 3 | 4 | 5); setTags([]); }}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="rounded-full p-1 transition-transform hover:scale-110 active:scale-95"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  >
                    <Star className={cn("h-9 w-9 transition-colors", active ? "fill-warning text-warning" : "text-muted-foreground/40")} />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <p className="mt-2 text-center text-sm font-medium text-foreground">
                {rating === 5 ? "Amazing! 🎉" : rating === 4 ? "Good 👍" : rating === 3 ? "Okay" : rating === 2 ? "Below expectations" : "Disappointed"}
              </p>
            )}
          </div>

          {/* Tag chips */}
          {tagPool.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What stood out?</p>
              <div className="flex flex-wrap gap-2">
                {tagPool.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/40",
                      )}
                    >
                      {active && <Check className="h-3 w-3" />} {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment */}
          {rating > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add a comment <span className="font-normal text-muted-foreground/80">(optional)</span></p>
              <textarea
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  rating >= 4
                    ? "Tell others what made this great…"
                    : "Help us improve — what went wrong?"
                }
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
              <p className="mt-1 text-right text-[10px] text-muted-foreground">{comment.length}/500</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            <ShieldCheck className="mr-1 inline h-3 w-3 text-primary" /> Reviews are public and verified.
          </p>
          <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Submit review
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ 7) Support request flow ══════════════════════ */

type SupportTopic = "booking" | "payment" | "provider" | "account" | "other";

const SUPPORT_TOPICS: { value: SupportTopic; label: string }[] = [
  { value: "booking",  label: "Booking issue" },
  { value: "payment",  label: "Payment / refund" },
  { value: "provider", label: "Provider behaviour" },
  { value: "account",  label: "Account & login" },
  { value: "other",    label: "Something else" },
];

export type CustomerSupportTicket = {
  id: string;
  subject: string;
  topic: SupportTopic;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  lastMessage: string;
};

export function SupportRequestPanel({
  bookings, initialTickets,
}: {
  bookings: CustomerBooking[];
  initialTickets?: CustomerSupportTicket[];
}) {
  const [tickets, setTickets] = useState<CustomerSupportTicket[]>(initialTickets ?? []);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<SupportTopic>("booking");
  const [bookingId, setBookingId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTopic("booking"); setBookingId(""); setSubject(""); setBody("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Please add a subject and a description.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const id = `TCK-${2000 + Math.floor(Math.random() * 9000)}`;
      setTickets((t) => [{
        id, subject, topic,
        status: "open",
        createdAt: new Date().toISOString(),
        lastMessage: "We've received your request — typical reply within 4 hours.",
      }, ...t]);
      reset();
      setOpen(false);
      setSubmitting(false);
      toast.success("Support request sent", { description: `Ticket ${id} — we'll follow up shortly.` });
    }, 600);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Get help with bookings, payments and providers.</p>
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="mr-1.5 h-3.5 w-3.5" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
          {open ? "Close" : "New request"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-background p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Topic">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as SupportTopic)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {SUPPORT_TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Related booking (optional)">
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">— None —</option>
                {bookings.slice(0, 25).map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id.slice(0, 6).toUpperCase()} · {b.service ?? b.category}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Subject">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary of your issue"
              maxLength={120}
            />
          </Field>
          <Field label="Describe your issue">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Include dates, times, and any relevant details. Our team replies within 4 hours."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3 w-3 text-primary" /> Your conversation is private.
            </p>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Send to support
            </Button>
          </div>
        </form>
      )}

      {tickets.length === 0 ? (
        <Empty
          icon={MessageCircle}
          title="No support requests"
          hint="When you submit a request, it'll appear here with status updates."
        />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {tickets.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground">{t.id}</span>
                  <p className="truncate text-sm font-semibold text-foreground">{t.subject}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {SUPPORT_TOPICS.find((x) => x.value === t.topic)?.label} · {new Date(t.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{t.lastMessage}</p>
              </div>
              <span className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                t.status === "resolved"    && "bg-success/15 text-success",
                t.status === "in_progress" && "bg-primary/10 text-primary",
                t.status === "open"        && "bg-warning/15 text-warning",
              )}>
                {t.status.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ════════════════════════ 8) Polished payment history ══════════════════════ */

const METHOD_META: Record<string, { label: string; tone: string }> = {
  cash:          { label: "Cash",          tone: "bg-muted text-foreground" },
  card:          { label: "Card",          tone: "bg-primary/10 text-primary" },
  bkash:         { label: "bKash",         tone: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  nagad:         { label: "Nagad",         tone: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  bank_transfer: { label: "Bank transfer", tone: "bg-primary/10 text-primary" },
  other:         { label: "Other",         tone: "bg-muted text-foreground" },
};

export function PaymentHistoryView({
  payments, bookings,
}: {
  payments: CustomerPayment[];
  bookings: CustomerBooking[];
}) {
  const bookingMap = useMemo(() => Object.fromEntries(bookings.map((b) => [b.id, b])), [bookings]);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "refunded">("all");

  const filtered = useMemo(
    () => filter === "all" ? payments : payments.filter((p) => p.status === filter),
    [payments, filter],
  );

  const totals = useMemo(() => {
    const paid     = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    const pending  = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
    const refunded = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + Number(p.amount), 0);
    return { paid, pending, refunded };
  }, [payments]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryStat label="Total paid"   value={`৳${totals.paid.toLocaleString()}`}     icon={CheckCircle2} tone="success" />
        <SummaryStat label="Pending"      value={`৳${totals.pending.toLocaleString()}`}  icon={Clock}        tone="warning" />
        <SummaryStat label="Refunded"     value={`৳${totals.refunded.toLocaleString()}`} icon={RefreshCw}    tone="muted" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "paid", "pending", "refunded"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {f === "all" ? "All payments" : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={CreditCard}
          title={filter === "all" ? "No payments yet" : `No ${filter} payments`}
          hint="When a payment is recorded for one of your bookings, the receipt will show up here."
        />
      ) : (
        <>
          {/* Mobile card list */}
          <ul className="space-y-2 sm:hidden">
            {filtered.map((p) => {
              const b = bookingMap[p.booking_id];
              const method = METHOD_META[p.method] ?? METHOD_META.other;
              return (
                <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{b?.service ?? b?.category ?? "Service"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="text-base font-bold text-foreground">
                      {p.currency === "BDT" ? "৳" : `${p.currency} `}{Number(p.amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", method.tone)}>
                      {method.label}
                    </span>
                    <PaymentStatusChip status={p.status} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card sm:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Service</th>
                  <th className="p-3 font-semibold">Method</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const b = bookingMap[p.booking_id];
                  const method = METHOD_META[p.method] ?? METHOD_META.other;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-muted/20">
                      <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-foreground">{b?.service ?? b?.category ?? "Service"}</td>
                      <td className="p-3">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", method.tone)}>
                          {method.label}
                        </span>
                      </td>
                      <td className="p-3"><PaymentStatusChip status={p.status} /></td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {p.currency === "BDT" ? "৳" : `${p.currency} `}{Number(p.amount).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentStatusChip({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
      status === "paid"     && "bg-success/15 text-success",
      status === "pending"  && "bg-warning/15 text-warning",
      status === "failed"   && "bg-destructive/15 text-destructive",
      status === "refunded" && "bg-muted text-foreground",
    )}>
      {status}
    </span>
  );
}

/* ════════════════════════ 9) Personalized recommended services ══════════════════════ */

export function RecommendedServicesPanel({ bookings }: { bookings: CustomerBooking[] }) {
  const recommendations = useMemo(() => buildRecommendations(bookings), [bookings]);

  if (recommendations.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {recommendations.slice(0, 6).map((r) => {
        const Icon = r.icon;
        return (
          <Link
            key={r.slug}
            to="/services/$category"
            params={{ category: r.categorySlug }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", r.accent ?? "bg-primary/10 text-primary")}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.tagline}</p>
                </div>
              </div>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                {r.reasonShort}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{r.reason}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
              Browse <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function buildRecommendations(bookings: CustomerBooking[]) {
  // Priority: 1) categories the user has booked before (rebook intent),
  // 2) complementary categories, 3) popular categories.
  const usedSlugs = new Set(bookings.map((b) => b.category));
  const usedFreq: Record<string, number> = {};
  bookings.forEach((b) => { usedFreq[b.category] = (usedFreq[b.category] ?? 0) + 1; });

  const COMPLEMENTS: Record<string, string[]> = {
    "home-cleaning":  ["pest-control", "handyman", "appliance-repair"],
    "ac-repair":      ["appliance-repair", "electrical"],
    "appliance-repair": ["electrical", "ac-repair"],
    "electrical":     ["plumbing", "ac-repair"],
    "plumbing":       ["electrical", "handyman"],
    "beauty":         ["home-cleaning"],
    "moving":         ["home-cleaning", "handyman"],
    "pest-control":   ["home-cleaning"],
  };

  type Rec = { slug: string; name: string; tagline: string; categorySlug: string; icon: ComponentType<{ className?: string }>; accent?: string; reason: string; reasonShort: string };
  const out: Rec[] = [];

  // Frequent rebookers
  Object.entries(usedFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([catSlug, freq]) => {
      const cat = ALL_CATEGORIES.find((c) => c.slug === catSlug);
      if (!cat) return;
      out.push({
        slug: cat.slug, name: cat.name, tagline: cat.tagline,
        categorySlug: cat.slug, icon: cat.icon, accent: cat.accent,
        reason: `You've booked this ${freq} time${freq > 1 ? "s" : ""} — quick rebook with one tap.`,
        reasonShort: "For you",
      });
    });

  // Complements
  for (const used of usedSlugs) {
    for (const compSlug of COMPLEMENTS[used] ?? []) {
      if (usedSlugs.has(compSlug) || out.find((x) => x.slug === compSlug)) continue;
      const cat = ALL_CATEGORIES.find((c) => c.slug === compSlug);
      if (!cat) continue;
      const usedCat = ALL_CATEGORIES.find((c) => c.slug === used);
      out.push({
        slug: cat.slug, name: cat.name, tagline: cat.tagline,
        categorySlug: cat.slug, icon: cat.icon, accent: cat.accent,
        reason: usedCat ? `Pairs well with ${usedCat.name.toLowerCase()}.` : cat.tagline,
        reasonShort: "Suggested",
      });
      if (out.length >= 6) return out;
    }
  }

  // Fill with popular
  ALL_CATEGORIES.filter((c) => c.popular && !out.find((x) => x.slug === c.slug) && !usedSlugs.has(c.slug)).forEach((cat) => {
    if (out.length >= 6) return;
    out.push({
      slug: cat.slug, name: cat.name, tagline: cat.tagline,
      categorySlug: cat.slug, icon: cat.icon, accent: cat.accent,
      reason: "Popular with customers in your area.",
      reasonShort: "Trending",
    });
  });

  return out;
}

/* ════════════════════════ 10) Recently viewed services ══════════════════════ */

export function RecentlyViewedPanel() {
  const { items, clear, remove } = useRecentlyViewed();

  if (items.length === 0) {
    return (
      <Empty
        icon={Clock}
        title="Nothing viewed yet"
        hint="Services you open will show up here for quick access."
        ctaTo="/services"
        ctaLabel="Explore services"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{items.length} recent service{items.length > 1 ? "s" : ""}</p>
        <button
          type="button"
          onClick={() => { clear(); toast.success("Recent services cleared"); }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Clear
        </button>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {items.map((s) => <RecentRow key={s.slug} item={s} onRemove={() => remove(s.slug)} />)}
      </ul>
    </div>
  );
}

function RecentRow({ item, onRemove }: { item: RecentService; onRemove: () => void }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Clock className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.category} · {timeAgo(item.viewedAt)}
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <a href={`/book?category=${item.categorySlug}&service=${encodeURIComponent(item.name)}`}>Book</a>
      </Button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1.5 text-muted-foreground opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100"
        aria-label="Remove"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ════════════════════════ Shared building blocks ══════════════════════ */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SummaryStat({ label, value, icon: Icon, tone }: {
  label: string; value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "success" | "warning" | "muted";
}) {
  const ring = tone === "success" ? "border-success/30 bg-success/5"
    : tone === "warning" ? "border-warning/30 bg-warning/5"
    : "border-border bg-card";
  const valueTone = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className={cn("rounded-2xl border p-4 shadow-soft", ring)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={cn("mt-1 text-2xl font-bold", valueTone)}>{value}</p>
    </div>
  );
}

function Empty({
  icon: Icon, title, hint, ctaTo, ctaLabel,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  ctaTo?: "/services" | "/providers" | "/book";
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>
      {ctaTo && ctaLabel && (
        <Button asChild size="sm">
          <Link to={ctaTo}>{ctaLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      )}
    </div>
  );
}

/* Re-export hooks so callers only need this one module. */
export { useFavoriteServices } from "@/hooks/use-favorite-services";
export { useRecentlyViewed }   from "@/hooks/use-recently-viewed";

/* Tiny sentinel to keep tree-shaking honest */
export const __customerUxModules = [
  "CompactBookingTimeline",
  "BookingStatusTrackerCard",
  "RebookButton",
  "CompareProvidersPanel",
  "FavoriteServicesPanel",
  "ServiceFavoriteHeart",
  "SmartReviewDialog",
  "SupportRequestPanel",
  "PaymentHistoryView",
  "RecommendedServicesPanel",
  "RecentlyViewedPanel",
  "TrendingUp", // re-used icon import
  "Wallet",
  "Calendar",
  "MapPin",
] as const;
