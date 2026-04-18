import { useEffect, useState } from "react";
import { Loader2, Mail, FileText, Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Inbox } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  tag: string;
  read_minutes: number;
  published: boolean;
  published_at: string | null;
  updated_at: string;
};

type ContactMessage = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  handled: boolean;
  created_at: string;
};

const EMPTY_POST: Omit<BlogPost, "id" | "updated_at" | "published_at"> = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  cover_image_url: null,
  tag: "Insights",
  read_minutes: 4,
  published: false,
};

export function AdminBlogAndMessages() {
  // ----- Blog posts -----
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  // ----- Messages -----
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [busyMsgId, setBusyMsgId] = useState<string | null>(null);
  const [msgFilter, setMsgFilter] = useState<"unhandled" | "all">("unhandled");

  useEffect(() => {
    void loadPosts();
    void loadMessages();
  }, []);

  async function loadPosts() {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });
    setLoadingPosts(false);
    if (error) toast.error(error.message);
    else setPosts((data ?? []) as BlogPost[]);
  }

  async function loadMessages() {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setLoadingMessages(false);
    if (error) toast.error(error.message);
    else setMessages((data ?? []) as ContactMessage[]);
  }

  async function togglePublish(p: BlogPost) {
    setBusyPostId(p.id);
    const next = !p.published;
    const { error } = await supabase
      .from("blog_posts")
      .update({
        published: next,
        published_at: next ? p.published_at ?? new Date().toISOString() : p.published_at,
      })
      .eq("id", p.id);
    setBusyPostId(null);
    if (error) return toast.error(error.message);
    toast.success(next ? "Published" : "Unpublished");
    void loadPosts();
  }

  async function deletePost(p: BlogPost) {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    setBusyPostId(p.id);
    const { error } = await supabase.from("blog_posts").delete().eq("id", p.id);
    setBusyPostId(null);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    void loadPosts();
  }

  async function toggleHandled(m: ContactMessage) {
    setBusyMsgId(m.id);
    const { error } = await supabase
      .from("contact_messages")
      .update({ handled: !m.handled })
      .eq("id", m.id);
    setBusyMsgId(null);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, handled: !m.handled } : x)));
  }

  async function deleteMessage(m: ContactMessage) {
    if (!confirm("Delete this message?")) return;
    setBusyMsgId(m.id);
    const { error } = await supabase.from("contact_messages").delete().eq("id", m.id);
    setBusyMsgId(null);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    toast.success("Deleted");
  }

  const visibleMessages = messages.filter((m) => (msgFilter === "unhandled" ? !m.handled : true));
  const unhandledCount = messages.filter((m) => !m.handled).length;

  return (
    <>
      {/* ===================== BLOG POSTS ===================== */}
      <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold">Blog posts</h2>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4" /> New post
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {posts.length} total · {posts.filter((p) => p.published).length} published
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPosts ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No posts yet — create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </TableCell>
                    <TableCell className="text-xs">{p.tag}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.published
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePublish(p)}
                          disabled={busyPostId === p.id}
                        >
                          {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {p.published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(p)} disabled={busyPostId === p.id}>
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deletePost(p)} disabled={busyPostId === p.id}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ===================== CONTACT MESSAGES ===================== */}
      <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold">
              Contact messages
              {unhandledCount > 0 && (
                <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {unhandledCount} new
                </span>
              )}
            </h2>
          </div>
          <div className="flex rounded-full border border-border bg-background p-1 text-sm">
            {(["unhandled", "all"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMsgFilter(k)}
                className={`rounded-full px-3 py-1 capitalize ${
                  msgFilter === k
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loadingMessages ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
              {msgFilter === "unhandled" ? "No new messages." : "No messages yet."}
            </div>
          ) : (
            visibleMessages.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{m.full_name}</p>
                      {m.handled && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Handled
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3 w-3" /> {m.email}
                      </a>
                      {m.phone && <span>· {m.phone}</span>}
                      <span>· {new Date(m.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleHandled(m)}
                      disabled={busyMsgId === m.id}
                    >
                      {m.handled ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      {m.handled ? "Mark new" : "Mark handled"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteMessage(m)} disabled={busyMsgId === m.id}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{m.message}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===================== POST EDITOR DIALOG ===================== */}
      {(editing || creating) && (
        <PostEditor
          post={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            void loadPosts();
          }}
        />
      )}
    </>
  );
}

function PostEditor({
  post,
  onClose,
  onSaved,
}: {
  post: BlogPost | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !post;
  const [form, setForm] = useState(
    post
      ? {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          body: post.body,
          cover_image_url: post.cover_image_url ?? "",
          tag: post.tag,
          read_minutes: post.read_minutes,
          published: post.published,
        }
      : { ...EMPTY_POST, cover_image_url: "" },
  );
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.slug || !form.title || !form.excerpt || !form.body) {
      toast.error("Slug, title, excerpt and body are required.");
      return;
    }
    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: form.body,
      cover_image_url: form.cover_image_url.trim() || null,
      tag: form.tag.trim() || "Insights",
      read_minutes: Math.max(1, Math.min(60, Number(form.read_minutes) || 4)),
      published: form.published,
      published_at: form.published
        ? post?.published_at ?? new Date().toISOString()
        : post?.published_at ?? null,
    };

    const { error } = isNew
      ? await supabase.from("blog_posts").insert(payload)
      : await supabase.from("blog_posts").update(payload).eq("id", post!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isNew ? "Post created" : "Post updated");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{isNew ? "New post" : "Edit post"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Title *">
            <input className="ed-input" value={form.title} onChange={(e) => update("title", e.target.value)} />
          </Field>
          <Field label="Slug * (URL)">
            <input
              className="ed-input"
              value={form.slug}
              onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="ac-care-bd"
            />
          </Field>
          <Field label="Tag">
            <input className="ed-input" value={form.tag} onChange={(e) => update("tag", e.target.value)} />
          </Field>
          <Field label="Read minutes">
            <input
              type="number"
              min={1}
              max={60}
              className="ed-input"
              value={form.read_minutes}
              onChange={(e) => update("read_minutes", Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Cover image URL">
          <input
            className="ed-input mt-3"
            placeholder="https://..."
            value={form.cover_image_url}
            onChange={(e) => update("cover_image_url", e.target.value)}
          />
        </Field>

        <Field label="Excerpt *">
          <textarea
            rows={2}
            className="ed-input mt-3"
            value={form.excerpt}
            onChange={(e) => update("excerpt", e.target.value)}
          />
        </Field>

        <Field label="Body * (Markdown-ish: ## headings, **bold**, `code`, lists, --- dividers)">
          <textarea
            rows={14}
            className="ed-input mt-3 font-mono text-xs"
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
          />
        </Field>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => update("published", e.target.checked)}
          />
          Publish immediately
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isNew ? "Create post" : "Save changes"}
          </Button>
        </div>

        <style>{`
          .ed-input { width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-border); background: var(--color-background); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; }
          .ed-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent); }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
