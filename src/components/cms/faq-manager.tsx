import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { marketingService, type FaqCategory, type FaqEntry } from "@/services/marketing";
import { cn } from "@/lib/utils";

const CAT_LABEL: Record<FaqCategory, string> = {
  general: "General",
  booking: "Booking",
  payment: "Payment",
  providers: "Providers",
  safety: "Safety",
};

export function FaqManager() {
  const [items, setItems] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FaqEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<FaqCategory | "all">("all");

  async function load() {
    setLoading(true);
    setItems(await marketingService.listFaqs());
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((f) => {
        if (cat !== "all" && f.category !== cat) return false;
        if (q && !`${f.question} ${f.answer}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [items, q, cat],
  );

  async function toggle(id: string) {
    await marketingService.toggleFaq(id);
    void load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    await marketingService.removeFaq(id);
    toast.success("FAQ deleted");
    void load();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Knowledge base
          </div>
          <div className="text-base font-semibold">FAQ entries</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search FAQs…"
              className="h-8 w-44 pl-7 text-xs"
            />
          </div>
          <Select value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(Object.keys(CAT_LABEL) as FaqCategory[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {CAT_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> New FAQ
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No FAQs match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="max-w-md">
                    <div className="font-medium">{f.question}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">{f.answer}</div>
                  </TableCell>
                  <TableCell className="text-xs">{CAT_LABEL[f.category]}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        f.published
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {f.published ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                      {f.published ? "Live" : "Draft"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(f.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => toggle(f.id)}
                        aria-label="Toggle published"
                      >
                        {f.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditing(f);
                          setOpen(true);
                        }}
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => remove(f.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <FaqEditor
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={() => {
          setOpen(false);
          void load();
        }}
      />
    </div>
  );
}

function FaqEditor({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: FaqEntry | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "general" as FaqCategory,
    order: 0,
    published: true,
  });
  useEffect(() => {
    if (editing) {
      setForm({
        question: editing.question,
        answer: editing.answer,
        category: editing.category,
        order: editing.order,
        published: editing.published,
      });
    } else {
      setForm({ question: "", answer: "", category: "general", order: 99, published: true });
    }
  }, [editing, open]);

  async function save() {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    await marketingService.saveFaq({
      id: editing?.id,
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      order: form.order,
      published: form.published,
    });
    toast.success(editing ? "FAQ updated" : "FAQ created");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit FAQ" : "New FAQ"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Question</Label>
            <Input
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            />
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea
              rows={4}
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as FaqCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CAT_LABEL) as FaqCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {CAT_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            />
            Publish immediately
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
