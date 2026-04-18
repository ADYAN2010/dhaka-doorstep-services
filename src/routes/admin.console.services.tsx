import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tag, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/services")({
  component: ServicesPage,
});

type Category = { id: string; name: string; slug: string; commission_rate: number; is_active: boolean };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ServicesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("15");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) toast.error(error.message); else setItems((data ?? []) as Category[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function add() {
    if (!newName.trim()) return toast.error("Name is required");
    const slug = slugify(newName);
    const rate = Number(newRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return toast.error("Rate 0–100");
    setBusy("__new");
    const { error } = await supabase.from("categories").insert({ name: newName.trim(), slug, commission_rate: rate });
    setBusy(null);
    if (error) return toast.error(error.message);
    setNewName(""); setNewRate("15");
    toast.success("Category added");
    void load();
  }

  async function update(id: string, patch: Partial<Category>) {
    setBusy(id);
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    toast.success("Saved");
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    setBusy(id);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((c) => c.id !== id));
    toast.success("Deleted");
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Services"
        title="Service catalog"
        description="Manage service categories and their platform commission rates."
      />

      {/* Create new */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold">Add new category</h2>
        <div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
          <Input placeholder="Category name (e.g. Solar Installation)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input type="number" min="0" max="100" placeholder="Rate %" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
          <Button onClick={add} disabled={busy === "__new"}>
            {busy === "__new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="w-[140px]">Commission %</TableHead>
                <TableHead className="w-[100px]">Active</TableHead>
                <TableHead className="w-[80px] text-right">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <CategoryRow
                  key={c.id}
                  cat={c}
                  busy={busy === c.id}
                  onSave={(rate) => update(c.id, { commission_rate: rate })}
                  onToggle={(v) => update(c.id, { is_active: v })}
                  onDelete={() => remove(c.id)}
                />
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  No categories yet. Add your first above.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function CategoryRow({ cat, busy, onSave, onToggle, onDelete }: {
  cat: Category; busy: boolean; onSave: (rate: number) => void; onToggle: (v: boolean) => void; onDelete: () => void;
}) {
  const [rate, setRate] = useState(String(cat.commission_rate));
  const dirty = rate !== String(cat.commission_rate);
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{cat.name}</div>
        <div className="text-xs text-muted-foreground">{cat.slug}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input type="number" min="0" max="100" value={rate} onChange={(e) => setRate(e.target.value)} className="h-8 w-20" />
          <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || busy} onClick={() => onSave(Number(rate))}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          </Button>
        </div>
      </TableCell>
      <TableCell><Switch checked={cat.is_active} onCheckedChange={onToggle} disabled={busy} /></TableCell>
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" onClick={onDelete} disabled={busy} className="h-8 w-8 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
