import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { IdCard, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/console/applications")({
  component: ApplicationsPage,
});

type App = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  category: string;
  coverage_area: string;
  experience: string;
  status: "new" | "reviewing" | "approved" | "rejected";
  created_at: string;
  user_id: string | null;
};

function ApplicationsPage() {
  const [rows, setRows] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("provider_applications")
      .select("id, full_name, email, phone, category, coverage_area, experience, status, created_at, user_id")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows((data ?? []) as App[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function approve(id: string) {
    setBusyId(id);
    const { error } = await supabase.rpc("admin_approve_application", { _application_id: id });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Application approved");
    void load();
  }

  async function reject(id: string) {
    setBusyId(id);
    const { error } = await supabase
      .from("provider_applications")
      .update({ status: "rejected" })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Application rejected");
    void load();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Provider applications"
        description="Approve or reject providers applying to join the platform."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Applications" }]}
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={IdCard} title="No applications yet" description="When new providers apply, they'll appear here." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Applicant</th>
                  <th className="px-3 py-2 text-left">Contact</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Area</th>
                  <th className="px-3 py-2 text-left">Experience</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{r.full_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <div>{r.email}</div>
                      <div className="text-xs">{r.phone}</div>
                    </td>
                    <td className="px-3 py-2 capitalize">{r.category}</td>
                    <td className="px-3 py-2">{r.coverage_area}</td>
                    <td className="px-3 py-2">{r.experience}</td>
                    <td className="px-3 py-2">
                      <StatusPill
                        label={r.status}
                        tone={
                          r.status === "approved" ? "success"
                            : r.status === "rejected" ? "danger"
                            : r.status === "reviewing" ? "info"
                            : "warning"
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.status === "new" || r.status === "reviewing" ? (
                        <div className="inline-flex gap-1.5">
                          <Button
                            size="sm"
                            disabled={busyId === r.id || !r.user_id}
                            onClick={() => approve(r.id)}
                            title={!r.user_id ? "Applicant has no account yet" : undefined}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => reject(r.id)}>
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
