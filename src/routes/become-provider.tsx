import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Headphones,
  IdCard,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/data/categories";
import { areas } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { buildSeo, OG } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/become-provider")({
  head: () =>
    buildSeo({
      title: "Become a Provider — Grow your service business with Shebabd",
      description:
        "Get verified leads in Dhaka. We handle marketing, bookings and customer support — you focus on great work. Apply in 5 minutes.",
      canonical: "/become-provider",
      image: OG.becomeProvider,
    }),
  component: BecomeProviderPage,
});

const APPLICANT_TYPES = ["Individual professional", "Small agency / team", "Established company"] as const;
const EXPERIENCE = ["0–1 years", "2–5 years", "6–10 years", "10+ years"] as const;
const TEAM_SIZES = ["Just me", "2–5", "6–15", "16+"] as const;
const AVAILABILITIES = ["Full-time", "Part-time", "Weekends only"] as const;

const STEPS = [
  { key: "about", label: "About you", icon: Users },
  { key: "service", label: "Service & area", icon: Briefcase },
  { key: "experience", label: "Experience", icon: BadgeCheck },
  { key: "documents", label: "Documents", icon: ShieldCheck },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  business_name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d\s\-()]+$/, "Phone can only contain digits, spaces, +, -, ( and )"),
  email: z.string().trim().email("Invalid email").max(255),
  applicant_type: z.enum(APPLICANT_TYPES),
  category: z.string().min(1, "Please choose a service category"),
  experience: z.enum(EXPERIENCE),
  coverage_area: z.string().min(1, "Please choose a coverage area"),
  team_size: z.enum(TEAM_SIZES),
  availability: z.enum(AVAILABILITIES),
  about: z.string().max(1000).optional().or(z.literal("")),
});

type FormState = z.input<typeof applicationSchema>;

function BecomeProviderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<StepKey>("about");
  const [submitted, setSubmitted] = useState<{ ref: string } | null>(null);
  const [form, setForm] = useState<FormState>({
    full_name: "",
    business_name: "",
    phone: "",
    email: "",
    applicant_type: APPLICANT_TYPES[0],
    category: "",
    experience: EXPERIENCE[0],
    coverage_area: "",
    team_size: TEAM_SIZES[0],
    availability: AVAILABILITIES[0],
    about: "",
  });

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const isLast = stepIndex === STEPS.length - 1;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(target: StepKey): string | null {
    if (target === "about") {
      if (!form.full_name || form.full_name.trim().length < 2) return "Please enter your full name.";
      if (!form.phone || form.phone.trim().length < 7) return "Please enter a valid phone number.";
      if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email.";
    }
    if (target === "service") {
      if (!form.category) return "Please choose a service category.";
      if (!form.coverage_area) return "Please choose a coverage area.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.key);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.key);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLast) { goNext(); return; }
    // Validate all
    for (const s of STEPS) {
      const err = validateStep(s.key);
      if (err) { setStep(s.key); toast.error(err); return; }
    }
    const parsed = applicationSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSubmitting(true);
    const aboutCombined = [
      parsed.data.business_name ? `Business: ${parsed.data.business_name}` : null,
      parsed.data.about || null,
    ].filter(Boolean).join("\n\n");

    const { data, error } = await supabase
      .from("provider_applications")
      .insert({
        user_id: user?.id ?? null,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        applicant_type: parsed.data.applicant_type,
        category: parsed.data.category,
        experience: parsed.data.experience,
        coverage_area: parsed.data.coverage_area,
        team_size: parsed.data.team_size,
        availability: parsed.data.availability,
        about: aboutCombined || null,
      })
      .select("id")
      .single();
    setSubmitting(false);

    if (error || !data) {
      toast.error(error?.message ?? "Couldn't submit application. Please try again.");
      return;
    }
    setSubmitted({ ref: (data.id as string).slice(0, 8).toUpperCase() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return <SuccessState refCode={submitted.ref} onHome={() => navigate({ to: "/" })} />;
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="For providers"
        title={<>Grow your service business <span className="text-gradient-primary">with us</span></>}
        description="Join Bangladesh's fastest-growing service marketplace. Verified leads in your area, weekly payouts, and a support team behind you."
      />

      {/* Benefits */}
      <section className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: TrendingUp, t: "More bookings", d: "Steady, verified leads in your area." },
            { icon: Wallet, t: "Weekly payouts", d: "Get paid reliably, every week." },
            { icon: ShieldCheck, t: "Trust & badge", d: "Verified profile boosts conversions." },
            { icon: Headphones, t: "Support team", d: "We handle billing, disputes & customer chat." },
          ].map((it) => (
            <div key={it.t} className="rounded-2xl border border-border bg-card p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <it.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-card-foreground">{it.t}</h3>
              <p className="text-xs text-muted-foreground">{it.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="container-page pb-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8"
          >
            <Stepper currentIndex={stepIndex} />

            <div className="mt-8">
              {step === "about" && (
                <Section
                  title="Tell us about you"
                  blurb="We use this to set up your provider profile and contact you for verification."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name *">
                      <input className="input" placeholder="Your name" required maxLength={120} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
                    </Field>
                    <Field label="Business name (optional)">
                      <input className="input" placeholder="Trading or company name" maxLength={120} value={form.business_name ?? ""} onChange={(e) => update("business_name", e.target.value)} />
                    </Field>
                    <Field label="Phone *">
                      <input className="input" type="tel" placeholder="+880 1700 000000" required maxLength={20} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                    </Field>
                    <Field label="Email *">
                      <input className="input" type="email" required maxLength={255} value={form.email} onChange={(e) => update("email", e.target.value)} />
                    </Field>
                    <Field label="I am applying as">
                      <select className="input" value={form.applicant_type} onChange={(e) => update("applicant_type", e.target.value as FormState["applicant_type"])}>
                        {APPLICANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                  </div>
                </Section>
              )}

              {step === "service" && (
                <Section
                  title="Service & coverage"
                  blurb="Tell us what you do and where you can reliably deliver service."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Service category *">
                      <select className="input" required value={form.category} onChange={(e) => update("category", e.target.value)}>
                        <option value="">Choose a category</option>
                        {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Coverage area *">
                      <select className="input" required value={form.coverage_area} onChange={(e) => update("coverage_area", e.target.value)}>
                        <option value="">Select area</option>
                        {areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                        <option value="all-dhaka">All Dhaka</option>
                      </select>
                    </Field>
                    <Field label="Team size">
                      <select className="input" value={form.team_size} onChange={(e) => update("team_size", e.target.value as FormState["team_size"])}>
                        {TEAM_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Availability">
                      <select className="input" value={form.availability} onChange={(e) => update("availability", e.target.value as FormState["availability"])}>
                        {AVAILABILITIES.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </Field>
                  </div>
                </Section>
              )}

              {step === "experience" && (
                <Section
                  title="Experience & portfolio"
                  blurb="Help us match you with the right jobs. Share your background and any relevant portfolio links."
                >
                  <div className="grid gap-4">
                    <Field label="Years of experience *">
                      <select className="input" value={form.experience} onChange={(e) => update("experience", e.target.value as FormState["experience"])}>
                        {EXPERIENCE.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </Field>
                    <Field label="About you / portfolio link">
                      <textarea
                        rows={5}
                        className="input"
                        placeholder="Briefly describe your work, achievements, certifications, or paste a portfolio link (Behance, Drive, website)."
                        maxLength={1000}
                        value={form.about ?? ""}
                        onChange={(e) => update("about", e.target.value)}
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">{(form.about ?? "").length}/1000</p>
                    </Field>
                  </div>
                </Section>
              )}

              {step === "documents" && (
                <Section
                  title="Verification documents"
                  blurb="To keep customers safe, we verify every provider. You can upload now or we'll collect during your onboarding call."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <UploadBox icon={IdCard} title="National ID (NID)" subtitle="Front & back, JPG/PNG/PDF" />
                    <UploadBox icon={FileText} title="Trade license" subtitle="If applicable — JPG/PNG/PDF" />
                    <UploadBox icon={BadgeCheck} title="Certifications" subtitle="Optional but boosts trust" />
                    <UploadBox icon={Briefcase} title="Portfolio samples" subtitle="Up to 5 photos of past work" />
                  </div>
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Your documents are private and only seen by our verification team. We never share them with customers.
                  </div>
                </Section>
              )}
            </div>

            {/* Step actions */}
            <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={stepIndex === 0 || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLast ? (submitting ? "Submitting…" : "Submit application") : "Continue"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              By applying, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
            </p>

            <style>{`
              .input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-background); padding: 0.625rem 0.875rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; transition: border-color 150ms; }
              .input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent); }
              .input::placeholder { color: var(--color-muted-foreground); }
            `}</style>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-gradient-card p-6">
              <h3 className="text-base font-semibold text-foreground">How approval works</h3>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                {[
                  { icon: Briefcase, t: "Submit your application" },
                  { icon: ShieldCheck, t: "We verify ID + experience" },
                  { icon: Calendar, t: "Quick onboarding call (15 min)" },
                  { icon: BadgeCheck, t: "Profile goes live, leads start coming" },
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span><span className="font-semibold text-foreground">Step {i + 1}:</span> {s.t}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-xl bg-primary/5 p-4 text-xs text-muted-foreground">
                Questions? Email <a href="mailto:partners@shebabd.com" className="font-semibold text-primary">partners@shebabd.com</a>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground">What you get on day 1</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <Bullet icon={MapPin} text="Verified leads in your selected coverage area" />
                <Bullet icon={Phone} text="Customer pre-qualified by our support team" />
                <Bullet icon={Wallet} text="Transparent pricing & weekly bank/bKash payouts" />
                <Bullet icon={Clock} text="Set your own availability — no minimum hours" />
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground">
              <Sparkles className="mb-2 h-4 w-4 text-primary" />
              <p className="font-semibold text-foreground">Earn more, faster</p>
              <p className="mt-1">Top providers earn ৳40,000+ per month within their first 90 days.</p>
            </div>
          </aside>
        </div>
      </section>

      {/* Trust strip */}
      <TrustStrip />

      {/* FAQ */}
      <ProviderFAQ />
    </SiteShell>
  );
}

/* ----------------- Sub-components ----------------- */

function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const Icon = s.icon;
        return (
          <li key={s.key} className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                done && "border-success/40 bg-success/10 text-success",
                current && "border-primary bg-primary/10 text-primary shadow-soft",
                !done && !current && "border-border bg-card text-muted-foreground",
              )}
            >
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                done && "bg-success text-success-foreground",
                current && "bg-primary text-primary-foreground",
                !done && !current && "bg-muted text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="hidden h-px w-6 bg-border sm:block" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function Section({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Bullet({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{text}</span>
    </li>
  );
}

function UploadBox({ icon: Icon, title, subtitle }: { icon: typeof Upload; title: string; subtitle: string }) {
  return (
    <label className="flex cursor-not-allowed items-start gap-3 rounded-xl border border-dashed border-border bg-background p-4 text-sm hover:bg-muted/50">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
          <Upload className="h-3 w-3" /> Coming soon — upload during onboarding call
        </p>
      </div>
      <input type="file" className="hidden" disabled />
    </label>
  );
}

function TrustStrip() {
  const stats = [
    { v: "2,400+", l: "Verified providers" },
    { v: "৳40K+", l: "Avg top-earner / month" },
    { v: "1 hr", l: "Avg lead response" },
    { v: "98%", l: "On-time payouts" },
  ];
  return (
    <section className="container-page pb-12">
      <div className="grid gap-4 rounded-2xl border border-border bg-gradient-card p-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center sm:text-left">
            <p className="text-2xl font-bold text-gradient-primary">{s.v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  { q: "How long does verification take?", a: "Most applications are reviewed within 2–5 business days. After your onboarding call, your profile typically goes live within 24 hours." },
  { q: "Are there any joining or monthly fees?", a: "No. We never charge providers to join. We only take a small commission on completed bookings — no leads charged, no monthly fees." },
  { q: "How do I get paid?", a: "Earnings are paid weekly via bank transfer or bKash. You can track every booking, commission and payout in your provider dashboard." },
  { q: "Can I set my own schedule?", a: "Yes. You control your availability, coverage areas and the categories you accept. Pause or resume leads anytime from the dashboard." },
  { q: "Do I need a trade license?", a: "Not always — individual professionals can join with just NID. A trade license is required only for established companies and helps you rank higher." },
  { q: "What happens if a customer cancels?", a: "If a job is cancelled after you've been dispatched, we apply a fair compensation policy. Repeated bad-faith cancellations are handled by our support team." },
];

function ProviderFAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="container-page pb-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Provider FAQ
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">Common questions, answered</h2>
          <p className="mt-2 text-sm text-muted-foreground">Still unsure? Email <a href="mailto:partners@shebabd.com" className="font-semibold text-primary">partners@shebabd.com</a> and our partnerships team will help.</p>
        </div>

        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-foreground">{f.q}</span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180 text-primary")} />
                </button>
                {isOpen && <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SuccessState({ refCode, onHome }: { refCode: string; onHome: () => void }) {
  const steps = useMemo(() => ([
    { icon: CheckCircle2, t: "Application received", d: "We've logged your details securely.", done: true },
    { icon: ShieldCheck, t: "Verification (2–5 business days)", d: "Our team reviews your profile and documents.", done: false },
    { icon: Phone, t: "Onboarding call (15 min)", d: "We'll call to walk you through the dashboard.", done: false },
    { icon: BadgeCheck, t: "Profile goes live", d: "Verified leads start arriving in your area.", done: false },
  ]), []);

  return (
    <SiteShell>
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-soft md:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">You're in! Application submitted.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks for applying to Shebabd. Our partnerships team will reach out within <span className="font-semibold text-foreground">2–5 business days</span>.
          </p>

          <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Reference</span>
            <span className="font-mono text-base font-bold text-foreground">#{refCode}</span>
          </div>

          <ol className="mt-8 space-y-3 text-left">
            {steps.map((s) => (
              <li key={s.t} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <span className={cn(
                  "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  s.done ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
                )}>
                  <s.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.t}</p>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onHome}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Back to homepage <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              How Shebabd works
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Need to add documents now? Email them to <a href="mailto:partners@shebabd.com" className="font-semibold text-primary">partners@shebabd.com</a> with your reference <span className="font-mono">#{refCode}</span>.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
