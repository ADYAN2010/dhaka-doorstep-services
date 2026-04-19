import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/console/subcategories")({
  component: SubcategoriesPage,
});

type Cat = { id: string; name: string };
type Sub = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  base_price: number | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  is_seasonal: boolean;
  is_trending: boolean;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function SubcategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ category_id: "", name: "", base_price: "" });

  async function load() {
    setLoading(true);
    const [c, s] = await Promise.all([
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("service_subcategories").select("*").order("display_order"),
    ]);
    if (c.error) setError(c.error.message);
    else if (s.error) setError(s.error.message);
    else {
      setCats((c.data ?? []) as Cat[]);
      setSubs((s.data ?? []) as Sub[]);
      if (!draft.category_id && c.data?.[0]) setDraft((d) => ({ ...d, category_id: c.data![0].id }));
    }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    if (!draft.category_id || !draft.name.trim()) return toast.error("Pick a category and name it");
    const { error } = await supabase.from("service_subcategories").insert({
      category_id: draft.category_id,
      slug: slugify(draft.name),
      name: draft.name.trim(),
      base_price: draft.base_price ? Number(draft.base_price) : null,
    });
    if (error) return toast.error(error.message);
    setDraft({ ...draft, name: "", base_price: "" });
    toast.success("Service template added");
    void load();
  }

  async function update(id: string, patch: Partial<Sub>) {
    const prev = subs;
    setSubs((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await supabase.from("service_subcategories").update(patch).eq("id", id);
    if (error) { setSubs(prev); toast.error(error.message); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this service template?")) return;
    const { error } = await supabase.from("service_subcategories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setSubs((rs) => rs.filter((r) => r.id !== id));
    toast.success("Deleted");
  }

  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Service templates"
        description="Define service offerings inside each category."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Service templates" }]}
      />

      <SectionCard title="Add a service" icon={Plus}>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={draft.category_id}
            onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
          >
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input
            placeholder="Service name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Base price ৳"
            value={draft.base_price}
            onChange={(e) => setDraft({ ...draft, base_price: e.target.value })}
          />
          <Button size="sm" onClick={create}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button>
        </div>
      </SectionCard>

      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : subs.length === 0 ? (
          <div className="p-5"><EmptyState icon={Layers} title="No service templates" description="Add one above to start the catalog." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Slug</th>
                  <th className="px-3 py-2 text-left">Base ৳</th>
                  <th className="px-3 py-2 text-left">Featured</th>
                  <th className="px-3 py-2 text-left">Trending</th>
                  <th className="px-3 py-2 text-left">Active</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{catName(s.category_id)}</td>
                    <td className="px-3 py-2 font-medium">
                      <Input className="h-7" value={s.name}
                        onChange={(e) => setSubs((rs) => rs.map((r) => (r.id === s.id ? { ...r, name: e.target.value } : r)))}
                        onBlur={(e) => update(s.id, { name: e.target.value })} />
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{s.slug}</td>
                    <td className="px-3 py-2">
                      <Input type="number" className="h-7 w-24" value={s.base_price ?? ""}
                        onChange={(e) => setSubs((rs) => rs.map((r) => (r.id === s.id ? { ...r, base_price: e.target.value === "" ? null : Number(e.target.value) } : r)))}
                        onBlur={(e) => update(s.id, { base_price: e.target.value === "" ? null : Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2"><Switch checked={s.is_featured} onCheckedChange={(v) => update(s.id, { is_featured: v })} /></td>
                    <td className="px-3 py-2"><Switch checked={s.is_trending} onCheckedChange={(v) => update(s.id, { is_trending: v })} /></td>
                    <td className="px-3 py-2"><Switch checked={s.is_active} onCheckedChange={(v) => update(s.id, { is_active: v })} /></td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
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
