import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Calendar, Clock, Loader2, MapPin, Upload, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/data/categories";
import { areas } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Service — Shebabd" },
      { name: "description", content: "Book a verified service provider in Dhaka. Pick your category, area, time and budget — we'll match the best pro for the job." },
      { property: "og:title", content: "Book a Service in Dhaka — Shebabd" },
      { property: "og:description", content: "Pick your category, area, and time. We match the best verified pro." },
    ],
  }),
  component: BookPage,
});

const TIME_SLOTS = [
  "Morning (8am – 12pm)",
  "Afternoon (12pm – 4pm)",
  "Evening (4pm – 8pm)",
  "Anytime",
] as const;

const BUDGET_RANGES = [
  "No preference",
  "Under ৳1,000",
  "৳1,000 – ৳5,000",
  "৳5,000 – ৳20,000",
  "Above ৳20,000",
] as const;

function BookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    category: "",
    service: "",
    area: "",
    address: "",
    preferred_date: "",
    preferred_time_slot: TIME_SLOTS[0] as string,
    budget_range: BUDGET_RANGES[0] as string,
    notes: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.category || !form.area || !form.preferred_date) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user?.id ?? null,
      full_name: form.full_name,
      phone: form.phone,
      email: form.email || null,
      category: form.category,
      service: form.service || null,
      area: form.area,
      address: form.address || null,
      preferred_date: form.preferred_date,
      preferred_time_slot: form.preferred_time_slot,
      budget_range: form.budget_range || null,
      notes: form.notes || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking submitted! We'll call you within an hour.");
    navigate({ to: "/" });
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Booking"
        title={<>Book a service in <span className="text-gradient-primary">2 minutes</span></>}
        description="Tell us what you need and where. We'll match you with a verified pro and confirm by call within an hour."
      />

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8"
          >
            <h2 className="text-xl font-bold text-card-foreground">Service request details</h2>
            <p className="mt-1 text-sm text-muted-foreground">No payment required to book — pay only when the work is done.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name *">
                <input className="input" placeholder="Your name" required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
              </Field>
              <Field label="Phone *">
                <input className="input" type="tel" placeholder="+880 1700 000000" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="input" type="email" placeholder="optional" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>

              <Field label="Service category *">
                <select className="input" required value={form.category} onChange={(e) => update("category", e.target.value)}>
                  <option value="">Choose a category</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="Specific service">
                <input className="input" placeholder="e.g. AC General Service" value={form.service} onChange={(e) => update("service", e.target.value)} />
              </Field>

              <Field label="Area in Dhaka *">
                <select className="input" required value={form.area} onChange={(e) => update("area", e.target.value)}>
                  <option value="">Pick your area</option>
                  {areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                </select>
              </Field>

              <Field label="Address / landmark">
                <input className="input" placeholder="House, road, apartment" value={form.address} onChange={(e) => update("address", e.target.value)} />
              </Field>
              <Field label="Preferred date *">
                <input className="input" type="date" required value={form.preferred_date} onChange={(e) => update("preferred_date", e.target.value)} />
              </Field>
              <Field label="Preferred time *">
                <select className="input" value={form.preferred_time_slot} onChange={(e) => update("preferred_time_slot", e.target.value)}>
                  {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Budget range">
                <select className="input" value={form.budget_range} onChange={(e) => update("budget_range", e.target.value)}>
                  {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Notes / problem description">
                <textarea rows={4} className="input" placeholder="Briefly describe the work needed" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </Field>
            </div>

            <div className="mt-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground hover:bg-muted">
                <Upload className="h-4 w-4 text-primary" />
                <span>Upload a photo (optional) — coming soon</span>
                <input type="file" className="hidden" disabled />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Submitting…" : "Submit booking request"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">By submitting, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>

            <style>{`
              .input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-background); padding: 0.625rem 0.875rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; transition: border-color 150ms; }
              .input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent); }
              .input::placeholder { color: var(--color-muted-foreground); }
            `}</style>
          </form>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-gradient-card p-6">
              <h3 className="text-base font-semibold text-foreground">What happens next?</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {[
                  { icon: User, t: "We confirm your request by phone within 1 hour" },
                  { icon: Calendar, t: "We assign a verified provider for your slot" },
                  { icon: Clock, t: "Pro arrives on time, completes the work" },
                  { icon: Wallet, t: "Pay only after you're satisfied" },
                  { icon: MapPin, t: "Currently serving Dhaka — more cities coming" },
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{s.t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl bg-primary/5 p-4 text-xs text-muted-foreground">
                Need it today? Call us at <a href="tel:+8801700000000" className="font-semibold text-primary">+880 1700 000000</a> for same-day service.
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
