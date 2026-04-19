import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Calendar, CheckCircle2, Clock, Loader2, MapPin, Upload, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/data/categories";
import { areas, findArea } from "@/data/areas";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { buildSeo, OG } from "@/lib/seo";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { BookingStatusTimeline } from "@/components/booking-status-timeline";

export const Route = createFileRoute("/book")({
  head: () =>
    buildSeo({
      title: "Book a Service in Dhaka — Shebabd",
      description:
        "Book a verified service provider in Dhaka. Pick your category, area, time and budget — we'll match the best pro for the job.",
      canonical: "/book",
      image: OG.home,
      noindex: true,
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

const bookingSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone is too long")
    .regex(/^[+\d\s\-()]+$/, "Phone can only contain digits, spaces, +, -, ( and )"),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email").max(255)]),
  category: z.string().min(1, "Please choose a category"),
  service: z.string().max(120).optional().or(z.literal("")),
  area: z.string().min(1, "Please pick your area"),
  address: z.string().max(200).optional().or(z.literal("")),
  preferred_date: z.string().min(1, "Please choose a date"),
  preferred_time_slot: z.enum(TIME_SLOTS),
  budget_range: z.enum(BUDGET_RANGES),
  notes: z.string().max(1000, "Notes must be under 1000 characters").optional().or(z.literal("")),
});

type ConfirmedBooking = {
  id: string;
  full_name: string;
  phone: string;
  category: string;
  service: string | null;
  area: string;
  preferred_date: string;
  preferred_time_slot: string;
  budget_range: string | null;
};

function BookPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
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
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ data: ConfirmedBooking }>("/api/bookings", {
        method: "POST",
        skipAuth: true, // public form — no token required
        body: {
          customer_id: user?.id ?? null,
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          email: parsed.data.email || null,
          category: parsed.data.category,
          service: parsed.data.service || null,
          area: parsed.data.area,
          address: parsed.data.address || null,
          preferred_date: parsed.data.preferred_date,
          preferred_time_slot: parsed.data.preferred_time_slot,
          budget_range: parsed.data.budget_range || null,
          notes: parsed.data.notes || null,
        },
      });
      toast.success("Booking submitted!");
      setConfirmed(res.data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Couldn't submit booking. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
                <input className="input" placeholder="Your name" required maxLength={100} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
              </Field>
              <Field label="Phone *">
                <input className="input" type="tel" placeholder="+880 1700 000000" required maxLength={20} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="input" type="email" placeholder="optional" maxLength={255} value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>

              <Field label="Service category *">
                <select className="input" required value={form.category} onChange={(e) => update("category", e.target.value)}>
                  <option value="">Choose a category</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="Specific service">
                <input className="input" placeholder="e.g. AC General Service" maxLength={120} value={form.service} onChange={(e) => update("service", e.target.value)} />
              </Field>

              <Field label="Area in Dhaka *">
                <select className="input" required value={form.area} onChange={(e) => update("area", e.target.value)}>
                  <option value="">Pick your area</option>
                  {areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                </select>
              </Field>

              <Field label="Address / landmark">
                <input className="input" placeholder="House, road, apartment" maxLength={200} value={form.address} onChange={(e) => update("address", e.target.value)} />
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
                <textarea rows={4} className="input" placeholder="Briefly describe the work needed" maxLength={1000} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
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

      <ConfirmationModal booking={confirmed} onClose={() => setConfirmed(null)} />
    </SiteShell>
  );
}

function ConfirmationModal({ booking, onClose }: { booking: ConfirmedBooking | null; onClose: () => void }) {
  const open = booking !== null;
  const shortId = booking ? booking.id.slice(0, 8).toUpperCase() : "";
  const areaName = booking ? findArea(booking.area)?.name ?? booking.area : "";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">Booking submitted!</DialogTitle>
          <DialogDescription className="text-center">
            We&rsquo;ll call you within an hour to confirm. Save your reference below to track status anytime.
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="mt-2 space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference</p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">#{shortId}</p>
            </div>

            <div className="grid gap-2 rounded-xl border border-border bg-card p-4 text-sm">
              <SummaryRow label="Customer" value={booking.full_name} />
              <SummaryRow label="Phone" value={booking.phone} />
              <SummaryRow label="Category" value={booking.category} />
              {booking.service && <SummaryRow label="Service" value={booking.service} />}
              <SummaryRow label="Area" value={areaName} />
              <SummaryRow
                label="When"
                value={`${booking.preferred_date} · ${booking.preferred_time_slot}`}
              />
              {booking.budget_range && <SummaryRow label="Budget" value={booking.budget_range} />}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <BookingStatusTimeline stage="submitted" />
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 sm:flex-col sm:gap-2">
          {booking && (
            <Link
              to="/booking-status/$id"
              params={{ id: booking.id }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Track this booking <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Book another service
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
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
