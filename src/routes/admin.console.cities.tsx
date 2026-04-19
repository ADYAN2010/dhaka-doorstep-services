import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/console/cities")({
  component: CitiesPage,
});

type City = {
  id: string;
  name: string;
  slug: string;
  country: string;
  is_active: boolean;
  launch_status: "coming_soon" | "beta" | "live" | "paused";
  display_order: number;
};

function CitiesPage() {
  const [rows, setRows] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cities")
      .select("id, name, slug, country, is_active, launch_status, display_order")
      .order("display_order")
      .order("name");
    if (error) setError(error.message);
    else setRows((data ?? []) as City[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function toggle(id: string, value: boolean) {
    const { error } = await supabase.from("cities").update({ is_active: value }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, is_active: value } : r)));
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Locations"
        title="Cities"
        description="Cities served by the platform and their launch status."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Cities" }]}
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={Building2} title="No cities" description="Add cities in the database to populate this list." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Country</th>
                  <th className="px-3 py-2 text-left">Slug</th>
                  <th className="px-3 py-2 text-left">Launch</th>
                  <th className="px-3 py-2 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2">{c.country}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.slug}</td>
                    <td className="px-3 py-2">
                      <StatusPill
                        label={c.launch_status.replace("_", " ")}
                        tone={c.launch_status === "live" ? "success" : c.launch_status === "beta" ? "info" : c.launch_status === "paused" ? "danger" : "neutral"}
                      />
                    </td>
                    <td className="px-3 py-2"><Switch checked={c.is_active} onCheckedChange={(v) => toggle(c.id, v)} /></td>
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
