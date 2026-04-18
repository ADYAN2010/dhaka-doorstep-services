import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Briefcase, Clock, MapPin, Star, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { findProvider } from "@/data/providers";
import { areas as ALL_AREAS } from "@/data/areas";

export const Route = createFileRoute("/provider/$slug")({
  loader: ({ params }) => {
    const provider = findProvider(params.slug);
    if (!provider) throw notFound();
    return { provider };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.provider;
    if (!p) return { meta: [{ title: "Provider — Shebabd" }] };
    return {
      meta: [
        { title: `${p.name} — ${p.categoryName} in Dhaka | Shebabd` },
        { name: "description", content: `${p.bio.slice(0, 150)}` },
        { property: "og:title", content: `${p.name} — ${p.categoryName} in Dhaka` },
        { property: "og:description", content: p.bio.slice(0, 150) },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Provider not found</h1>
        <Link to="/providers" className="mt-4 inline-block text-primary underline">Browse providers</Link>
      </div>
    </SiteShell>
  ),
  component: ProviderProfile,
});

function ProviderProfile() {
  const { provider } = Route.useLoaderData();
  const areaNames = provider.areas.map((s: string) => ALL_AREAS.find((a) => a.slug === s)?.name).filter(Boolean) as string[];

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container-page py-14">
          <Link to="/providers" className="text-xs font-medium text-muted-foreground hover:text-foreground">← All providers</Link>

          <div className="mt-6 grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-primary text-3xl font-bold text-primary-foreground shadow-glow">
              {provider.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{provider.name}</h1>
                {provider.verified && <BadgeCheck className="h-6 w-6 text-primary" aria-label="Verified" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{provider.categoryName} · {provider.type === "agency" ? "Agency" : "Individual professional"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /><span className="font-semibold text-foreground">{provider.rating.toFixed(1)}</span> · {provider.reviews} reviews</span>
                <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {provider.jobsCompleted.toLocaleString()} jobs done</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {provider.responseTime}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {provider.yearsExperience} yrs</span>
              </div>
            </div>
            <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">Book this provider <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-xl font-semibold text-foreground">About</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{provider.bio}</p>

            <h2 className="mt-10 text-xl font-semibold text-foreground">Coverage areas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {areaNames.map((n) => (
                <span key={n} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {n}
                </span>
              ))}
            </div>

            <h2 className="mt-10 text-xl font-semibold text-foreground">What customers say</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { n: "Tasnim A.", r: 5, q: "Showed up exactly on time, work was clean. Very polite team." },
                { n: "Imran H.", r: 5, q: "Gave a fair quote, completed the job in one visit. Highly recommend." },
                { n: "Nadia R.", r: 4, q: "Great work overall. Will definitely book again next time." },
                { n: "Shafiq A.", r: 5, q: "Best service I've used through any platform. Worth every taka." },
              ].map((t, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex gap-0.5 text-warning">{Array.from({ length: t.r }).map((_, k) => <Star key={k} className="h-3.5 w-3.5 fill-warning" />)}</div>
                  <p className="mt-2 text-sm text-card-foreground">&ldquo;{t.q}&rdquo;</p>
                  <p className="mt-3 text-xs text-muted-foreground">— {t.n}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pricing</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{provider.pricing}</p>
              <Link to="/book" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft">Book now <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/contact" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted">Message us</Link>
              <div className="mt-5 space-y-2.5 border-t border-border pt-5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> ID + background verified</p>
                <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> Avg. response: {provider.responseTime}</p>
                <p className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> {provider.rating.toFixed(1)} from {provider.reviews} reviews</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
