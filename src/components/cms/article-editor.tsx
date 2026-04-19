import { useState } from "react";
import { Eye, FileText, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ArticleEditor({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    tag: "Insights",
    excerpt: "",
    body: "",
    cover_image_url: "",
    read_minutes: 4,
    published: false,
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.title || !form.slug || !form.excerpt || !form.body) {
      toast.error("Title, slug, excerpt and body are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("blog_posts").insert({
      title: form.title.trim(),
      slug: form.slug.trim(),
      tag: form.tag.trim() || "Insights",
      excerpt: form.excerpt.trim(),
      body: form.body,
      cover_image_url: form.cover_image_url.trim() || null,
      read_minutes: Math.max(1, Math.min(60, Number(form.read_minutes) || 4)),
      published: form.published,
      published_at: form.published ? new Date().toISOString() : null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Article published");
    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-4 w-4 text-primary" /> New article
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPreview((v) => !v)}
            >
              <Eye className="h-3.5 w-3.5" />
              {showPreview ? "Hide preview" : "Preview"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={`grid gap-5 ${showPreview ? "lg:grid-cols-2" : ""}`}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category tag</Label>
                <Input value={form.tag} onChange={(e) => update("tag", e.target.value)} />
              </div>
              <div>
                <Label>Read minutes</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={form.read_minutes}
                  onChange={(e) => update("read_minutes", Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label>Cover image URL</Label>
              <Input
                value={form.cover_image_url}
                onChange={(e) => update("cover_image_url", e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
              />
            </div>
            <div>
              <Label>Body (Markdown-ish)</Label>
              <Textarea
                rows={14}
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => update("published", e.target.checked)}
              />
              Publish immediately
            </label>
          </div>

          {showPreview && (
            <div className="rounded-2xl border border-border bg-background p-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {form.tag || "Insights"}
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {form.title || "Article title"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {form.excerpt || "Short summary will appear here."}
              </p>
              {form.cover_image_url && (
                <img
                  src={form.cover_image_url}
                  alt=""
                  className="mt-4 aspect-video w-full rounded-xl object-cover"
                />
              )}
              <pre className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {form.body || "Body preview"}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {form.published ? "Publish" : "Save draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
