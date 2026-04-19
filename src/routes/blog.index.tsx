import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Loader2, Newspaper } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { buildSeo } from "@/lib/seo";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  cover_image_url: string | null;
  read_minutes: number;
  published_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/blog/")({
  component: BlogIndexPage,
  head: () => ({
    ...buildSeo({
      title: "Insights & guides — Shebabd Blog",
      description:
        "Tips, guides, and trusted advice on home services, hiring verified pros, and getting the most out of Shebabd in Dhaka.",
      canonical: "/blog",
    }),
  }),
});

function BlogIndexPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error: e } = await supabase
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, tag, cover_image_url, read_minutes, published_at, created_at",
        )
        .eq("published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (e) {
        setError(e.message);
      } else {
        setPosts((data ?? []) as Post[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Blog"
        title="Insights, guides & trusted advice"
        description="Practical tips on hiring verified pros, home maintenance, and making the most of every booking."
      />
      <section className="container-page py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading articles…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Newspaper className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">No articles yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We're working on the first guides — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
              >
                {p.cover_image_url ? (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-subtle">
                    <Newspaper className="h-10 w-10 text-muted-foreground/60" />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {p.tag}
                  </span>
                  <h2 className="text-lg font-semibold text-card-foreground group-hover:text-primary">
                    {p.title}
                  </h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>
                  <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(p.published_at ?? p.created_at).toLocaleDateString()}
                    </span>
                    <span>{p.read_minutes} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
