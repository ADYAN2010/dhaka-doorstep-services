import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Check, X, Loader2, Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, AppStatusBadge } from "@/components/admin-badges";

export const Route = createFileRoute("/admin/console/providers")({
  component: ProvidersPage,
});

type Provider = {
  id: string; full_name: string; phone: string | null; area: string | null;
  provider_status: "not_applicable" | "pending" | "approved" | "rejected"; created_at: string;
};
type Application = {
  id: string; full_name: string; phone: string; email: string;
  category: string; experience: string; coverage_area: string; applicant_type: string;
  about: string | null; status: "new" | "reviewing" | "approved" | "rejected"; created_at: string;
};

function ProvidersPage() {
  const [tab, setTab] = useState<"applications" | "providers">("applications");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const [p, a] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, area, provider_status, created_at").order("created_at", { ascending: false }),
      supabase.from("provider_applications").select("*").order("created_at", { ascending: false }),
    ]);
    setProviders(((p.data ?? []) as Provider[]).filter((r) => r.provider_status !== "not_applicable"));
    setApps((a.data ?? []) as Application[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function approveApp(id: string) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_approve_application", { _application_id: id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Application approved & coverage seeded");
    void load();
  }

  async function setAppStatus(id: string, status: Application["status"]) {
    setBusy(id);
    const { error } = await supabase.from("provider_applications").update({ status }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success(`Application → ${status}`);
  }

  async function setProviderStatus(uid: string, status: Provider["provider_status"]) {
    setBusy(uid);
    const { error } = await supabase.rpc("set_provider_status", { _user_id: uid, _status: status });
    setBusy(null);
    if (error) return toast.error(error.message);
    setProviders((prev) => prev.map((p) => (p.id === uid ? { ...p, provider_status: status } : p)));
    toast.success(`Provider → ${status}`);
  }

  const filteredApps = useMemo(() => {
    if (!q) return apps;
    const t = q.toLowerCase();
    return apps.filter((a) => [a.full_name, a.phone, a.email, a.category, a.coverage_area].some((v) => v?.toLowerCase().includes(t)));
  }, [apps, q]);

  const filteredProviders = useMemo(() => {
    if (!q) return providers;
    const t = q.toLowerCase();
    return providers.filter((p) => [p.full_name, p.phone, p.area].some((v) => v?.toLowerCase().includes(t)));
  }, [providers, q]);

  const newApps = apps.filter((a) => a.status === "new").length;
  const approved = providers.filter((p) => p.provider_status === "approved").length;
  const pending = providers.filter((p) => p.provider_status === "pending").length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Providers"
        title="Providers & applications"
        description="Review, approve, and manage every provider on the platform."
        actions={<Button variant="outline" onClick={load} disabled={loading}>{loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Refresh</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="New applications" value={newApps} accent={newApps > 0} />
        <Stat label="Approved providers" value={approved} />
        <Stat label="Pending review" value={pending} accent={pending > 0} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-border">
        <TabBtn active={tab === "applications"} onClick={() => setTab("applications")}>Applications ({apps.length})</TabBtn>
        <TabBtn active={tab === "providers"} onClick={() => setTab("providers")}>Active providers ({providers.length})</TabBtn>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {tab === "applications" ? (
        filteredApps.length === 0 ? (
          <EmptyState icon={Briefcase} title={loading ? "Loading…" : "No applications"} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Category & area</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.full_name}</div>
                        <div className="text-xs text-muted-foreground">{a.email} · {a.phone}</div>
                        <div className="mt-0.5 inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium capitalize">{a.applicant_type}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{a.category}</div>
                        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{a.coverage_area}</div>
                      </TableCell>
                      <TableCell className="text-sm">{a.experience}</TableCell>
                      <TableCell><AppStatusBadge status={a.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {a.status !== "approved" && (
                            <Button size="sm" onClick={() => approveApp(a.id)} disabled={busy === a.id}>
                              {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Approve
                            </Button>
                          )}
                          {a.status !== "rejected" && (
                            <Button size="sm" variant="outline" onClick={() => setAppStatus(a.id, "rejected")} disabled={busy === a.id}>
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      ) : filteredProviders.length === 0 ? (
        <EmptyState icon={Briefcase} title="No providers" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="text-sm">{p.area ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.phone ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={p.provider_status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {p.provider_status !== "approved" && (
                          <Button size="sm" onClick={() => setProviderStatus(p.id, "approved")} disabled={busy === p.id}>Approve</Button>
                        )}
                        {p.provider_status !== "rejected" && (
                          <Button size="sm" variant="outline" onClick={() => setProviderStatus(p.id, "rejected")} disabled={busy === p.id}>Reject</Button>
                        )}
                      </div>
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

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-soft ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
