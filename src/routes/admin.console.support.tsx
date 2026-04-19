import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/console/support")({
  component: SupportPage,
});

type Cat = {
  id: string;
  name: string;
  description: string | null;
  default_priority: string;
  sla_hours: number;
  display_order: number;
  is_active: boolean;
};

function SupportPage() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", default_priority: "normal", sla_hours: 24 });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_ticket_categories")
      .select("*")
      .order("display_order")
      .order("name");
    if (error) setError(error.message);
    else setRows((data ?? []) as Cat[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    if (!draft.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("support_ticket_categories").insert({
      name: draft.name.trim(),
      default_priority: draft.default_priority,
      sla_hours: Number(draft.sla_hours) || 24,
    });
    if (error) return toast.error(error.message);
    setDraft({ name: "", default_priority: "normal", sla_hours: 24 });
    toast.success("Category added");
    void load();
  }

  async function update(id: string, patch: Partial<Cat>) {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await supabase.from("support_ticket_categories").update(patch).eq("id", id);
    if (error) { setRows(prev); toast.error(error.message); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("support_ticket_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast.success("Deleted");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Support"
        title="Support categories"
        description="Configure ticket categories, default priorities, and SLA targets."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Support" }]}
      />

      <SectionCard title="Add a category" icon={Plus}>
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px_auto]">
          <Input placeholder="Name (e.g. Refund request)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={draft.default_priority}
            onChange={(e) => setDraft({ ...draft, default_priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <Input type="number" placeholder="SLA hours" value={draft.sla_hours} onChange={(e) => setDraft({ ...draft, sla_hours: Number(e.target.value) })} />
          <Button size="sm" onClick={create}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button>
        </div>
      </SectionCard>

      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={LifeBuoy} title="No categories" description="Add a category to organize incoming support tickets." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Priority</th>
                  <th className="px-3 py-2 text-left">SLA (hrs)</th>
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Active</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">
                      <Input className="h-7" value={c.name}
                        onChange={(e) => setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, name: e.target.value } : r)))}
                        onBlur={(e) => update(c.id, { name: e.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                        value={c.default_priority}
                        onChange={(e) => update(c.id, { default_priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" className="h-7 w-20" value={c.sla_hours}
                        onChange={(e) => setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, sla_hours: Number(e.target.value) } : r)))}
                        onBlur={(e) => update(c.id, { sla_hours: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" className="h-7 w-20" value={c.display_order}
                        onChange={(e) => setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, display_order: Number(e.target.value) } : r)))}
                        onBlur={(e) => update(c.id, { display_order: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2"><Switch checked={c.is_active} onCheckedChange={(v) => update(c.id, { is_active: v })} /></td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
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
