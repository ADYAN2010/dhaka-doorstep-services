import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Clock, MapPin, ShieldCheck, Tag, Wallet } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ProviderCard } from "@/components/provider-card";
import { findService } from "@/data/categories";
import { providers } from "@/data/providers";

export const Route = createFileRoute("/services/$category/$service")({
  loader: ({ params }) => {
    const found = findService(params.category, params.service);
    if (!found) throw notFound();
    return found;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Service — Shebabd" }] };
    const { service, category } = loaderData;
    return {
      meta: [
        { title: `${service.name} in Dhaka — from ৳${service.startingPrice.toLocaleString()} | Shebabd` },
        { name: "description", content: `${service.short}. Book verified ${category.name.toLowerCase()} pros in Dhaka — transparent pricing, on-time service.` },
        { property: "og:title", content: `${service.name} in Dhaka — Shebabd` },
        { property: "og:description", content: service.short },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Service not found</h1>
        <Link to="/services" className="mt-4 inline-block text-primary underline">Browse all services</Link>
      </div>
    </SiteShell>
  ),
  component: ServicePage,
});

function ServicePage() {
  const { category, subcategory, service } = Route.useLoaderData();
  const matchingProviders = providers.filter((p) => p.categorySlug === category.slug).slice(0, 3);

  return (
    <SiteShell>
      <div className="container-page py-10">
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link to="/services" className="hover:text-foreground">Services</Link>
          {" / "}
          <Link to="/services/$category" params={{ category: category.slug }} className="hover:text-foreground">{category.name}</Link>
          {" / "}
          <span className="text-foreground">{service.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">{subcategory.name}</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl">{service.name}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{service.short}. Carried out by trained, verified professionals in Dhaka with our service guarantee.</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Tag, label: "Starting price", value: `৳${service.startingPrice.toLocaleString()} ${service.unit ?? ""}`.trim() },
                { icon: Clock, label: "Estimated time", value: service.duration ?? "Flexible" },
                { icon: MapPin, label: "Coverage", value: "All Dhaka areas" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-semibold text-card-foreground">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground">What&apos;s included</h2>
              <ul className="mt-4 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
                {[
                  "Trained, ID-verified professional",
                  "All standard tools & materials",
                  "Pre-arrival call confirmation",
                  "Transparent itemized invoice",
                  "Service guarantee on workmanship",
                  "After-service customer support",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{b}</span></li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, t: "Verified Pros", d: "Background-checked" },
                { icon: Wallet, t: "Transparent Pricing", d: "No hidden charges" },
                { icon: BadgeCheck, t: "Re-do or Refund", d: "Service guarantee" },
              ].map((it) => (
                <div key={it.t} className="rounded-xl border border-border bg-surface p-4">
                  <it.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-semibold text-foreground">{it.t}</p>
                  <p className="text-xs text-muted-foreground">{it.d}</p>
                </div>
              ))}
            </div>

            {matchingProviders.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Providers for this service</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {matchingProviders.map((p) => <ProviderCard key={p.slug} provider={p} />)}
                </div>
              </div>
            )}
          </div>

          {/* Booking sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-elevated">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Starting from</p>
              <p className="mt-1 text-3xl font-bold text-foreground">৳{service.startingPrice.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{service.unit}</span></p>
              <p className="mt-2 text-xs text-muted-foreground">Final price confirmed on inspection. No payment until you approve.</p>

              <div className="mt-5 flex flex-col gap-2">
                <Link to="/book" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft">Book this service <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/book" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted">Request a quote</Link>
              </div>

              <div className="mt-6 space-y-2.5 border-t border-border pt-5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Verified, background-checked professional</p>
                <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> Same-day slots usually available</p>
                <p className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-primary" /> Pay after the work is done</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
