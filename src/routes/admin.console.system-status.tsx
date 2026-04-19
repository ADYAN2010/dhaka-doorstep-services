/**
 * Admin → System Status
 *
 * Calls the Express backend at GET /api/admin/system-status and renders:
 *   - DB ping result (ok / not configured / connection error)
 *   - Masked DB host + user, port, SSL, pool limit
 *   - JWT configuration status + expiry
 *   - Backend uptime / memory / NODE_ENV
 *
 * Then probes a handful of /api/* endpoints to label each module as
 *   • live   — endpoint returned a real response
 *   • mock   — frontend is still using stub/MigrationPlaceholder
 *   • down   — endpoint failed (non-2xx / network error)
 *
 * Credentials are NEVER displayed — the backend already masks host/user.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Database,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Server,
  Clock,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { api, ApiError, getApiBaseUrl, isApiBaseUrlConfigured } from "@/lib/api-client";

export const Route = createFileRoute("/admin/console/system-status")({
  component: SystemStatusPage,
  head: () => ({
    meta: [
      { title: "System status · Admin · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// ---- Types matching backend/routes/admin.routes.js → /system-status ----

type DbConfig = {
  configured: boolean;
  host: string | null;
  port: number;
  database: string | null;
  user: string | null;
  ssl: boolean;
  pool_limit: number;
};

type DbPing =
  | { ok: true; configured: true; server_time: string; version: string; db: string }
  | { ok: false; configured: boolean; message?: string; error?: string };

type SystemStatus = {
  node_env: string;
  uptime_seconds: number;
  memory_mb: number;
  db: DbConfig;
  db_ping: DbPing;
  auth: { jwt_configured: boolean; jwt_expires_in: string };
};

// ---- Module probes ----

type ModuleProbe = {
  key: string;
  label: string;
  endpoint: string; // path used to detect liveness
  // Frontend pages are considered "wired" when the corresponding route
  // calls the backend directly. Pages still using MigrationPlaceholder
  // are flagged as "mock" regardless of backend availability.
  uiWired: boolean;
};

const PROBES: ModuleProbe[] = [
  { key: "providers", label: "Providers directory", endpoint: "/api/providers?pageSize=1", uiWired: true },
  { key: "categories", label: "Categories", endpoint: "/api/categories", uiWired: true },
  { key: "services", label: "Services", endpoint: "/api/services", uiWired: false },
  { key: "cities", label: "Cities", endpoint: "/api/cities", uiWired: true },
  { key: "areas", label: "Areas", endpoint: "/api/areas", uiWired: true },
  { key: "bookings", label: "Bookings", endpoint: "/api/bookings", uiWired: true },
  { key: "customers", label: "Customers", endpoint: "/api/customers", uiWired: true },
  { key: "applications", label: "Provider applications", endpoint: "/api/provider-applications", uiWired: true },
  { key: "contact_messages", label: "Contact messages", endpoint: "/api/contact-messages", uiWired: true },
  { key: "blog", label: "Blog posts", endpoint: "/api/blog", uiWired: false },
  { key: "reviews", label: "Reviews", endpoint: "/api/reviews/providers/__probe__", uiWired: true },
];

type ProbeResult = "live" | "down" | "checking";

function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [results, setResults] = useState<Record<string, ProbeResult>>(() =>
    Object.fromEntries(PROBES.map((p) => [p.key, "checking" as ProbeResult])),
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // ---- Fetch /api/admin/system-status ----
  useEffect(() => {
    let cancel = false;
    setStatusLoading(true);
    setStatusErr(null);
    api<SystemStatus>("/api/admin/system-status")
      .then((s) => !cancel && setStatus(s))
      .catch((e) => {
        if (cancel) return;
        if (e instanceof ApiError) {
          setStatusErr(
            e.code === "network_error"
              ? `Backend not reachable at ${getApiBaseUrl() || "(VITE_API_BASE_URL not set)"}`
              : `${e.status} ${e.code} — ${e.message}`,
          );
        } else {
          setStatusErr((e as Error).message);
        }
      })
      .finally(() => !cancel && setStatusLoading(false));
    return () => {
      cancel = true;
    };
  }, [refreshKey]);

  // ---- Probe each /api/* module ----
  useEffect(() => {
    let cancel = false;
    setResults(Object.fromEntries(PROBES.map((p) => [p.key, "checking" as ProbeResult])));
    PROBES.forEach((probe) => {
      api(probe.endpoint)
        .then(() => !cancel && setResults((r) => ({ ...r, [probe.key]: "live" })))
        .catch((err) => {
          if (cancel) return;
          // 404 on a known route still means the backend is up — treat any
          // structured ApiError that ISN'T a network failure as "live".
          if (err instanceof ApiError && err.code !== "network_error") {
            setResults((r) => ({ ...r, [probe.key]: "live" }));
          } else {
            setResults((r) => ({ ...r, [probe.key]: "down" }));
          }
        });
    });
    return () => {
      cancel = true;
    };
  }, [refreshKey]);

  const dbOk = status?.db_ping.ok === true;
  const dbConfigured = status?.db.configured === true;
  const liveCount = useMemo(
    () => Object.values(results).filter((r) => r === "live").length,
    [results],
  );
  const wiredCount = PROBES.filter((p) => p.uiWired).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations"
        title="System status"
        description="Live health of the backend, database connection and module availability. Credentials are never displayed."
        breadcrumbs={[
          { label: "Console", to: "/admin/console" },
          { label: "System status" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${statusLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {/* Top summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={Database}
          label="Database"
          value={
            statusLoading
              ? "Checking…"
              : !dbConfigured
                ? "Not configured"
                : dbOk
                  ? "Connected"
                  : "Connection failed"
          }
          tone={statusLoading ? "muted" : !dbConfigured ? "warn" : dbOk ? "ok" : "bad"}
          hint={
            status?.db_ping.ok
              ? `${status.db_ping.db} · v${status.db_ping.version}`
              : status?.db_ping && !status.db_ping.ok
                ? status.db_ping.error || status.db_ping.message
                : "—"
          }
        />
        <SummaryCard
          icon={KeyRound}
          label="JWT auth"
          value={
            statusLoading
              ? "Checking…"
              : status?.auth.jwt_configured
                ? "Configured"
                : "Missing JWT_SECRET"
          }
          tone={statusLoading ? "muted" : status?.auth.jwt_configured ? "ok" : "bad"}
          hint={status ? `Expires in ${status.auth.jwt_expires_in}` : "—"}
        />
        <SummaryCard
          icon={Activity}
          label="Backend"
          value={statusLoading ? "Checking…" : statusErr ? "Unreachable" : "Online"}
          tone={statusLoading ? "muted" : statusErr ? "bad" : "ok"}
          hint={
            status
              ? `${status.node_env} · ${formatUptime(status.uptime_seconds)} · ${status.memory_mb} MB`
              : statusErr
                ? statusErr
                : "—"
          }
        />
      </div>

      {/* API base URL warning */}
      {!isApiBaseUrlConfigured() && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-foreground">VITE_API_BASE_URL is not set</p>
            <p className="mt-0.5 text-muted-foreground">
              The frontend is currently using the dev fallback{" "}
              <code className="rounded bg-muted px-1">{getApiBaseUrl() || "(empty)"}</code>. Set{" "}
              <code className="rounded bg-muted px-1">VITE_API_BASE_URL</code> in your frontend
              environment to your deployed backend URL and rebuild.
            </p>
          </div>
        </div>
      )}

      {statusErr && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Couldn't reach /api/admin/system-status</p>
            <p className="mt-0.5">{statusErr}</p>
          </div>
        </div>
      )}

      {/* Database details */}
      <section className="rounded-2xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-primary" /> Database connection
          </h2>
          <StatusPill
            tone={statusLoading ? "muted" : !dbConfigured ? "warn" : dbOk ? "ok" : "bad"}
            label={
              statusLoading
                ? "Checking"
                : !dbConfigured
                  ? "Not configured"
                  : dbOk
                    ? "Live"
                    : "Failing"
            }
          />
        </header>
        <dl className="grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
          <Row label="Host (masked)" value={status?.db.host ?? "—"} />
          <Row label="User (masked)" value={status?.db.user ?? "—"} />
          <Row label="Database" value={status?.db.database ?? "—"} />
          <Row label="Port" value={status?.db.port ? String(status.db.port) : "—"} />
          <Row label="SSL" value={status ? (status.db.ssl ? "Enabled" : "Disabled") : "—"} />
          <Row label="Pool size" value={status?.db.pool_limit ? String(status.db.pool_limit) : "—"} />
          <Row
            label="Server time"
            value={
              status?.db_ping.ok
                ? new Date(status.db_ping.server_time).toLocaleString()
                : "—"
            }
          />
          <Row
            label="Engine"
            value={status?.db_ping.ok ? `MySQL ${status.db_ping.version}` : "—"}
          />
        </dl>
        {status && !status.db_ping.ok && (
          <div className="mx-5 mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <strong className="font-semibold">Ping failed.</strong>{" "}
            {status.db_ping.error || status.db_ping.message ||
              "Verify Hostinger MySQL credentials and Remote MySQL whitelist."}
          </div>
        )}
      </section>

      {/* Module liveness */}
      <section className="rounded-2xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
            <Server className="h-4 w-4 text-primary" /> Module availability
          </h2>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{liveCount}</span> / {PROBES.length} API endpoints live
            {" · "}
            <span className="font-semibold text-foreground">{wiredCount}</span> / {PROBES.length} UI pages wired
          </span>
        </header>
        <ul className="divide-y divide-border">
          {PROBES.map((probe) => {
            const apiState = results[probe.key];
            return (
              <li
                key={probe.key}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium">{probe.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{probe.endpoint}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusPill
                    tone={apiState === "checking" ? "muted" : apiState === "live" ? "ok" : "bad"}
                    label={
                      apiState === "checking" ? "Checking" : apiState === "live" ? "API live" : "API down"
                    }
                  />
                  <StatusPill
                    tone={probe.uiWired ? "ok" : "warn"}
                    label={probe.uiWired ? "UI wired" : "UI mocked"}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ---- Small presentational helpers ----

type Tone = "ok" | "bad" | "warn" | "muted";

function toneClasses(tone: Tone) {
  switch (tone) {
    case "ok":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "bad":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "warn":
      return "border-warning/40 bg-warning/10 text-warning-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const Icon =
    tone === "ok" ? CheckCircle2 : tone === "bad" ? XCircle : tone === "warn" ? AlertTriangle : Loader2;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${toneClasses(
        tone,
      )}`}
    >
      <Icon className={`h-3 w-3 ${tone === "muted" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  hint?: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        <StatusPill tone={tone} label={tone === "ok" ? "Healthy" : tone === "bad" ? "Issue" : tone === "warn" ? "Action" : "…"} />
      </div>
      <div className="mt-3 text-lg font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-all font-mono text-sm">{value}</dd>
    </div>
  );
}

function formatUptime(sec: number): string {
  if (!sec || sec < 0) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}
