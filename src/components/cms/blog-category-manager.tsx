import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";
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
import { marketingService, type BlogCategory } from "@/services/marketing";

const COLOR_TONES: Record<string, string> = {
  primary: "bg-primary/15 text-primary ring-primary/30",
  emerald: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  violet: "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
  rose: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
  sky: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
};

export function BlogCategoryManager() {
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    setItems(await marketingService.listBlogCategories());
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    await marketingService.removeBlogCategory(id);
    toast.success("Category deleted");
    void load();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Blog
          </div>
          <div className="text-base font-semibold">Categories</div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> New category
        </Button>
      </div>
      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${
                  COLOR_TONES[c.color] ?? COLOR_TONES.primary
                }`}
              >
                <Tag className="h-2.5 w-2.5" />
                {c.name}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">/{c.slug}</div>
                {c.description && (
                  <div className="text-xs text-muted-foreground">{c.description}</div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{c.postCount} posts</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setEditing(c);
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
                onClick={() => remove(c.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <CategoryEditor
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

function CategoryEditor({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: BlogCategory | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    color: "primary",
    description: "",
  });
  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        slug: editing.slug,
        color: editing.color,
        description: editing.description ?? "",
      });
    } else {
      setForm({ name: "", slug: "", color: "primary", description: "" });
    }
  }, [editing, open]);

  async function save() {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    await marketingService.saveBlogCategory({
      id: editing?.id,
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      color: form.color,
      description: form.description.trim() || undefined,
    });
    toast.success(editing ? "Category updated" : "Category created");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit category" : "New blog category"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Color tag</Label>
            <Select
              value={form.color}
              onValueChange={(v) => setForm((f) => ({ ...f, color: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COLOR_TONES).map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
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
