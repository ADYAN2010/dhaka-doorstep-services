import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Image as ImageIcon, Save, Loader2, Trash2, Eye, MousePointerClick, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill, StatTile } from "@/components/admin/primitives";
import { EmptyState, LoadingState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { popupsService, type Popup } from "@/services/admin-platform";

export const Route = createFileRoute("/admin/console/popups")({
  component: PopupsPage,
});

function PopupsPage() {
  const [items, setItems] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Popup | null>(null);

  async function load() {
    setLoading(true);
    setItems(await popupsService.list());
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function openNew() {
    setEditing({
      id: "", name: "", triggerType: "page_load", targetPage: "/", headline: "", body: "",
      ctaLabel: "Get started", ctaHref: "/", isActive: false, showOncePerSession: true,
      views: 0, conversions: 0, createdAt: new Date().toISOString(),
    });
  }

  const totalViews = items.reduce((a, p) => a + p.views, 0);
  const totalConv = items.reduce((a, p) => a + p.conversions, 0);
  const cvr = totalViews > 0 ? ((totalConv / totalViews) * 100).toFixed(2) : "0.00";

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website"
        title="Popups & banners"
        description="Targeted modals triggered by page visit, scroll depth or exit intent."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Website" }, { label: "Popups" }]}
        actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> New popup</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatTile icon={ImageIcon} label="Total popups" value={items.length} />
        <StatTile icon={Eye} label="Total views" value={totalViews.toLocaleString()} />
        <StatTile icon={MousePointerClick} label="Conversions" value={totalConv.toLocaleString()} tone="success" />
        <StatTile icon={BarChart3} label="Conversion rate" value={`${cvr}%`} tone="primary" />
      </div>

      {loading ? <LoadingState rows={3} /> : items.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No popups yet" description="Create a targeted popup to capture leads or promote offers." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Create popup</Button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((p) => {
            const conv = p.views > 0 ? ((p.conversions / p.views) * 100).toFixed(2) : "—";
            return (
              <button key={p.id} onClick={() => setEditing(p)} className="group rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <StatusPill label={p.isActive ? "Active" : "Off"} tone={p.isActive ? "success" : "neutral"} />
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Trigger: <code className="rounded bg-muted px-1 text-[10px]">{p.triggerType}</code> · on <code className="rounded bg-muted px-1 text-[10px]">{p.targetPage}</code>
                    </div>
                  </div>
                </div>
                <div className="mb-3 line-clamp-1 text-sm font-medium">{p.headline}</div>
                <div className="line-clamp-2 text-xs text-muted-foreground">{p.body}</div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center">
                  <div><div className="text-xs text-muted-foreground">Views</div><div className="text-sm font-bold">{p.views.toLocaleString()}</div></div>
                  <div><div className="text-xs text-muted-foreground">Conv.</div><div className="text-sm font-bold">{p.conversions}</div></div>
                  <div><div className="text-xs text-muted-foreground">CVR</div><div className="text-sm font-bold">{conv}%</div></div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <PopupEditor popup={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />
    </div>
  );
}

function PopupEditor({ popup, onClose, onSaved }: { popup: Popup | null; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Popup | null>(popup);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(popup); }, [popup]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    if (draft.id) {
      await popupsService.update(draft.id, draft);
    } else {
      const { id: _id, createdAt: _c, views: _v, conversions: _cv, ...rest } = draft;
      await popupsService.create(rest);
    }
    setSaving(false);
    toast.success("Popup saved");
    onSaved();
  }
  async function remove() {
    if (!draft?.id || !confirm("Delete this popup?")) return;
    await popupsService.remove(draft.id);
    toast.success("Popup deleted");
    onSaved();
  }

  if (!draft) return null;

  return (
    <Sheet open={!!popup} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{draft.id ? "Edit popup" : "New popup"}</SheetTitle>
          <SheetDescription>Configure trigger, content and call-to-action.</SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div>
            <Label>Internal name</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Trigger type</Label>
              <Select value={draft.triggerType} onValueChange={(v) => setDraft({ ...draft, triggerType: v as Popup["triggerType"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="page_load">On page load</SelectItem>
                  <SelectItem value="exit_intent">Exit intent</SelectItem>
                  <SelectItem value="scroll_50">Scroll 50%</SelectItem>
                  <SelectItem value="time_15s">After 15 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target page</Label>
              <Input value={draft.targetPage} onChange={(e) => setDraft({ ...draft, targetPage: e.target.value })} placeholder="/" />
            </div>
          </div>
          <div>
            <Label>Headline</Label>
            <Input value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea rows={3} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>CTA label</Label>
              <Input value={draft.ctaLabel} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} />
            </div>
            <div>
              <Label>CTA link</Label>
              <Input value={draft.ctaHref} onChange={(e) => setDraft({ ...draft, ctaHref: e.target.value })} />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Active</Label>
              <Switch checked={draft.isActive} onCheckedChange={(v) => setDraft({ ...draft, isActive: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show only once per session</Label>
              <Switch checked={draft.showOncePerSession} onCheckedChange={(v) => setDraft({ ...draft, showOncePerSession: v })} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-between gap-2 border-t border-border pt-4">
          {draft.id ? (
            <Button variant="outline" onClick={remove} className="text-destructive"><Trash2 className="h-4 w-4" /> Delete</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
