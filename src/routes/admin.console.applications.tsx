/**
 * Admin → Provider applications
 * Calls GET /api/provider-applications.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase, Loader2, Search, RefreshCw, Mail, Phone, MapPin, Tag,
  Clock, Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import {
  providerApplicationsApi, type AdminProviderApplication,
} from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/applications")({
  component: ApplicationsPage,
  head: () => ({
    meta: [
      { title: "Provider applications · Admin · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const STATUSES = ["all", "new", "reviewing", "approved", "rejected"] as const;
type Status = (typeof STATUSES)[number];

function ApplicationsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminProviderApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    providerApplicationsApi
      .list({ limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          return navigate({ to: "/admin/backend/login" });
        }
        toast.error(e instanceof Error ? e.message : "Failed to load applications");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [navigate, tick]);

  const filtered = useMemo(() => {
    let list = rows;
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((r) =>
        [r.full_name, r.email, r.phone, r.category, r.coverage_area].some((v) =>
          v?.toLowerCase().includes(t),
        ),
      );
    }
    return list;
  }, [rows, status, q]);

  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Provider applications"
        description="Applications submitted from /become-provider, live from /api/provider-applications."
        actions={
          <Button variant="outline" onClick={() => setTick((t) => t + 1)} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total applications" value={rows.length.toLocaleString()} />
        <Stat label="New" value={newCount.toLocaleString()} accent={newCount > 0} />
        <Stat
          label="Approved"
          value={rows.filter((r) => r.status === "approved").length.toLocaleString()}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                status === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={q || status !== "all" ? "No matches" : "No applications yet"}
          description={
            !q && status === "all"
              ? "Submitted provider applications will appear here for review."
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{a.full_name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(
                        a.status,
                      )}`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {a.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {a.phone}
                    </span>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </time>
              </header>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Field icon={Tag} label="Category" value={a.category} />
                <Field icon={MapPin} label="Coverage" value={a.coverage_area} />
                <Field icon={Clock} label="Experience" value={a.experience} />
                <Field icon={UsersIcon} label="Type" value={a.applicant_type} />
                {a.team_size && <Field icon={UsersIcon} label="Team size" value={a.team_size} />}
                {a.availability && (
                  <Field icon={Clock} label="Availability" value={a.availability} />
                )}
              </div>

              {a.about && (
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">
                  {a.about}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  icon: Icon, label, value,
}: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm">{value}</div>
      </div>
    </div>
  );
}

function statusClass(s: AdminProviderApplication["status"]) {
  switch (s) {
    case "new":       return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "reviewing": return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "approved":  return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "rejected":  return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  }
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-soft ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
