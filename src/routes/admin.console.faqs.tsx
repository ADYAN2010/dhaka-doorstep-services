import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, MessageSquareText, Save, Loader2, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin/console/faqs")({
  component: FaqsPage,
});

type Faq = Tables<"faqs">;

function FaqsPage() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Faq | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("faqs").select("*").order("category").order("display_order");
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function openNew() {
    setEditing({ id: "", category: "General", question: "", answer: "", display_order: items.length, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }

  async function toggleVisibility(faq: Faq) {
    await supabase.from("faqs").update({ is_visible: !faq.is_visible }).eq("id", faq.id);
    void load();
  }

  async function remove(faq: Faq) {
    if (!confirm(`Delete "${faq.question}"?`)) return;
    await supabase.from("faqs").delete().eq("id", faq.id);
    toast.success("FAQ deleted");
    void load();
  }

  const grouped = items.reduce<Record<string, Faq[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website"
        title="FAQs"
        description="Curate questions grouped by category. Shown publicly on /faq."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Website" }, { label: "FAQs" }]}
        actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add FAQ</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatTile icon={MessageSquareText} label="Total FAQs" value={items.length} />
        <StatTile icon={Eye} label="Visible" value={items.filter((f) => f.is_visible).length} tone="success" />
        <StatTile icon={EyeOff} label="Categories" value={categories.length} tone="primary" />
      </div>

      {loading ? (
        <LoadingState rows={5} />
      ) : items.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="No FAQs yet" description="Add your first frequently asked question." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add FAQ</Button>} />
      ) : (
        <div className="space-y-5">
          {categories.map((cat) => (
            <SectionCard key={cat} title={cat} description={`${grouped[cat].length} question${grouped[cat].length === 1 ? "" : "s"}`} padded={false}>
              <div className="divide-y divide-border/70">
                {grouped[cat].map((f) => (
                  <div key={f.id} className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
                    <GripVertical className="mt-1 h-4 w-4 shrink-0 cursor-grab text-muted-foreground/40" />
                    <button onClick={() => setEditing(f)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{f.question}</div>
                        {!f.is_visible && <StatusPill label="Hidden" tone="warning" />}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{f.answer}</div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => toggleVisibility(f)} title={f.is_visible ? "Hide" : "Show"}>
                        {f.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => remove(f)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <FaqEditor faq={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />
    </div>
  );
}

function FaqEditor({ faq, onClose, onSaved }: { faq: Faq | null; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Faq | null>(faq);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(faq); }, [faq]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    if (draft.id) {
      await supabase.from("faqs").update({ category: draft.category, question: draft.question, answer: draft.answer, display_order: draft.display_order, is_visible: draft.is_visible }).eq("id", draft.id);
    } else {
      await supabase.from("faqs").insert({ category: draft.category, question: draft.question, answer: draft.answer, display_order: draft.display_order, is_visible: draft.is_visible });
    }
    setSaving(false);
    toast.success("FAQ saved");
    onSaved();
  }

  if (!draft) return null;

  return (
    <Sheet open={!!faq} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{draft.id ? "Edit FAQ" : "New FAQ"}</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div>
            <Label>Category</Label>
            <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="General, Booking, Payment…" />
          </div>
          <div>
            <Label>Question</Label>
            <Input value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea rows={6} value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <Label className="text-sm">Visible publicly</Label>
            <Switch checked={draft.is_visible} onCheckedChange={(v) => setDraft({ ...draft, is_visible: v })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
