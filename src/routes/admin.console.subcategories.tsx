import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Boxes, Save, Loader2, Trash2, Star, Flame, Snowflake, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill, StatTile } from "@/components/admin/primitives";
import { EmptyState, LoadingState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/subcategories")({
  component: SubcategoriesPage,
});

type Subcategory = Tables<"service_subcategories">;
type Category = Tables<"categories">;

function SubcategoriesPage() {
  const [items, setItems] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<"all" | "featured" | "trending" | "seasonal">("all");

  async function load() {
    setLoading(true);
    const [{ data: subs }, { data: cats }] = await Promise.all([
      supabase.from("service_subcategories").select("*").order("display_order").order("name"),
      supabase.from("categories").select("*").eq("is_active", true).order("name"),
    ]);
    setItems(subs ?? []);
    setCategories(cats ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const filtered = items.filter((s) => {
    if (catFilter !== "all" && s.category_id !== catFilter) return false;
    if (tagFilter === "featured" && !s.is_featured) return false;
    if (tagFilter === "trending" && !s.is_trending) return false;
    if (tagFilter === "seasonal" && !s.is_seasonal) return false;
    return true;
  });

  function openNew() {
    setEditing({
      id: "",
      category_id: catFilter !== "all" ? catFilter : (categories[0]?.id ?? ""),
      name: "",
      slug: "",
      description: null,
      base_price: null,
      display_order: items.length,
      is_active: true,
      is_featured: false,
      is_trending: false,
      is_seasonal: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async function toggleFlag(s: Subcategory, key: "is_featured" | "is_trending" | "is_seasonal" | "is_active") {
    await supabase.from("service_subcategories").update({ [key]: !s[key] }).eq("id", s.id);
    void load();
  }
  async function remove(s: Subcategory) {
    if (!confirm(`Delete service template "${s.name}"?`)) return;
    const { error } = await supabase.from("service_subcategories").delete().eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Template deleted");
    void load();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Service templates"
        description="Curate the catalog of bookable services per category. Toggle Featured / Trending / Seasonal to surface them on the homepage."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Marketplace" }, { label: "Service templates" }]}
        actions={<Button onClick={openNew} disabled={categories.length === 0}><Plus className="h-4 w-4" /> Add template</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Boxes} label="Total templates" value={items.length} />
        <StatTile icon={Star} label="Featured" value={items.filter((s) => s.is_featured).length} tone="warning" />
        <StatTile icon={Flame} label="Trending" value={items.filter((s) => s.is_trending).length} tone="danger" />
        <StatTile icon={Snowflake} label="Seasonal" value={items.filter((s) => s.is_seasonal).length} tone="info" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tag</Label>
          <Select value={tagFilter} onValueChange={(v) => setTagFilter(v as typeof tagFilter)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="featured">Featured only</SelectItem>
              <SelectItem value="trending">Trending only</SelectItem>
              <SelectItem value="seasonal">Seasonal only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Boxes} title="No service templates" description={categories.length === 0 ? "Create a service category first." : "Add your first service template."}
          action={categories.length > 0 ? <Button onClick={openNew}><Plus className="h-4 w-4" /> Add template</Button> : undefined} />
      ) : (
        <SectionCard padded={false} title="Service templates" description={`${filtered.length} item${filtered.length === 1 ? "" : "s"}`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Base price</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setEditing(s)}>
                    <TableCell>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">/{s.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm">{catById[s.category_id]?.name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {s.base_price ? `৳${Number(s.base_price).toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => toggleFlag(s, "is_featured")} className="transition-opacity hover:opacity-80">
                          {s.is_featured ? <StatusPill label="★ Featured" tone="warning" /> : <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground">+ feature</span>}
                        </button>
                        <button onClick={() => toggleFlag(s, "is_trending")} className="transition-opacity hover:opacity-80">
                          {s.is_trending ? <StatusPill label="🔥 Trending" tone="danger" /> : <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground">+ trend</span>}
                        </button>
                        <button onClick={() => toggleFlag(s, "is_seasonal")} className="transition-opacity hover:opacity-80">
                          {s.is_seasonal ? <StatusPill label="❄ Seasonal" tone="info" /> : <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground">+ season</span>}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={s.is_active} onCheckedChange={() => toggleFlag(s, "is_active")} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm" onClick={() => remove(s)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <SubcategoryEditor sub={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />
    </div>
  );
}

function SubcategoryEditor({ sub, categories, onClose, onSaved }: { sub: Subcategory | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Subcategory | null>(sub);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(sub); }, [sub]);

  async function save() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.slug.trim() || !draft.category_id) {
      toast.error("Name, slug and category are required"); return;
    }
    setSaving(true);
    const payload = {
      category_id: draft.category_id,
      name: draft.name.trim(),
      slug: draft.slug.trim().toLowerCase(),
      description: draft.description?.trim() || null,
      base_price: draft.base_price === null || draft.base_price === undefined ? null : Number(draft.base_price),
      display_order: draft.display_order,
      is_active: draft.is_active,
      is_featured: draft.is_featured,
      is_trending: draft.is_trending,
      is_seasonal: draft.is_seasonal,
    };
    const { error } = draft.id
      ? await supabase.from("service_subcategories").update(payload).eq("id", draft.id)
      : await supabase.from("service_subcategories").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Template saved");
    onSaved();
  }

  if (!draft) return null;

  return (
    <Sheet open={!!sub} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{draft.id ? `Edit ${draft.name || "template"}` : "New service template"}</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div>
            <Label>Category</Label>
            <Select value={draft.category_id} onValueChange={(v) => setDraft({ ...draft, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Service name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slug || e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Short customer-facing description" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Base price (BDT)</Label>
              <Input type="number" min="0" value={draft.base_price ?? ""} onChange={(e) => setDraft({ ...draft, base_price: e.target.value === "" ? null : Number(e.target.value) })} placeholder="e.g. 1500" />
            </div>
            <div>
              <Label>Display order</Label>
              <Input type="number" value={draft.display_order} onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3 w-3" /> Marketing tags
            </div>
            <FlagRow icon={<Star className="h-3.5 w-3.5 text-amber-500" />} label="Featured" desc="Pinned to homepage hero strip"
              checked={draft.is_featured} onChange={(v) => setDraft({ ...draft, is_featured: v })} />
            <FlagRow icon={<Flame className="h-3.5 w-3.5 text-rose-500" />} label="Trending" desc="Adds the 🔥 badge"
              checked={draft.is_trending} onChange={(v) => setDraft({ ...draft, is_trending: v })} />
            <FlagRow icon={<Snowflake className="h-3.5 w-3.5 text-sky-500" />} label="Seasonal" desc="Show during seasonal campaigns"
              checked={draft.is_seasonal} onChange={(v) => setDraft({ ...draft, is_seasonal: v })} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <Label className="text-sm">Active</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Inactive templates are hidden from the catalog.</p>
            </div>
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save template
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FlagRow({ icon, label, desc, checked, onChange }: { icon: React.ReactNode; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-[11px] text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
