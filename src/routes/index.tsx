import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, BadgeCheck, Clock, Headphones, MapPin, Search,
  ShieldCheck, Sparkles, Star, Wallet, Zap, Users,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import heroIllustration from "@/assets/hero-illustration.png";
import { SiteShell } from "@/components/site-shell";
import { HeroSearch } from "@/components/hero-search";
import { CategoryCard } from "@/components/category-card";
import { ProviderCard } from "@/components/provider-card";
import { Reveal } from "@/components/reveal";
import { categories } from "@/data/categories";
import { areas } from "@/data/areas";
import { featuredProviders } from "@/data/providers";
import { testimonials } from "@/data/testimonials";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shebabd — Bangladesh's All-in-One Service Platform" },
      {
        name: "description",
        content:
          "Book verified professionals in Dhaka for home, personal, business and technical services. Fast, simple, reliable.",
      },
      { property: "og:title", content: "Shebabd — Bangladesh's All-in-One Service Platform" },
      {
        property: "og:description",
        content:
          "From home services to business solutions — book trusted professionals in Dhaka, fast.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteShell>
      <Hero />
      <PopularCategories />
      <HowItWorks />
      <WhyUs />
      <FeaturedProviders />
      <AreasGrid />
      <Testimonials />
      <ProviderCTA />
      <FinalCTA />
    </SiteShell>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-hero text-white">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        width={1920}
        height={1080}
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-midnight via-midnight/70 to-transparent" />

      {/* Floating illustration — large screens only, decorative */}
      <img
        src={heroIllustration}
        alt=""
        aria-hidden="true"
        width={540}
        height={540}
        className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 select-none opacity-90 drop-shadow-2xl lg:block xl:right-8"
        style={{ width: "min(42vw, 540px)", animation: "float 6s ease-in-out infinite" }}
      />

      <div className="container-page py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            Now serving Dhaka · Coming soon: all 64 districts
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            All Services, One Trusted{" "}
            <span className="text-gradient-primary">Platform for Bangladesh</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 md:text-lg">
            Book verified professionals in Dhaka for home, personal, business and technical services
            — fast, simple, and reliable.
          </p>

          <div className="mt-8">
            <HeroSearch />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              Book a Service <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/become-provider"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
            >
              Become a Provider
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" /> Verified providers</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Background checked</span>
            <span className="inline-flex items-center gap-1.5"><Wallet className="h-4 w-4 text-primary" /> Transparent pricing</span>
            <span className="inline-flex items-center gap-1.5"><Headphones className="h-4 w-4 text-primary" /> Local support team</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PopularCategories() {
  const top = categories.slice(0, 12);
  return (
    <section className="container-page py-16 md:py-24">
      <SectionHeader
        eyebrow="Browse"
        title="Popular service categories"
        description="Find the right professional in seconds. From everyday fixes to specialist work — all in one place."
        action={{ label: "All services", to: "/services" }}
      />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {top.map((c, i) => (
          <Reveal key={c.slug} delay={i * 50}>
            <CategoryCard category={c} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Search, title: "Choose Your Service", desc: "Search or browse 200+ services across Dhaka." },
    { icon: Users, title: "We Handle the Match", desc: "We assign the best verified provider for your job and area." },
    { icon: Sparkles, title: "Get It Done with Confidence", desc: "Track, pay, and review — all from one place. Service guarantee included." },
  ];
  return (
    <section className="border-y border-border bg-surface">
      <div className="container-page py-16 md:py-24">
        <SectionHeader
          eyebrow="How it works"
          title="The Provider → We → Consumer model"
          description="Skilled providers + our quality layer + happy customers. We handle verification, matching, support, and trust so you don't have to."
          centered
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                Step {i + 1}
              </span>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    { icon: BadgeCheck, title: "Verified providers", desc: "Every pro passes ID + background checks." },
    { icon: Wallet, title: "Transparent pricing", desc: "Know the price before you book. No surprises." },
    { icon: Zap, title: "Fast response", desc: "Most jobs are matched within an hour." },
    { icon: Headphones, title: "Local support", desc: "Bangla-speaking team on call when you need help." },
    { icon: ShieldCheck, title: "Service guarantee", desc: "Not happy? We re-do or refund. Simple." },
    { icon: Star, title: "Real reviews", desc: "Honest ratings from real, completed bookings." },
  ];
  return (
    <section className="container-page py-16 md:py-24">
      <SectionHeader
        eyebrow="Why us"
        title="Why Dhaka chooses us"
        description="Built for Bangladesh — local providers, local quality, local support."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-border bg-card p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <it.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-card-foreground">{it.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedProviders() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="container-page py-16 md:py-24">
        <SectionHeader
          eyebrow="Featured"
          title="Top-rated providers in Dhaka"
          description="Hand-picked, verified pros with consistent 5-star service."
          action={{ label: "Browse all providers", to: "/providers" }}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredProviders.map((p) => (
            <ProviderCard key={p.slug} provider={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AreasGrid() {
  return (
    <section className="container-page py-16 md:py-24">
      <SectionHeader
        eyebrow="Coverage"
        title="Services by area in Dhaka"
        description="We cover every major neighborhood. Pick your area for local availability."
        action={{ label: "All areas", to: "/areas" }}
      />
      <div className="mt-8 flex flex-wrap gap-2">
        {areas.map((a) => (
          <Link
            key={a.slug}
            to="/dhaka/$area"
            params={{ area: a.slug }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {a.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-t border-border bg-gradient-subtle">
      <div className="container-page py-16 md:py-24">
        <SectionHeader
          eyebrow="Real customers"
          title="Loved by people across Dhaka"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-1 text-warning">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning" />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-card-foreground">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.area} · {t.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProviderCTA() {
  return (
    <section className="container-page py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-hero p-8 text-white md:p-14">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              For Providers
            </span>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">Grow your service business with us</h2>
            <p className="mt-3 max-w-md text-white/75">
              Get a steady stream of verified leads in your area. We handle marketing, booking and
              support — you focus on doing great work.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/become-provider"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Apply to join <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                How it works
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { v: "10k+", l: "Bookings handled" },
              { v: "1,200+", l: "Active providers" },
              { v: "4.9★", l: "Avg. rating" },
              { v: "11", l: "Areas covered" },
              { v: "< 1 hr", l: "Avg. match time" },
              { v: "100%", l: "Service guarantee" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-2xl font-bold">{s.v}</p>
                <p className="mt-1 text-xs text-white/70">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="container-page pb-20">
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-elevated md:p-14">
        <Clock className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Need a service today?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Book trusted professionals in Dhaka in minutes. Same-day availability for most categories.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            Book Now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/services" className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground hover:bg-muted">
            Explore Services
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  centered,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; to: string };
  centered?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-3 ${centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={centered ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
        )}
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-base text-muted-foreground">{description}</p>}
      </div>
      {action && !centered && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
