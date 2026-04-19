import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Plus, Search, Loader2, Save, Eye, Globe, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill, StatTile } from "@/components/admin/primitives";
import { EmptyState, LoadingState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/console/pages")({
  component: PagesPage,
});

type Page = Tables<"static_pages">;

function PagesPage() {
  const [items, setItems] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Page | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("static_pages").select("*").order("updated_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const filtered = items.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()) || p.slug.toLowerCase().includes(q.toLowerCase()));
  const published = items.filter((p) => p.is_published).length;

  function openCreate() {
    setEditing({
      id: "",
      slug: "",
      title: "",
      body: "",
      meta_title: "",
      meta_description: "",
      og_image_url: "",
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: null,
    });
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website"
        title="Static pages"
        description="About, Contact, Privacy, Terms — manage every static page with full SEO controls."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Website" }, { label: "Pages" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New page</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatTile icon={FileText} label="Total pages" value={items.length} />
        <StatTile icon={Globe} label="Published" value={published} tone="success" />
        <StatTile icon={Pencil} label="Drafts" value={items.length - published} tone="warning" />
      </div>

      <SectionCard
        title="All pages"
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="h-8 pl-8 text-xs" placeholder="Search by title or slug" />
          </div>
        }
        padded={false}
      >
        {loading ? (
          <div className="p-5"><LoadingState rows={4} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={FileText} title="No pages yet" description="Create your first static page (About, Contact, etc.)." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New page</Button>} />
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => setEditing(p)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{p.title}</div>
                    <StatusPill label={p.is_published ? "Published" : "Draft"} tone={p.is_published ? "success" : "warning"} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1 py-0.5 text-[10px]">/{p.slug}</code>
                    <span>•</span>
                    <span>Updated {new Date(p.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <PageEditor page={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />
    </div>
  );
}

function PageEditor({ page, onClose, onSaved }: { page: Page | null; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Page | null>(page);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(page); }, [page]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    if (draft.id) {
      const { error } = await supabase.from("static_pages").update({
        slug: draft.slug, title: draft.title, body: draft.body,
        meta_title: draft.meta_title, meta_description: draft.meta_description,
        og_image_url: draft.og_image_url, is_published: draft.is_published,
      }).eq("id", draft.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("static_pages").insert({
        slug: draft.slug, title: draft.title, body: draft.body,
        meta_title: draft.meta_title, meta_description: draft.meta_description,
        og_image_url: draft.og_image_url, is_published: draft.is_published,
      });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    setSaving(false);
    toast.success("Page saved");
    onSaved();
  }

  if (!draft) return null;

  return (
    <Sheet open={!!page} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{draft.id ? "Edit page" : "New page"}</SheetTitle>
          <SheetDescription>Edit content, SEO metadata and publish status.</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="content" className="mt-5">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="space-y-4 pt-4">
            <div>
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <Label>URL slug</Label>
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="about" />
            </div>
            <div>
              <Label>Body (Markdown)</Label>
              <Textarea rows={14} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            </div>
          </TabsContent>
          <TabsContent value="seo" className="space-y-4 pt-4">
            <div>
              <Label>Meta title</Label>
              <Input value={draft.meta_title ?? ""} onChange={(e) => setDraft({ ...draft, meta_title: e.target.value })} />
              <div className="mt-1 text-xs text-muted-foreground">{(draft.meta_title ?? "").length}/60 characters</div>
            </div>
            <div>
              <Label>Meta description</Label>
              <Textarea rows={3} value={draft.meta_description ?? ""} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} />
              <div className="mt-1 text-xs text-muted-foreground">{(draft.meta_description ?? "").length}/160 characters</div>
            </div>
            <div>
              <Label>Open Graph image URL</Label>
              <Input value={draft.og_image_url ?? ""} onChange={(e) => setDraft({ ...draft, og_image_url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview</div>
              <div className="mt-2 truncate text-sm font-semibold text-primary">{draft.meta_title || draft.title || "Page title"}</div>
              <div className="truncate text-xs text-emerald-700">/{draft.slug || "url-slug"}</div>
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{draft.meta_description || "Search engines will show this description below the title."}</div>
            </div>
          </TabsContent>
          <TabsContent value="publish" className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <div className="text-sm font-semibold">Published</div>
                <div className="text-xs text-muted-foreground">When on, this page is visible at /{draft.slug || "…"}.</div>
              </div>
              <Switch checked={draft.is_published} onCheckedChange={(v) => setDraft({ ...draft, is_published: v })} />
            </div>
            {draft.is_published && draft.slug && (
              <a href={`/${draft.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Eye className="h-3.5 w-3.5" /> Open public page
              </a>
            )}
          </TabsContent>
        </Tabs>
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save page
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
