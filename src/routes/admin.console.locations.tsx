/**
 * Admin → Locations (Cities + Areas, joined view)
 * Calls GET /api/cities and GET /api/areas in parallel.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Loader2, Building2, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import {
  citiesApi, areasApi, asBool,
  type AdminCity, type AdminArea,
} from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/locations")({
  component: LocationsPage,
});

function LocationsPage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [areas, setAreas] = useState<AdminArea[]>([]);
  const [activeCity, setActiveCity] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([citiesApi.list({ limit: 200 }), areasApi.list({ limit: 500 })])
      .then(([c, a]) => {
        if (cancelled) return;
        setCities(c.data ?? []);
        setAreas(a.data ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          return navigate({ to: "/admin/backend/login" });
        }
        toast.error(e instanceof Error ? e.message : "Failed to load locations");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [navigate, tick]);

  const filteredAreas = useMemo(() => {
    let list = areas;
    if (activeCity) list = list.filter((a) => a.city_id === activeCity);
    if (q) {
      const t = q.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(t) || a.slug.toLowerCase().includes(t),
      );
    }
    return list;
  }, [areas, activeCity, q]);

  const liveCities = cities.filter((c) => c.launch_status === "live").length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Locations"
        title="Coverage map"
        description="Cities and their service areas, joined live from /api/cities and /api/areas."
        actions={
          <Button variant="outline" onClick={() => setTick((t) => t + 1)} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Cities configured" value={cities.length.toLocaleString()} icon={Building2} />
        <Stat label="Live cities" value={liveCities.toLocaleString()} icon={Building2} accent />
        <Stat label="Total areas" value={areas.length.toLocaleString()} icon={MapPin} />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cities */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Cities
            </h2>
            {cities.length === 0 ? (
              <EmptyState icon={Building2} title="No cities" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.country}</div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${launchClass(
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
          </section>

          {/* Areas */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Areas
              </h2>
              <div className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCity(undefined)}
                  className={`rounded-full px-3 py-1.5 ${
                    !activeCity
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                {cities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCity(c.id)}
                    className={`rounded-full px-3 py-1.5 ${
                      activeCity === c.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3 relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search area…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>

            {filteredAreas.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={q ? "No matches" : "No areas in this city"}
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAreas.map((a) => {
                  const city = cities.find((c) => c.id === a.city_id);
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-border bg-card p-3 shadow-soft"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {city?.name ?? "—"} · {a.slug}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            asBool(a.is_active)
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {asBool(a.is_active) ? "On" : "Off"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
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

function Stat({
  label, value, icon: Icon, accent,
}: { label: string; value: string; icon: typeof MapPin; accent?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 shadow-soft ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-lg ${
          accent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
