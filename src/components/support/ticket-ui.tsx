import { useEffect, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Shield,
  StickyNote,
  Timer,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EscalationLevel,
  RefundRecommendation,
  SupportAttachment,
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketRequesterRole,
  TicketResolution,
  TicketStatus,
  TicketTimelineEvent,
} from "@/domain/types";

/* ──────────────────────────── Identity badge ──────────────────────────── */

export function IdentityBadge({
  role,
  name,
  email,
  size = "sm",
}: {
  role: TicketRequesterRole;
  name: string;
  email?: string;
  size?: "xs" | "sm" | "md";
}) {
  const Icon = role === "provider" ? Briefcase : UserIcon;
  const tone =
    role === "provider"
      ? "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300"
      : "bg-sky-500/10 text-sky-700 ring-sky-500/30 dark:text-sky-300";
  const dims =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5 gap-1"
      : size === "md"
        ? "text-sm px-2.5 py-1 gap-1.5"
        : "text-xs px-2 py-0.5 gap-1";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={cn("inline-flex items-center rounded-full ring-1 font-medium", tone, dims)}>
      <span className="grid h-4 w-4 place-items-center rounded-full bg-background/60 text-[9px] font-bold">
        {initials || <Icon className="h-2.5 w-2.5" />}
      </span>
      <span className="truncate max-w-[160px]">{name}</span>
      {email && size !== "xs" && (
        <span className="hidden text-[10px] opacity-70 md:inline">· {email}</span>
      )}
    </span>
  );
}

/* ─────────────────────────────── Priority ─────────────────────────────── */

const PRIORITY_TONE: Record<TicketPriority, string> = {
  urgent: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
  high: "bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300",
  normal: "bg-sky-500/10 text-sky-700 ring-sky-500/30 dark:text-sky-300",
  low: "bg-muted text-muted-foreground ring-border",
};

export function PriorityTag({ priority }: { priority: TicketPriority }) {
  const Icon = priority === "urgent" ? AlertOctagon : priority === "high" ? AlertTriangle : Timer;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
        PRIORITY_TONE[priority],
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {priority}
    </span>
  );
}

/* ─────────────────────────────── Status ──────────────────────────────── */

const STATUS_TONE: Record<TicketStatus, string> = {
  open: "bg-primary/15 text-primary ring-primary/30",
  pending: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  in_progress: "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
  escalated: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
  resolved: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  closed: "bg-muted text-muted-foreground ring-border",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Pending reply",
  in_progress: "In progress",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
        STATUS_TONE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ───────────────────────────── Category ──────────────────────────────── */

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  booking: "Booking",
  payment: "Payment",
  refund: "Refund",
  provider_quality: "Provider quality",
  account: "Account",
  safety: "Safety",
  other: "Other",
};

export function CategoryChip({ category }: { category: TicketCategory }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {CATEGORY_LABEL[category]}
    </span>
  );
}

/* ─────────────────────────── Escalation badge ────────────────────────── */

const ESC_TONE: Record<EscalationLevel, string> = {
  none: "bg-muted text-muted-foreground ring-border",
  tier1: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  tier2: "bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300",
  leadership: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
};

const ESC_LABEL: Record<EscalationLevel, string> = {
  none: "No escalation",
  tier1: "Tier 1",
  tier2: "Tier 2",
  leadership: "Leadership",
};

export function EscalationBadge({ level }: { level: EscalationLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
        ESC_TONE[level],
      )}
    >
      <ArrowUpCircle className="h-2.5 w-2.5" />
      {ESC_LABEL[level]}
    </span>
  );
}

/* ──────────────────────────── SLA timer UI ───────────────────────────── */

function formatRemaining(ms: number): string {
  const abs = Math.abs(ms);
  const mins = Math.floor(abs / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rm = mins % 60;
  if (hrs < 24) return rm ? `${hrs}h ${rm}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const rh = hrs % 24;
  return rh ? `${days}d ${rh}h` : `${days}d`;
}

export function SlaTimer({
  dueAt,
  metAt,
  label,
  compact = false,
}: {
  dueAt: string;
  metAt?: string | null;
  label: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const due = new Date(dueAt).getTime();

  if (metAt) {
    const met = new Date(metAt).getTime();
    const onTime = met <= due;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1",
          onTime
            ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300"
            : "bg-rose-500/10 text-rose-700 ring-rose-500/30 dark:text-rose-300",
        )}
        title={`${label}: ${onTime ? "met" : "missed"} on ${new Date(met).toLocaleString()}`}
      >
        <CheckCircle2 className="h-3 w-3" />
        {compact ? (onTime ? "On time" : "Breached") : `${label} ${onTime ? "met" : "breached"}`}
      </span>
    );
  }

  const remaining = due - now;
  const breached = remaining < 0;
  const warning = !breached && remaining < 30 * 60_000;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1",
        breached
          ? "bg-rose-500/10 text-rose-700 ring-rose-500/30 dark:text-rose-300 animate-pulse"
          : warning
            ? "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300"
            : "bg-muted text-muted-foreground ring-border",
      )}
      title={`${label} due ${new Date(due).toLocaleString()}`}
    >
      <Clock className="h-3 w-3" />
      {compact
        ? breached
          ? `-${formatRemaining(remaining)}`
          : formatRemaining(remaining)
        : breached
          ? `${label} breached by ${formatRemaining(remaining)}`
          : `${label} in ${formatRemaining(remaining)}`}
    </span>
  );
}

/* ───────────────────────── Refund recommendation ─────────────────────── */

const REFUND_TONE: Record<RefundRecommendation, string> = {
  none: "bg-muted text-muted-foreground ring-border",
  partial: "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  full: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
};

export function RefundRecommendationCard({
  recommendation,
  amount,
  currency = "BDT",
}: {
  recommendation: RefundRecommendation;
  amount?: number;
  currency?: string;
}) {
  const label =
    recommendation === "none"
      ? "No refund recommended"
      : recommendation === "partial"
        ? "Partial refund recommended"
        : "Full refund recommended";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        Refund recommendation
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase ring-1",
              REFUND_TONE[recommendation],
            )}
          >
            {label}
          </div>
          {recommendation !== "none" && typeof amount === "number" && (
            <div className="mt-2 text-2xl font-bold">
              {currency} {amount.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Attachment preview UI ─────────────────────── */

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentGrid({ items }: { items: SupportAttachment[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-xs text-muted-foreground">
        No attachments yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((a) => {
        const isImage = a.mimeType.startsWith("image/");
        return (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-soft"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              {isImage ? (
                <img
                  src={a.url}
                  alt={a.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <FileText className="h-8 w-8 text-muted-foreground/60" />
                </div>
              )}
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
                {isImage ? <ImageIcon className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                {a.mimeType.split("/")[1]?.toUpperCase()}
              </span>
            </div>
            <div className="p-2">
              <div className="truncate text-xs font-medium" title={a.name}>
                {a.name}
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{fmtSize(a.size)}</span>
                <span>{new Date(a.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Dispute timeline ────────────────────────── */

const TIMELINE_ICON: Record<TicketTimelineEvent["kind"], typeof Clock> = {
  created: MessageSquare,
  assigned: UserIcon,
  status_change: TrendingUp,
  priority_change: AlertTriangle,
  escalated: ArrowUpCircle,
  note: StickyNote,
  message_in: MessageSquare,
  message_out: MessageSquare,
  refund_proposed: Shield,
  refund_approved: CheckCircle2,
  refund_rejected: AlertOctagon,
  resolved: CheckCircle2,
  reopened: TrendingUp,
};

const TIMELINE_TONE: Record<TicketTimelineEvent["kind"], string> = {
  created: "bg-primary/10 text-primary",
  assigned: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  status_change: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  priority_change: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
  escalated: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  note: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  message_in: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  message_out: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  refund_proposed: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  refund_approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  refund_rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  reopened: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
};

export function DisputeTimeline({ events }: { events: TicketTimelineEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-xs text-muted-foreground">
        No timeline events yet.
      </div>
    );
  }
  return (
    <ol className="relative space-y-4 pl-6">
      <span
        aria-hidden
        className="absolute left-2 top-2 bottom-2 w-px bg-border"
      />
      {sorted.map((e) => {
        const Icon = TIMELINE_ICON[e.kind];
        return (
          <li key={e.id} className="relative">
            <span
              className={cn(
                "absolute -left-[18px] grid h-5 w-5 place-items-center rounded-full ring-2 ring-background",
                TIMELINE_TONE[e.kind],
              )}
            >
              <Icon className="h-3 w-3" />
            </span>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold">{e.actor}</span>
                <span className="text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">{e.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ──────────────────────────── Internal notes ─────────────────────────── */

export function InternalNotes({
  notes,
  onAdd,
}: {
  notes: SupportTicket["internalNotes"];
  onAdd: (body: string) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    try {
      await onAdd(body);
      setDraft("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        <StickyNote className="h-3.5 w-3.5" />
        Internal notes (admins only)
      </div>
      <ul className="space-y-2">
        {notes.length === 0 && (
          <li className="text-xs text-muted-foreground">No internal notes yet.</li>
        )}
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-amber-500/20 bg-background/60 p-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold">{n.authorName}</span>
              <span className="text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a note for your team…"
          className="flex-1 resize-none rounded-lg border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !draft.trim()}
          className="self-start rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Adding…" : "Add note"}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Resolution summary ────────────────────────── */

const OUTCOME_LABEL: Record<TicketResolution["outcome"], string> = {
  fixed: "Issue fixed",
  refunded: "Refund issued",
  compensated: "Goodwill credit",
  no_action: "No action needed",
  escalated: "Escalated externally",
};

export function ResolutionSummary({ resolution }: { resolution: TicketResolution }) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Resolution
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-bold uppercase text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
          {OUTCOME_LABEL[resolution.outcome]}
        </span>
        <span className="text-muted-foreground">
          by {resolution.resolvedByName} · {new Date(resolution.resolvedAt).toLocaleString()}
        </span>
        {resolution.satisfactionRating && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
            CSAT {resolution.satisfactionRating}/5
          </span>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm">{resolution.summary}</p>
    </div>
  );
}
