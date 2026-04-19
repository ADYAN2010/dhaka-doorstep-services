/**
 * Admin → Customers
 * Lists customers from the Express backend (GET /api/customers).
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Search, Loader2, Phone, MapPin, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { customersApi, asBool, type AdminCustomer } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customersApi
      .list({ limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          return navigate({ to: "/admin/backend/login" });
        }
        toast.error(e instanceof Error ? e.message : "Failed to load customers");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [navigate, tick]);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) =>
      [r.full_name, r.phone, r.area, r.email].some((v) => v?.toLowerCase().includes(t)),
    );
  }, [rows, q]);

  const activeCount = rows.filter((r) => asBool(r.is_active)).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Customers"
        title="Customer accounts"
        description="Every signed-up customer with their contact details, pulled live from MySQL via /api/customers."
        actions={
          <Button variant="outline" onClick={() => setTick((t) => t + 1)} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Total customers" value={total.toLocaleString()} />
        <Stat label="Active accounts" value={activeCount.toLocaleString()} />
        <Stat label="With phone" value={rows.filter((r) => r.phone).length.toLocaleString()} />
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email, area…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No matches" : "No customers yet"}
          description={!q ? "Customers will appear here once they sign up." : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.full_name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {c.id.slice(0, 8)}…
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {c.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </span>
                        )}
                        {c.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {c.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.area ? (
                        <span className="inline-flex items-center gap-1 text-sm capitalize">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {c.area}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          asBool(c.is_active)
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {asBool(c.is_active) ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
