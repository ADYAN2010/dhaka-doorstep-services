import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Loader2, Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { listAreas, listCities } from "@/utils/admin.functions";
import type { AreaRow, CityRow } from "@/server/types";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/console/locations")({
  component: LocationsPage,
});

function LocationsPage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [activeCity, setActiveCity] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCities(), listAreas({ data: {} })])
      .then(([c, a]) => {
        if (cancelled) return;
        setCities(c ?? []);
        setAreas(a ?? []);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        if (e.message.includes("Unauthorized")) return navigate({ to: "/admin/backend/login" });
        toast.error(e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    listAreas({ data: { cityId: activeCity } })
      .then((a) => { if (!cancelled) setAreas(a ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeCity, loading]);

  const filteredAreas = useMemo(() => {
    if (!q) return areas;
    const t = q.toLowerCase();
    return areas.filter((a) => a.name.toLowerCase().includes(t) || a.slug.toLowerCase().includes(t));
  }, [areas, q]);

  const liveCities = cities.filter((c) => c.launch_status === "live").length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Locations"
        title="Cities & coverage areas"
        description="Manage where the platform operates. Cities and their service areas, live from MySQL."
      />

      {/* City stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Cities configured" value={cities.length.toLocaleString()} icon={Building2} />
        <Stat label="Live cities" value={liveCities.toLocaleString()} icon={Building2} accent />
        <Stat label="Total areas" value={areas.length.toLocaleString()} icon={MapPin} />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-8">
          {/* Cities */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cities</h2>
            {cities.length === 0 ? (
              <EmptyState icon={Building2} title="No cities" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.country}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${launchClass(c.launch_status)}`}>
                        {c.launch_status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{c.slug}</span>
                      <span>{c.is_active ? "Enabled" : "Disabled"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Areas */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Areas</h2>
              <div className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCity(undefined)}
                  className={`rounded-full px-3 py-1.5 ${!activeCity ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >All</button>
                {cities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCity(c.id)}
                    className={`rounded-full px-3 py-1.5 ${activeCity === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >{c.name}</button>
                ))}
              </div>
            </div>

            <div className="mb-3 relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search area…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>

            {filteredAreas.length === 0 ? (
              <EmptyState icon={MapPin} title={q ? "No matches" : "No areas in this city"} />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAreas.map((a) => {
                  const city = cities.find((c) => c.id === a.city_id);
                  return (
                    <div key={a.id} className="rounded-xl border border-border bg-card p-3 shadow-soft">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{city?.name ?? "—"} · {a.slug}</div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${a.is_active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                          {a.is_active ? "On" : "Off"}
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

function launchClass(s: CityRow["launch_status"]) {
  switch (s) {
    case "live":        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "beta":        return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "coming_soon": return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "paused":      return "bg-muted text-muted-foreground";
  }
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof MapPin; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 shadow-soft ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${accent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
