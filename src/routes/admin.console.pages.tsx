import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/console/pages")({
  component: PagesPage,
});

type Page = {
  id: string;
  slug: string;
  title: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  updated_at: string;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function PagesPage() {
  const [rows, setRows] = useState<Page[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("static_pages")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) setError(error.message);
    else {
      setRows((data ?? []) as Page[]);
      if (!selected && data?.[0]) setSelected(data[0].id);
    }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const current = rows.find((r) => r.id === selected) ?? null;

  async function create() {
    if (!draftTitle.trim()) return toast.error("Title is required");
    const { data, error } = await supabase.from("static_pages").insert({
      slug: slugify(draftTitle),
      title: draftTitle.trim(),
    }).select().single();
    if (error) return toast.error(error.message);
    setDraftTitle("");
    toast.success("Page created");
    setSelected(data.id);
    void load();
  }

  async function save() {
    if (!current) return;
    setSaving(true);
    const { error } = await supabase.from("static_pages").update({
      title: current.title,
      slug: current.slug,
      body: current.body,
      meta_title: current.meta_title,
      meta_description: current.meta_description,
      is_published: current.is_published,
    }).eq("id", current.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this page?")) return;
    const { error } = await supabase.from("static_pages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (selected === id) setSelected(null);
    toast.success("Deleted");
  }

  function patch(p: Partial<Page>) {
    if (!current) return;
    setRows((rs) => rs.map((r) => (r.id === current.id ? { ...r, ...p } : r)));
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Content"
        title="Static pages"
        description="Manage standalone pages such as About, Privacy, and Terms."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Pages" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <SectionCard padded={false}>
          <div className="border-b border-border p-3">
            <div className="flex gap-2">
              <Input placeholder="New page title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
              <Button size="sm" onClick={create}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : error ? (
            <div className="p-5"><ErrorState description={error} /></div>
          ) : rows.length === 0 ? (
            <div className="p-5"><EmptyState icon={FileText} title="No pages" description="Create one above." /></div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={`flex w-full items-center justify-between gap-2 p-3 text-left text-sm transition-colors ${selected === p.id ? "bg-muted" : "hover:bg-muted/50"}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.title}</div>
                      <div className="truncate text-xs text-muted-foreground">/{p.slug}</div>
                    </div>
                    <StatusPill label={p.is_published ? "live" : "draft"} tone={p.is_published ? "success" : "neutral"} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard>
          {!current ? (
            <EmptyState icon={FileText} title="Select a page" description="Pick a page on the left to edit it." />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Title</label>
                  <Input value={current.title} onChange={(e) => patch({ title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Slug</label>
                  <Input value={current.slug} onChange={(e) => patch({ slug: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Body (Markdown / HTML)</label>
                <Textarea rows={12} value={current.body} onChange={(e) => patch({ body: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">SEO title</label>
                  <Input value={current.meta_title ?? ""} onChange={(e) => patch({ meta_title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">SEO description</label>
                  <Input value={current.meta_description ?? ""} onChange={(e) => patch({ meta_description: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={current.is_published} onCheckedChange={(v) => patch({ is_published: v })} />
                  Published
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => remove(current.id)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Delete
                  </Button>
                  <Button onClick={save} disabled={saving}>
                    {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
