import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/console/faqs")({
  component: FaqsPage,
});

type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_visible: boolean;
};

function FaqsPage() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ category: "General", question: "", answer: "" });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs")
      .select("id, category, question, answer, display_order, is_visible")
      .order("category")
      .order("display_order");
    if (error) setError(error.message);
    else setRows((data ?? []) as Faq[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    if (!draft.question.trim() || !draft.answer.trim()) {
      return toast.error("Question and answer are required");
    }
    setCreating(true);
    const { error } = await supabase.from("faqs").insert({
      category: draft.category.trim() || "General",
      question: draft.question.trim(),
      answer: draft.answer.trim(),
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("FAQ added");
    setDraft({ category: "General", question: "", answer: "" });
    void load();
  }

  async function update(id: string, patch: Partial<Faq>) {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await supabase.from("faqs").update(patch).eq("id", id);
    if (error) {
      setRows(prev);
      toast.error(error.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast.success("Deleted");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Content"
        title="FAQs"
        description="Manage frequently asked questions shown on the public help pages."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "FAQs" }]}
      />

      <SectionCard title="Add a new FAQ" icon={Plus}>
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <Input
            placeholder="Category"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          />
          <Input
            placeholder="Question"
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
          />
        </div>
        <Textarea
          className="mt-3"
          placeholder="Answer"
          rows={3}
          value={draft.answer}
          onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
        />
        <div className="mt-3 flex justify-end">
          <Button size="sm" disabled={creating} onClick={create}>
            {creating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
            Add FAQ
          </Button>
        </div>
      </SectionCard>

      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5"><EmptyState icon={HelpCircle} title="No FAQs yet" description="Add one above to get started." /></div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((f) => (
              <li key={f.id} className="space-y-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-7 w-32"
                      value={f.category}
                      onChange={(e) => setRows((rs) => rs.map((r) => (r.id === f.id ? { ...r, category: e.target.value } : r)))}
                      onBlur={(e) => update(f.id, { category: e.target.value })}
                    />
                    <Input
                      type="number"
                      className="h-7 w-20"
                      value={f.display_order}
                      onChange={(e) => setRows((rs) => rs.map((r) => (r.id === f.id ? { ...r, display_order: Number(e.target.value) } : r)))}
                      onBlur={(e) => update(f.id, { display_order: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Visible
                      <Switch checked={f.is_visible} onCheckedChange={(v) => update(f.id, { is_visible: v })} />
                    </label>
                    <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={f.question}
                  onChange={(e) => setRows((rs) => rs.map((r) => (r.id === f.id ? { ...r, question: e.target.value } : r)))}
                  onBlur={(e) => update(f.id, { question: e.target.value })}
                />
                <Textarea
                  rows={2}
                  value={f.answer}
                  onChange={(e) => setRows((rs) => rs.map((r) => (r.id === f.id ? { ...r, answer: e.target.value } : r)))}
                  onBlur={(e) => update(f.id, { answer: e.target.value })}
                />
                <div className="text-[11px] text-muted-foreground">
                  <Save className="mr-1 inline h-3 w-3" /> Changes save when you tab away.
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
