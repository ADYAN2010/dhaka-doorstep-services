/**
 * Admin → Cities
 * Calls GET /api/cities.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { citiesApi, asBool, type AdminCity } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/cities")({
  component: CitiesPage,
});

function CitiesPage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    citiesApi
      .list({ limit: 200, q: q || undefined })
      .then((res) => {
        if (cancelled) return;
        setCities(res.data ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          return navigate({ to: "/admin/backend/login" });
        }
        toast.error(e instanceof Error ? e.message : "Failed to load cities");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [navigate, q, tick]);

  const liveCount = cities.filter((c) => c.launch_status === "live").length;
  const activeCount = cities.filter((c) => asBool(c.is_active)).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Cities"
        title="Cities"
        description="Where the platform operates, live from /api/cities. Manage launch status and visibility per city."
        actions={
          <Button variant="outline" onClick={() => setTick((t) => t + 1)} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total cities" value={cities.length.toLocaleString()} />
        <Stat label="Live" value={liveCount.toLocaleString()} accent />
        <Stat label="Enabled" value={activeCount.toLocaleString()} />
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, slug, country…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : cities.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No cities"
          description="Add your first city to start mapping coverage."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cities
            .slice()
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.country}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${launchClass(
                      c.launch_status,
                    )}`}
                  >
                    {c.launch_status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{c.slug}</span>
                  <span>{asBool(c.is_active) ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function launchClass(s: AdminCity["launch_status"]) {
  switch (s) {
    case "live":        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "beta":        return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "coming_soon": return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "paused":      return "bg-muted text-muted-foreground";
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
