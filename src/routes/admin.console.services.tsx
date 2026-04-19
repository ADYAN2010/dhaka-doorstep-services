import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listCategories } from "@/utils/admin.functions";
import type { CategoryRow } from "@/server/types";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (cancelled) return;
        setItems(data ?? []);
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

  const activeCount = items.filter((c) => c.is_active).length;
  const avgRate = items.length > 0
    ? items.reduce((s, c) => s + Number(c.commission_rate), 0) / items.length
    : 0;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Services"
        title="Service catalog"
        description="Service categories and platform commission rates, pulled live from MySQL."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total categories" value={items.length.toLocaleString()} />
        <Stat label="Active" value={activeCount.toLocaleString()} />
        <Stat label="Avg commission" value={`${avgRate.toFixed(1)}%`} />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Tag} title="No categories yet" description="Run the MySQL seed to add default categories." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Commission %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-xs">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{Number(c.commission_rate).toFixed(2)}%</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.is_active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
