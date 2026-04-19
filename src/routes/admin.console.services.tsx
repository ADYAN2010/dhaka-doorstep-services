import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/console/services")({
  component: ServicesPage,
});

type Category = {
  id: string;
  slug: string;
  name: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
};

function ServicesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, name, commission_rate, is_active, created_at")
      .order("name");
    if (error) setError(error.message);
    else setRows((data ?? []) as Category[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function toggle(id: string, value: boolean) {
    const { error } = await supabase.from("categories").update({ is_active: value }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, is_active: value } : r)));
  }

  async function setRate(id: string, rate: number) {
    const { error } = await supabase.from("categories").update({ commission_rate: rate }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Commission updated");
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Service categories"
        description="Top-level service categories, their commission rates, and visibility."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Categories" }]}
      />
      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={Tag} title="No categories" description="Create categories in the database to get started." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Slug</th>
                  <th className="px-3 py-2 text-left">Commission %</th>
                  <th className="px-3 py-2 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.slug}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        defaultValue={c.commission_rate}
                        className="w-24"
                        step="0.5"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v) && v !== c.commission_rate) setRate(c.id, v);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Switch checked={c.is_active} onCheckedChange={(v) => toggle(c.id, v)} />
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
