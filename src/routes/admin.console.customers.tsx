import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/console/customers")({
  component: CustomersPage,
});

type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  area: string | null;
  created_at: string;
};

function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      // user_roles -> profiles join via two queries because RLS on user_roles
      // already gates this to admins.
      const { data: roleRows, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "customer");
      if (rErr) { setError(rErr.message); setLoading(false); return; }
      const ids = (roleRows ?? []).map((r) => r.user_id);
      if (ids.length === 0) { setRows([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, area, created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setRows((data ?? []) as Customer[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(s) ||
        (r.phone ?? "").toLowerCase().includes(s) ||
        (r.area ?? "").toLowerCase().includes(s),
    );
  }, [rows, q]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Customers"
        description="All accounts holding the customer role."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Customers" }]}
        actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-64" />}
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-5"><EmptyState icon={Users} title="No customers" description="No customer accounts match." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Area</th>
                  <th className="px-3 py-2 text-left">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{c.full_name || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.phone ?? "—"}</td>
                    <td className="px-3 py-2">{c.area ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
