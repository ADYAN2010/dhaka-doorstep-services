import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, Briefcase, Calendar, Loader2, ShieldCheck, TrendingUp, Upload, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/data/categories";
import { areas } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { buildSeo, OG } from "@/lib/seo";

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

function BecomeProviderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    applicant_type: APPLICANT_TYPES[0] as string,
    category: "",
    experience: EXPERIENCE[0] as string,
    coverage_area: "",
    team_size: TEAM_SIZES[0] as string,
    availability: AVAILABILITIES[0] as string,
    about: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.email || !form.category || !form.coverage_area) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("provider_applications").insert({
      user_id: user?.id ?? null,
      full_name: form.full_name,
      phone: form.phone,
      email: form.email,
      applicant_type: form.applicant_type,
      category: form.category,
      experience: form.experience,
      coverage_area: form.coverage_area,
      team_size: form.team_size || null,
      availability: form.availability || null,
      about: form.about || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application submitted! We'll review within 2–5 business days.");
    navigate({ to: "/" });
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="For providers"
        title={<>Grow your service business <span className="text-gradient-primary">with us</span></>}
        description="Join Bangladesh's fastest-growing service marketplace. Verified leads in your area, weekly payouts, and a support team behind you."
      />

      <section className="container-page py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: TrendingUp, t: "More bookings", d: "Steady, verified leads in your area." },
            { icon: Wallet, t: "Weekly payouts", d: "Get paid reliably, every week." },
            { icon: ShieldCheck, t: "Trust & badge", d: "Verified profile boosts conversions." },
            { icon: Users, t: "Support team", d: "We handle billing, disputes & customer chat." },
          ].map((it) => (
            <div key={it.t} className="rounded-2xl border border-border bg-card p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><it.icon className="h-5 w-5" /></span>
              <h3 className="mt-3 text-sm font-semibold text-card-foreground">{it.t}</h3>
              <p className="text-xs text-muted-foreground">{it.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8"
          >
            <h2 className="text-xl font-bold text-card-foreground">Provider application</h2>
            <p className="mt-1 text-sm text-muted-foreground">We review applications within 2–5 business days.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name / business name *">
                <input className="input" placeholder="Your name or business" required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
              </Field>
              <Field label="Phone *">
                <input className="input" type="tel" placeholder="+880 1700 000000" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
              <Field label="Email *">
                <input className="input" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>

              <Field label="I am applying as">
                <select className="input" value={form.applicant_type} onChange={(e) => update("applicant_type", e.target.value)}>
                  {APPLICANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Service category *">
                <select className="input" required value={form.category} onChange={(e) => update("category", e.target.value)}>
                  <option value="">Choose a category</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="Years of experience *">
                <select className="input" value={form.experience} onChange={(e) => update("experience", e.target.value)}>
                  {EXPERIENCE.map((x) => <option key={x} value={x}>{x}</option>)}
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
                <select className="input" value={form.team_size} onChange={(e) => update("team_size", e.target.value)}>
                  {TEAM_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Availability">
                <select className="input" value={form.availability} onChange={(e) => update("availability", e.target.value)}>
                  {AVAILABILITIES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="About you / portfolio link">
                <textarea rows={4} className="input" placeholder="Briefly describe your work, achievements, or paste a portfolio link" value={form.about} onChange={(e) => update("about", e.target.value)} />
              </Field>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <UploadBox label="NID / Trade license (coming soon)" />
              <UploadBox label="Portfolio / past work (coming soon)" />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Submitting…" : "Submit application"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">By applying, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>

            <style>{`
              .input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-background); padding: 0.625rem 0.875rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; transition: border-color 150ms; }
              .input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent); }
              .input::placeholder { color: var(--color-muted-foreground); }
            `}</style>
          </form>

          <aside className="lg:sticky lg:top-24 lg:self-start">
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
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function UploadBox({ label }: { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground hover:bg-muted">
      <Upload className="h-4 w-4 text-primary" />
      <span>{label}</span>
      <input type="file" className="hidden" disabled />
    </label>
  );
}
