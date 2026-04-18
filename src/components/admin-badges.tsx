import { Shield } from "lucide-react";

type ProviderStatus = "not_applicable" | "pending" | "approved" | "rejected";
type BookingStatus = "new" | "confirmed" | "assigned" | "completed" | "cancelled";
type ApplicationStatus = "new" | "reviewing" | "approved" | "rejected";

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Shield;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-soft ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: ProviderStatus }) {
  const map: Record<ProviderStatus, string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    not_applicable: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    new: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    confirmed: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    assigned: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

export function AppStatusBadge({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, string> = {
    new: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    reviewing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
