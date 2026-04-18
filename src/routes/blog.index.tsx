import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () =>
    buildSeo({
      title: "Blog & Insights — Shebabd",
      description:
        "Tips, guides and stories about home services, providers and the future of Bangladesh's service economy.",
      canonical: "/blog",
      image: OG.home,
    }),
  component: BlogPage,
});

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  tag: string;
  read_minutes: number;
  published_at: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BlogPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image_url, tag, read_minutes, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setPosts((data ?? []) as Post[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Blog"
        title={<>Insights from <span className="text-gradient-primary">Bangladesh&apos;s service economy</span></>}
        description="Tips for customers, stories from providers, and what we're learning as we build."
      />
      <section className="container-page py-12">
        {error ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-destructive">Couldn&apos;t load posts: {error}</p>
          </div>
        ) : posts === null ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-base font-semibold text-foreground">No posts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon — fresh insights are on the way.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
              >
                {p.cover_image_url && (
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={p.cover_image_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <span className="inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    {p.tag}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-card-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.published_at)} · {p.read_minutes} min read
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                      Read <ArrowRight className="h-3.5 w-3.5" />
                    </span>
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
