import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { listCategories, listServices } from "@/utils/admin.functions";
import type { CategoryRow, ServiceRow } from "@/server/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/mysql/services")({
  component: MysqlServices,
});

function MysqlServices() {
  const navigate = useNavigate();
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [activeCat, setActiveCat] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCategories(), listServices({ data: {} })])
      .then(([c, s]) => {
        if (cancelled) return;
        setCats(c ?? []);
        setServices(s ?? []);
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
    listServices({ data: { categoryId: activeCat } })
      .then((s) => { if (!cancelled) setServices(s ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeCat, loading]);

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
        <header className="mb-3 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground">{cats.length} total</p>
          </div>
        </header>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-right">{Number(c.commission_rate).toFixed(2)}%</TableCell>
                  <TableCell>{c.is_active ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
              {cats.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No categories.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Services</h2>
            <p className="text-sm text-muted-foreground">{services.length} loaded</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveCat(undefined)}
              className={`rounded-full px-3 py-1.5 ${
                !activeCat ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              All
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={`rounded-full px-3 py-1.5 ${
                  activeCat === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </header>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Base price</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.slug}</TableCell>
                  <TableCell className="text-right">{s.base_price ? `BDT ${Number(s.base_price).toLocaleString()}` : "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {s.is_featured  ? <Badge>Featured</Badge>  : null}
                    {s.is_trending  ? <Badge>Trending</Badge>  : null}
                    {s.is_seasonal  ? <Badge>Seasonal</Badge>  : null}
                    {!s.is_active   ? <Badge tone="muted">Inactive</Badge> : null}
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No services.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function Badge({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "muted" }) {
  const cls = tone === "muted"
    ? "bg-muted text-muted-foreground"
    : "bg-primary/10 text-primary";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{children}</span>;
}
