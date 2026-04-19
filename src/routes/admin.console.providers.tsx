import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/console/providers")({
  component: ProvidersPage,
});

type Provider = {
  id: string;
  full_name: string;
  phone: string | null;
  area: string | null;
  provider_status: "not_applicable" | "pending" | "approved" | "rejected";
  created_at: string;
};

const STATUSES = ["pending", "approved", "rejected", "not_applicable"] as const;

function ProvidersPage() {
  const [rows, setRows] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const { data: roleRows, error: rErr } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "provider");
    if (rErr) { setError(rErr.message); setLoading(false); return; }
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) { setRows([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, area, provider_status, created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows((data ?? []) as Provider[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function changeStatus(id: string, status: Provider["provider_status"]) {
    const { error } = await supabase.rpc("set_provider_status", { _user_id: id, _status: status });
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    void load();
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.full_name.toLowerCase().includes(s) || (r.area ?? "").toLowerCase().includes(s));
  }, [rows, q]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Providers"
        description="All accounts with the provider role and their approval status."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Providers" }]}
        actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-64" />}
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-5"><EmptyState icon={Briefcase} title="No providers" description="No provider accounts match." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Area</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{p.full_name || "—"}</td>
                    <td className="px-3 py-2">{p.area ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.phone ?? "—"}</td>
                    <td className="px-3 py-2">
                      <StatusPill
                        label={p.provider_status}
                        tone={
                          p.provider_status === "approved" ? "success"
                            : p.provider_status === "rejected" ? "danger"
                            : p.provider_status === "pending" ? "warning"
                            : "neutral"
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Select value={p.provider_status} onValueChange={(v) => changeStatus(p.id, v as Provider["provider_status"])}>
                        <SelectTrigger className="ml-auto w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
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
