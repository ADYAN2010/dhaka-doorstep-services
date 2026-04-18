import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog & Insights — Shebabd" },
      { name: "description", content: "Tips, guides and stories about home services, providers and the future of Bangladesh's service economy." },
      { property: "og:title", content: "Blog & Insights — Shebabd" },
      { property: "og:description", content: "Tips, guides and stories from Bangladesh's service economy." },
    ],
  }),
  component: BlogPage,
});

const POSTS = [
  { slug: "ac-care-bd", title: "How to make your AC last 10 years in Dhaka heat", excerpt: "Five maintenance habits that double the life of any AC unit in Bangladesh's climate.", tag: "Home Tips", date: "Apr 12, 2026" },
  { slug: "choosing-electrician", title: "How to pick a trustworthy electrician in Dhaka", excerpt: "Five red flags to watch out for, and how Shebabd's verification process catches them.", tag: "Trust & Safety", date: "Apr 4, 2026" },
  { slug: "deep-cleaning-checklist", title: "The 30-point deep home cleaning checklist", excerpt: "Exactly what should be covered in a professional apartment deep clean.", tag: "Home Tips", date: "Mar 28, 2026" },
  { slug: "provider-story-cool-tech", title: "Provider story: How Cool Tech BD scaled from 1 to 24 technicians", excerpt: "An honest look at building a service business in Dhaka with platform support.", tag: "Provider Stories", date: "Mar 20, 2026" },
];

function BlogPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Blog"
        title={<>Insights from <span className="text-gradient-primary">Bangladesh&apos;s service economy</span></>}
        description="Tips for customers, stories from providers, and what we're learning as we build."
      />
      <section className="container-page py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {POSTS.map((p) => (
            <article key={p.slug} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">{p.tag}</span>
              <h3 className="mt-3 text-xl font-semibold text-card-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
              <p className="mt-4 text-xs text-muted-foreground">{p.date} · 4 min read</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
