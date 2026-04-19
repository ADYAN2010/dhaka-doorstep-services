import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/coverage")({
  component: CoveragePage,
});

type Row = { id: string; value: string };

function CoveragePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Row[]>([]);
  const [areas, setAreas] = useState<Row[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newArea, setNewArea] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const [c, a] = await Promise.all([
      supabase.from("provider_categories").select("id, category").eq("user_id", user.id),
      supabase.from("provider_areas").select("id, area").eq("user_id", user.id),
    ]);
    setCategories((c.data ?? []).map((r) => ({ id: r.id, value: r.category })));
    setAreas((a.data ?? []).map((r) => ({ id: r.id, value: r.area })));
    setLoading(false);
  }
  useEffect(() => { void load(); }, [user]);

  async function addCategory() {
    if (!user || !newCategory.trim()) return;
    const { error } = await supabase.from("provider_categories").insert({ user_id: user.id, category: newCategory.trim() });
    if (error) return toast.error(error.message);
    setNewCategory("");
    void load();
  }
  async function addArea() {
    if (!user || !newArea.trim()) return;
    const { error } = await supabase.from("provider_areas").insert({ user_id: user.id, area: newArea.trim() });
    if (error) return toast.error(error.message);
    setNewArea("");
    void load();
  }
  async function remove(table: "provider_categories" | "provider_areas", id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  }

  return (
    <SiteShell>
      <section className="container-page max-w-3xl py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Coverage</h1>
        <p className="mt-1 text-sm text-muted-foreground">Categories and areas you serve. Bookings outside your coverage won't appear in your leads.</p>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Panel
              title="Categories"
              items={categories}
              onRemove={(id) => remove("provider_categories", id)}
              input={
                <div className="mt-3 flex gap-2">
                  <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. cleaning" />
                  <Button onClick={addCategory}><Plus className="h-4 w-4" /></Button>
                </div>
              }
            />
            <Panel
              title="Areas"
              items={areas}
              onRemove={(id) => remove("provider_areas", id)}
              input={
                <div className="mt-3 flex gap-2">
                  <Input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="e.g. Dhanmondi" />
                  <Button onClick={addArea}><Plus className="h-4 w-4" /></Button>
                </div>
              }
            />
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function Panel({ title, items, onRemove, input }: { title: string; items: Row[]; onRemove: (id: string) => void; input: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 && <li className="text-xs text-muted-foreground">None added yet.</li>}
        {items.map((it) => (
          <li key={it.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {it.value}
            <button onClick={() => onRemove(it.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove"><X className="h-3 w-3" /></button>
          </li>
        ))}
      </ul>
      {input}
    </div>
  );
}
