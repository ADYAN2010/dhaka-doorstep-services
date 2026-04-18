import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { areas } from "@/data/areas";

export const Route = createFileRoute("/admin/console/locations")({
  component: LocationsPage,
});

type Stats = {
  area: string;
  bookings: number;
  providers: number;
  completed: number;
};

function LocationsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Stats[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [bookingsRes, areasRes] = await Promise.all([
        supabase.from("bookings").select("area, status"),
        supabase.from("provider_areas").select("area"),
      ]);
      if (cancelled) return;
      const bookingsByArea = new Map<string, { total: number; completed: number }>();
      (bookingsRes.data ?? []).forEach((b) => {
        const cur = bookingsByArea.get(b.area) ?? { total: 0, completed: 0 };
        cur.total += 1;
        if (b.status === "completed") cur.completed += 1;
        bookingsByArea.set(b.area, cur);
      });
      const providersByArea = new Map<string, number>();
      (areasRes.data ?? []).forEach((a) => providersByArea.set(a.area, (providersByArea.get(a.area) ?? 0) + 1));
      // Merge with seed area list
      const allAreas = new Set<string>([...areas, ...bookingsByArea.keys(), ...providersByArea.keys()]);
      const data: Stats[] = Array.from(allAreas).map((a) => ({
        area: a,
        bookings: bookingsByArea.get(a)?.total ?? 0,
        completed: bookingsByArea.get(a)?.completed ?? 0,
        providers: providersByArea.get(a) ?? 0,
      })).sort((x, y) => y.bookings - x.bookings);
      setRows(data);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => q ? rows.filter((r) => r.area.toLowerCase().includes(q.toLowerCase())) : rows, [rows, q]);
  const totalBookings = rows.reduce((s, r) => s + r.bookings, 0);
  const totalProviders = rows.reduce((s, r) => s + r.providers, 0);
  const coveredAreas = rows.filter((r) => r.providers > 0).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Locations"
        title="Coverage & demand by area"
        description="See provider density and booking demand across every area in Dhaka."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Areas tracked" value={rows.length.toLocaleString()} icon={MapPin} />
        <Stat label="Areas with providers" value={coveredAreas.toLocaleString()} icon={MapPin} accent />
        <Stat label="Total bookings" value={totalBookings.toLocaleString()} icon={TrendingUp} />
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search area…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const conversion = r.bookings > 0 ? Math.round((r.completed / r.bookings) * 100) : 0;
            return (
              <div key={r.area} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{r.area}</div>
                    <div className="text-xs text-muted-foreground">Dhaka</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.providers > 0 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                    {r.providers > 0 ? "Covered" : "No coverage"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/40 p-2">
                    <div className="text-base font-bold">{r.providers}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Providers</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <div className="text-base font-bold">{r.bookings}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Bookings</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <div className="text-base font-bold">{conversion}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Done</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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
