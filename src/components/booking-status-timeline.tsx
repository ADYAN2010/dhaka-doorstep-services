import { Check, Clock, Loader2, ShieldCheck, Sparkles, UserCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type BookingStage =
  | "submitted"
  | "pending_review"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

const STAGES: {
  key: Exclude<BookingStage, "cancelled">;
  label: string;
  blurb: string;
  icon: typeof Check;
}[] = [
  { key: "submitted",      label: "Submitted",      blurb: "We received your request.",                 icon: Sparkles },
  { key: "pending_review", label: "Pending review", blurb: "Our team is verifying details.",            icon: ShieldCheck },
  { key: "assigned",       label: "Provider assigned", blurb: "A verified pro has accepted the job.",   icon: UserCheck },
  { key: "in_progress",    label: "In progress",    blurb: "Work is underway at your location.",        icon: Loader2 },
  { key: "completed",      label: "Completed",      blurb: "Job done — please rate your provider.",     icon: Check },
];

export function statusMeta(stage: BookingStage) {
  switch (stage) {
    case "submitted":      return { label: "Submitted",       tone: "bg-primary/10 text-primary" };
    case "pending_review": return { label: "Pending review",  tone: "bg-warning/15 text-warning" };
    case "assigned":       return { label: "Assigned",        tone: "bg-info/15 text-info" };
    case "in_progress":    return { label: "In progress",     tone: "bg-info/15 text-info" };
    case "completed":      return { label: "Completed",       tone: "bg-success/15 text-success" };
    case "cancelled":      return { label: "Cancelled",       tone: "bg-destructive/10 text-destructive" };
  }
}

export function BookingStatusTimeline({ stage }: { stage: BookingStage }) {
  if (stage === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-destructive">Booking cancelled</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This request was cancelled. You can submit a new booking anytime.
          </p>
        </div>
      </div>
    );
  }

  const activeIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <ol className="relative space-y-5 pl-6">
      <span className="absolute left-[11px] top-2 bottom-2 w-px bg-border" aria-hidden />
      {STAGES.map((s, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        const Icon = s.icon;
        return (
          <li key={s.key} className="relative">
            <span
              className={cn(
                "absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border",
                done && "border-success bg-success text-success-foreground",
                current && "border-primary bg-primary text-primary-foreground shadow-glow",
                !done && !current && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" />
              ) : current && s.key === "in_progress" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
            </span>
            <p
              className={cn(
                "text-sm font-semibold",
                current ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground",
              )}
            >
              {s.label}
              {current && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <Clock className="h-3 w-3" /> Now
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.blurb}</p>
          </li>
        );
      })}
    </ol>
  );
}
