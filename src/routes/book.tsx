import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Clock, MapPin, Upload, User, Wallet } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/data/categories";
import { areas } from "@/data/areas";

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

function BookPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Booking"
        title={<>Book a service in <span className="text-gradient-primary">2 minutes</span></>}
        description="Tell us what you need and where. We'll match you with a verified pro and confirm by call within an hour."
      />

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <form className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
            <h2 className="text-xl font-bold text-card-foreground">Service request details</h2>
            <p className="mt-1 text-sm text-muted-foreground">No payment required to book — pay only when the work is done.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name *"><input className="input" placeholder="Your name" /></Field>
              <Field label="Phone *"><input className="input" type="tel" placeholder="+880 1700 000000" /></Field>
              <Field label="Email"><input className="input" type="email" placeholder="optional" /></Field>

              <Field label="Service category *">
                <select className="input">
                  <option value="">Choose a category</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="Specific service"><input className="input" placeholder="e.g. AC General Service" /></Field>

              <Field label="Area in Dhaka *">
                <select className="input">
                  <option value="">Pick your area</option>
                  {areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                </select>
              </Field>

              <Field label="Address / landmark"><input className="input" placeholder="House, road, apartment" /></Field>
              <Field label="Preferred date *"><input className="input" type="date" /></Field>
              <Field label="Preferred time *">
                <select className="input">
                  <option>Morning (8am – 12pm)</option>
                  <option>Afternoon (12pm – 4pm)</option>
                  <option>Evening (4pm – 8pm)</option>
                  <option>Anytime</option>
                </select>
              </Field>
              <Field label="Budget range">
                <select className="input">
                  <option>No preference</option>
                  <option>Under ৳1,000</option>
                  <option>৳1,000 – ৳5,000</option>
                  <option>৳5,000 – ৳20,000</option>
                  <option>Above ৳20,000</option>
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Notes / problem description">
                <textarea rows={4} className="input" placeholder="Briefly describe the work needed" />
              </Field>
            </div>

            <div className="mt-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground hover:bg-muted">
                <Upload className="h-4 w-4 text-primary" />
                <span>Upload a photo (optional) — helps us send the right pro</span>
                <input type="file" className="hidden" />
              </label>
            </div>

            <button type="button" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft">
              Submit booking request <ArrowRight className="h-4 w-4" />
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
