import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { listAreas, listCities } from "@/utils/admin.functions";
import type { AreaRow, CityRow } from "@/server/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/mysql/locations")({
  component: MysqlLocations,
});

function MysqlLocations() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [activeCity, setActiveCity] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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
        if (e.message.includes("Unauthorized")) return navigate({ to: "/admin/mysql/login" });
        setErr(e.message);
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

  if (loading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (err) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        <strong>Failed to load.</strong><p className="mt-1">{err}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <header className="mb-3">
          <h1 className="text-2xl font-bold">Cities</h1>
          <p className="text-sm text-muted-foreground">{cities.length} configured</p>
        </header>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell>{c.country}</TableCell>
                  <TableCell className="capitalize">{c.launch_status.replace("_", " ")}</TableCell>
                  <TableCell>{c.is_active ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
              {cities.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No cities.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Areas</h2>
            <p className="text-sm text-muted-foreground">{areas.length} loaded</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveCity(undefined)}
              className={`rounded-full px-3 py-1.5 ${!activeCity ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >All</button>
            {cities.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCity(c.id)}
                className={`rounded-full px-3 py-1.5 ${activeCity === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >{c.name}</button>
            ))}
          </div>
        </header>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((a) => {
                const city = cities.find((c) => c.id === a.city_id);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.slug}</TableCell>
                    <TableCell>{city?.name ?? "—"}</TableCell>
                    <TableCell>{a.is_active ? "Yes" : "No"}</TableCell>
                  </TableRow>
                );
              })}
              {areas.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No areas yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
