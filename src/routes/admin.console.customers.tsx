import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Search, Loader2, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/customers")({
  component: CustomersPage,
});

type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  area: string | null;
  created_at: string;
  bookings_count: number;
};

function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      // Get profiles that have customer role and aren't approved providers (or include them — show all role=customer)
      const [profilesRes, rolesRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, area, created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("bookings").select("user_id"),
      ]);
      if (cancelled) return;
      if (profilesRes.error) { toast.error(profilesRes.error.message); setLoading(false); return; }
      const customerIds = new Set(
        (rolesRes.data ?? []).filter((r) => r.role === "customer").map((r) => r.user_id),
      );
      const counts = new Map<string, number>();
      (bookingsRes.data ?? []).forEach((b) => {
        if (b.user_id) counts.set(b.user_id, (counts.get(b.user_id) ?? 0) + 1);
      });
      const list: Customer[] = (profilesRes.data ?? [])
        .filter((p) => customerIds.has(p.id))
        .map((p) => ({
          id: p.id,
          full_name: p.full_name || "Unnamed",
          phone: p.phone,
          area: p.area,
          created_at: p.created_at,
          bookings_count: counts.get(p.id) ?? 0,
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRows(list);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) => [r.full_name, r.phone, r.area].some((v) => v?.toLowerCase().includes(t)));
  }, [rows, q]);

  const totalBookings = rows.reduce((s, r) => s + r.bookings_count, 0);
  const activeWithBookings = rows.filter((r) => r.bookings_count > 0).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Customers"
        title="Customer accounts"
        description="Every signed-up customer with their booking activity and contact details."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Total customers" value={rows.length.toLocaleString()} />
        <Stat label="With bookings" value={activeWithBookings.toLocaleString()} />
        <Stat label="Total bookings placed" value={totalBookings.toLocaleString()} />
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, phone, area…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={q ? "No matches" : "No customers yet"} description={!q ? "Customers will appear here once they sign up." : undefined} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.full_name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{c.id.slice(0, 8)}…</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.area ? <span className="inline-flex items-center gap-1 text-sm"><MapPin className="h-3 w-3 text-muted-foreground" />{c.area}</span> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.bookings_count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {c.bookings_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
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
