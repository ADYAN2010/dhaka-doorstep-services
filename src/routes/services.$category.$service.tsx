import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, BadgeCheck, Calendar as CalendarIcon, Clock, ImagePlus, MapPin,
  Phone, ShieldCheck, Star, Tag, Upload, Wallet, X, ChevronRight,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { ProviderCard } from "@/components/provider-card";
import { findService, findCategory } from "@/data/categories";
import { providers } from "@/data/providers";
import { areas } from "@/data/areas";
import { buildSeo, jsonLdScript, OG, SITE_URL, absUrl } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/services/$category/$service")({
  loader: ({ params }) => {
    const found = findService(params.category, params.service);
    if (!found) throw notFound();
    return found;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return buildSeo({
        title: "Service — Shebabd",
        description: "Service in Dhaka.",
        canonical: `/services/${params.category}/${params.service}`,
        noindex: true,
      });
    }
    const { service, category } = loaderData;
    const seo = buildSeo({
      title: `${service.name} in Dhaka — from ৳${service.startingPrice.toLocaleString()} | Shebabd`,
      description: `${service.short}. Book verified ${category.name.toLowerCase()} pros in Dhaka — transparent pricing, on-time service.`,
      canonical: `/services/${category.slug}/${service.slug}`,
      image: OG.services,
    });
    return {
      ...seo,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.name,
          description: service.short,
          serviceType: category.name,
          provider: {
            "@type": "LocalBusiness",
            "@id": `${SITE_URL}/#organization`,
            name: "Shebabd",
            url: SITE_URL,
          },
          areaServed: { "@type": "City", name: "Dhaka" },
          url: absUrl(`/services/${category.slug}/${service.slug}`),
          offers: {
            "@type": "Offer",
            price: service.startingPrice,
            priceCurrency: "BDT",
            availability: "https://schema.org/InStock",
            url: absUrl(`/services/${category.slug}/${service.slug}`),
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: 142,
          },
        }),
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
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Link to="/services" className="mt-4 inline-block text-primary underline">Back to services</Link>
      </div>
    </SiteShell>
  ),
  component: ServicePage,
});

const FAQS = [
  { q: "How quickly can a professional reach me?", a: "Most service categories in Dhaka have same-day availability. Once you submit a request, you'll typically get a confirmation within 30 minutes." },
  { q: "Can I reschedule or cancel after booking?", a: "Yes. You can reschedule free of charge up to 2 hours before the slot. Cancellations within 2 hours may incur a small visit fee." },
  { q: "Is the price fixed or estimated?", a: "Listed prices are starting prices. The professional will inspect on arrival and confirm the final quote — no work begins until you approve it." },
  { q: "What if I'm not satisfied with the work?", a: "Every service includes our re-do or refund guarantee. Report any issue within 48 hours and we'll send the pro back at no extra charge or process a refund." },
  { q: "How are professionals verified?", a: "All providers go through ID verification, skill assessment, and customer-rating checks before accepting jobs on the platform." },
];

const REVIEWS = [
  { name: "Tahmina R.", area: "Dhanmondi", rating: 5, when: "2 weeks ago", body: "Crew was on time, polite, and finished faster than I expected. Will book again." },
  { name: "Rafiq H.", area: "Gulshan", rating: 5, when: "1 month ago", body: "Transparent pricing and clean work. The professional explained every step before starting." },
  { name: "Nadia A.", area: "Uttara", rating: 4, when: "1 month ago", body: "Good service overall — minor delay in arrival but the work quality was excellent." },
];

const requestSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(120).or(z.literal("")),
  area: z.string().min(1, "Select your area"),
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time"),
  budget: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(800).optional().or(z.literal("")),
});

function ServicePage() {
  const { category, subcategory, service } = Route.useLoaderData();
  const matchingProviders = providers.filter((p) => p.categorySlug === category.slug).slice(0, 3);

  // Related services from the same category, excluding current
  const related = (findCategory(category.slug)?.subcategories ?? [])
    .flatMap((s) => s.services.map((sv) => ({ sub: s, sv })))
    .filter((x) => x.sv.slug !== service.slug)
    .slice(0, 6);

  return (
    <SiteShell>
      <div className="container-page py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/services" className="hover:text-foreground">Services</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/services/$category" params={{ category: category.slug }} className="hover:text-foreground">{category.name}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{service.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          {/* Main column */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">{category.name}</span>
              <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{subcategory.name}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl">{service.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-semibold text-foreground">4.8</span> · 142 reviews</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" /> All Dhaka areas</span>
              {service.duration && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {service.duration}</span>}
            </div>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              {service.short}. Carried out by trained, ID-verified professionals across Dhaka with our service guarantee — transparent pricing, on-time arrival, and no work without your approval.
            </p>

            {/* Stat tiles */}
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

            {/* What's included */}
            <section className="mt-10 rounded-2xl border border-border bg-card p-6">
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
            </section>

            {/* Pricing type */}
            <section className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground">Pricing</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">Recommended</p>
                  <p className="mt-1 text-xl font-bold text-foreground">৳{service.startingPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{service.unit ?? "starting"} · standard scope</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Custom quote</p>
                  <p className="mt-1 text-xl font-bold text-foreground">On request</p>
                  <p className="text-xs text-muted-foreground">Larger or non-standard jobs</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bulk / contract</p>
                  <p className="mt-1 text-xl font-bold text-foreground">Up to 20% off</p>
                  <p className="text-xs text-muted-foreground">Recurring or office plans</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Final quote is confirmed on inspection. You only pay after you approve the price.</p>
            </section>

            {/* Trust badges */}
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

            {/* Provider availability preview */}
            {matchingProviders.length > 0 && (
              <section className="mt-12">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Available professionals</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Top-rated pros ready to take this job today.</p>
                  </div>
                  <Link to="/providers" className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline md:inline-flex">See all <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {matchingProviders.map((p) => <ProviderCard key={p.slug} provider={p} />)}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="mt-12">
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-bold tracking-tight text-foreground">What customers say</h2>
                <span className="inline-flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> <span className="font-semibold text-foreground">4.8</span> <span className="text-muted-foreground">(142)</span></span>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {REVIEWS.map((r) => (
                  <article key={r.name} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-card-foreground">{r.body}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{r.name} · {r.area} · {r.when}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* Area coverage */}
            <section className="mt-12 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground">Areas we cover in Dhaka</h2>
              <p className="mt-1 text-sm text-muted-foreground">Same-day slots typically available across these neighborhoods.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {areas.map((a) => (
                  <Link key={a.slug} to="/dhaka/$area" params={{ area: a.slug }} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5">
                    <MapPin className="h-3 w-3 text-primary" /> {a.name}
                  </Link>
                ))}
              </div>
            </section>

            {/* Service request form */}
            <ServiceRequestForm serviceName={service.name} />

            {/* FAQ */}
            <section className="mt-12">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Frequently asked questions</h2>
              <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-border bg-card px-4">
                {FAQS.map((f, i) => (
                  <AccordionItem key={f.q} value={`q-${i}`} className={i === FAQS.length - 1 ? "border-b-0" : ""}>
                    <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* Related services */}
            {related.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Related services</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map(({ sv, sub }) => (
                    <Link
                      key={sv.slug}
                      to="/services/$category/$service"
                      params={{ category: category.slug, service: sv.slug }}
                      className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
                    >
                      <p className="text-xs font-medium text-muted-foreground">{sub.name}</p>
                      <h3 className="text-sm font-semibold text-card-foreground">{sv.name}</h3>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{sv.short}</p>
                      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs">
                        <span className="font-bold text-foreground">৳{sv.startingPrice.toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1 text-primary">View <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
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
                <a href="#request-form" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted">Request a quote</a>
              </div>

              <div className="mt-6 space-y-2.5 border-t border-border pt-5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Verified, background-checked professional</p>
                <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> Same-day slots usually available</p>
                <p className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-primary" /> Pay after the work is done</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> Talk to a human anytime</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

function ServiceRequestForm({ serviceName }: { serviceName: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    setFiles((prev) => [...prev, ...incoming].slice(0, 5));
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      area: String(fd.get("area") ?? ""),
      date: String(fd.get("date") ?? ""),
      time: String(fd.get("time") ?? ""),
      budget: String(fd.get("budget") ?? ""),
      notes: String(fd.get("notes") ?? ""),
    };
    const parsed = requestSchema.safeParse(payload);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) map[String(issue.path[0])] = issue.message;
      setErrors(map);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    // Frontend-only success — Cloud wiring lands later.
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Request received! We'll call you within 30 minutes to confirm.");
      (e.target as HTMLFormElement).reset();
      setFiles([]);
    }, 600);
  };

  const err = (k: string) => errors[k];

  return (
    <section id="request-form" className="mt-12 scroll-mt-24 rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Request {serviceName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tell us a bit about the job — we&apos;ll match you with a verified pro and call to confirm.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" /> No payment now</span>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2" noValidate>
        <Field label="Full name" htmlFor="name" error={err("name")}>
          <Input id="name" name="name" placeholder="Your name" autoComplete="name" required />
        </Field>
        <Field label="Phone" htmlFor="phone" error={err("phone")}>
          <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" required />
        </Field>
        <Field label="Email (optional)" htmlFor="email" error={err("email")}>
          <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="Area" htmlFor="area" error={err("area")}>
          <Select name="area">
            <SelectTrigger id="area"><SelectValue placeholder="Select your area" /></SelectTrigger>
            <SelectContent>
              {areas.map((a) => <SelectItem key={a.slug} value={a.name}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Preferred date" htmlFor="date" error={err("date")}>
          <div className="relative">
            <Input id="date" name="date" type="date" required />
            <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>
        <Field label="Preferred time" htmlFor="time" error={err("time")}>
          <Select name="time">
            <SelectTrigger id="time"><SelectValue placeholder="Pick a time slot" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning (8 AM – 12 PM)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12 PM – 4 PM)</SelectItem>
              <SelectItem value="evening">Evening (4 PM – 8 PM)</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Budget (optional)" htmlFor="budget" error={err("budget")}>
          <Select name="budget">
            <SelectTrigger id="budget"><SelectValue placeholder="Pick a range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="under-1k">Under ৳1,000</SelectItem>
              <SelectItem value="1-3k">৳1,000 – ৳3,000</SelectItem>
              <SelectItem value="3-10k">৳3,000 – ৳10,000</SelectItem>
              <SelectItem value="10k+">৳10,000+</SelectItem>
              <SelectItem value="open">Open / not sure</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Notes" htmlFor="notes" error={err("notes")}>
            <Textarea id="notes" name="notes" rows={4} placeholder="Tell us about the job — size, problems noticed, access details, etc." />
          </Field>
        </div>

        {/* Image upload UI */}
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium text-foreground">Photos (optional)</p>
          <label
            htmlFor="photos"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Upload className="h-5 w-5" /></span>
            <span className="text-sm font-medium text-foreground">Drop images here or click to upload</span>
            <span className="text-xs text-muted-foreground">PNG, JPG up to 5 MB · max 5 files</span>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="group relative overflow-hidden rounded-lg border border-border bg-surface">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {files.length < 5 && (
                <li>
                  <label htmlFor="photos" className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary">
                    <ImagePlus className="h-5 w-5" />
                  </label>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col items-start justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">By submitting, you agree to our <Link to="/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
          <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-soft sm:w-auto">
            {submitting ? "Sending..." : <>Send request <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
