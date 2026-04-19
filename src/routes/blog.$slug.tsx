import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildSeo } from "@/lib/seo";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tag: string;
  cover_image_url: string | null;
  read_minutes: number;
  published_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  head: ({ params }) => ({
    ...buildSeo({
      title: "Article — Shebabd Blog",
      description:
        "Read this guide on the Shebabd Blog — practical tips for booking and hiring verified pros across Dhaka.",
      canonical: `/blog/${params.slug}`,
      type: "article",
    }),
  }),
  notFoundComponent: () => (
    <SiteShell>
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-3xl font-bold">Article not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This post may have been unpublished or moved.
        </p>
        <Link to="/blog" className="mt-6">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to blog
          </Button>
        </Link>
      </section>
    </SiteShell>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <SiteShell>
        <section className="container-page py-16 text-center">
          <h1 className="text-2xl font-bold">Couldn't load this article</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Retry
          </Button>
        </section>
      </SiteShell>
    );
  },
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setMissing(false);
      const { data, error: e } = await supabase
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, body, tag, cover_image_url, read_minutes, published_at, created_at, published",
        )
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (cancelled) return;
      if (e) {
        setError(e.message);
      } else if (!data) {
        setMissing(true);
      } else {
        setPost(data as Post);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <SiteShell>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading article…
        </div>
      </SiteShell>
    );
  }

  if (missing) throw notFound();

  if (error || !post) {
    return (
      <SiteShell>
        <section className="container-page py-16 text-center">
          <h1 className="text-2xl font-bold">Couldn't load this article</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link to="/blog" className="mt-6 inline-block">
            <Button variant="outline">Back to blog</Button>
          </Link>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <article className="container-page max-w-3xl py-10">
        <Link
          to="/blog"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>

        <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
          {post.tag}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{post.title}</h1>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
          </span>
          <span>{post.read_minutes} min read</span>
        </div>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover"
            loading="lazy"
          />
        )}

        <p className="mt-6 text-lg text-muted-foreground">{post.excerpt}</p>

        <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap text-foreground/90 [&_a]:text-primary">
          {post.body}
        </div>
      </article>
    </SiteShell>
  );
}
