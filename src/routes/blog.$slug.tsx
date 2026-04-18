import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { buildSeo, jsonLdScript, OG, SITE_URL, absUrl } from "@/lib/seo";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  tag: string;
  read_minutes: number;
  published_at: string | null;
};

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, body, cover_image_url, tag, read_minutes, published_at")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw notFound();
    return { post: data as Post };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.post;
    if (!p) {
      return buildSeo({
        title: "Post — Shebabd",
        description: "Blog post on Shebabd.",
        canonical: `/blog/${params.slug}`,
        noindex: true,
      });
    }
    const seo = buildSeo({
      title: `${p.title} — Shebabd`,
      description: p.excerpt,
      canonical: `/blog/${p.slug}`,
      image: p.cover_image_url ?? OG.home,
      type: "article",
    });
    return {
      ...seo,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: p.title,
          description: p.excerpt,
          image: p.cover_image_url ? [absUrl(p.cover_image_url)] : [absUrl(OG.home)],
          datePublished: p.published_at ?? undefined,
          author: { "@type": "Organization", name: "Shebabd" },
          publisher: {
            "@type": "Organization",
            name: "Shebabd",
            "@id": `${SITE_URL}/#organization`,
          },
          mainEntityOfPage: absUrl(`/blog/${p.slug}`),
        }),
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Post not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed or unpublished.</p>
        <Link to="/blog" className="mt-6 inline-flex rounded-full bg-muted px-4 py-2 text-sm font-medium">
          ← All posts
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">Couldn&apos;t load this post</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/blog" className="mt-6 inline-flex rounded-full bg-muted px-4 py-2 text-sm font-medium">
          ← All posts
        </Link>
      </div>
    </SiteShell>
  ),
  component: PostPage,
});

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Lightweight Markdown-ish renderer.
 * Supports: ## headings, --- separators, blank-line paragraphs, bold (**x**), inline `code`.
 * Keeps things safe (no raw HTML).
 */
function renderBody(body: string) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, i) => {
    if (block === "---") {
      return <hr key={i} className="my-8 border-border" />;
    }
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="mt-10 text-2xl font-bold tracking-tight text-foreground">
          {block.slice(3).trim()}
        </h2>
      );
    }
    if (block.startsWith("# ")) {
      return (
        <h2 key={i} className="mt-10 text-3xl font-bold tracking-tight text-foreground">
          {block.slice(2).trim()}
        </h2>
      );
    }
    // Numbered list
    if (/^\d+\.\s/.test(block)) {
      const items = block.split(/\n/).map((l) => l.replace(/^\d+\.\s/, "").trim());
      return (
        <ol key={i} className="mt-4 list-decimal space-y-1.5 pl-6 text-base leading-relaxed text-muted-foreground">
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ol>
      );
    }
    // Bullet list
    if (/^-\s/.test(block)) {
      const items = block.split(/\n/).map((l) => l.replace(/^-\s/, "").trim());
      return (
        <ul key={i} className="mt-4 list-disc space-y-1.5 pl-6 text-base leading-relaxed text-muted-foreground">
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ul>
      );
    }
    return (
      <p key={i} className="mt-4 text-base leading-relaxed text-muted-foreground">
        {renderInline(block)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Bold: **x**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-muted px-1.5 py-0.5 text-sm">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

function PostPage() {
  const { post } = Route.useLoaderData();
  return (
    <SiteShell>
      <article>
        {post.cover_image_url && (
          <div className="aspect-[21/9] w-full overflow-hidden bg-muted">
            <img
              src={post.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="container-page py-12">
          <div className="mx-auto max-w-3xl">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All posts
            </Link>

            <span className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {post.tag}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-border pb-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {formatDate(post.published_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {post.read_minutes} min read
              </span>
            </div>

            <div className="mt-2">{renderBody(post.body)}</div>

            <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-base font-semibold text-foreground">Need a service in Dhaka?</p>
              <p className="mt-1 text-sm text-muted-foreground">Verified providers, transparent pricing, same-day slots.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link to="/book" className="inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft">
                  Book a service
                </Link>
                <Link to="/services" className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                  Browse all services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
