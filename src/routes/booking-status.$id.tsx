import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Loader2, MapPin, Phone, Search } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { api, ApiError } from "@/lib/api-client";
import { findArea } from "@/data/areas";
import { BookingStatusTimeline, statusMeta, type BookingStage } from "@/components/booking-status-timeline";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/booking-status/$id")({
  head: ({ params }) =>
    buildSeo({
      title: `Booking ${params.id.slice(0, 8).toUpperCase()} — Shebabd`,
      description: "Track the live status of your service booking.",
      canonical: `/booking-status/${params.id}`,
      noindex: true,
    }),
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Booking not found</h1>
        <p className="mt-2 text-muted-foreground">The link may be incorrect or the booking has been removed.</p>
        <Link to="/book" className="mt-6 inline-block text-primary underline">Submit a new booking</Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Couldn&rsquo;t load booking</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Link to="/book" className="mt-6 inline-block text-primary underline">Back to booking</Link>
      </div>
    </SiteShell>
  ),
  component: BookingStatusPage,
});

type Booking = {
  id: string;
  full_name: string;
  phone: string;
  category: string;
  service: string | null;
  area: string;
  address: string | null;
  preferred_date: string;
  preferred_time_slot: string;
  budget_range: string | null;
  notes: string | null;
  status: "new" | "confirmed" | "assigned" | "completed" | "cancelled";
  created_at: string;
};

function toStage(s: Booking["status"]): BookingStage {
  switch (s) {
    case "new":       return "submitted";
    case "confirmed": return "pending_review";
    case "assigned":  return "assigned";
    case "completed": return "completed";
    case "cancelled": return "cancelled";
  }
}

function BookingStatusPage() {
  const { id } = Route.useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api<{ data: Booking }>(`/api/bookings/${encodeURIComponent(id)}`, { skipAuth: true });
        if (!cancelled) setBooking(res.data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setError("not_found");
        else setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <SiteShell>
        <div className="container-page flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </SiteShell>
    );
  }
  if (error === "not_found" || !booking) throw notFound();
  if (error) throw new Error(error);

  const stage = toStage(booking.status);
  const meta = statusMeta(stage);
  const areaName = findArea(booking.area)?.name ?? booking.area;
  const shortId = booking.id.slice(0, 8).toUpperCase();
  const created = new Date(booking.created_at).toLocaleString();

  return (
    <SiteShell>
      <PageHeader
        eyebrow={`Tracking · #${shortId}`}
        title={<>Your booking is <span className="text-gradient-primary">{meta.label.toLowerCase()}</span></>}
        description={`Submitted ${created}. We'll keep this page in sync as your job progresses.`}
      />

      <section className="container-page py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Live status</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
            </div>
            <BookingStatusTimeline stage={stage} />
            <div className="mt-8 grid gap-3 rounded-xl border border-dashed border-border bg-background p-4 text-xs text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" />We&rsquo;ll call <span className="font-medium text-foreground">{booking.phone}</span> on each update.</p>
              <p className="flex items-center gap-2"><Search className="h-3.5 w-3.5 text-primary" />Bookmark this page to check status anytime.</p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold text-foreground">Booking summary</h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="Reference" value={`#${shortId}`} mono />
                <Row label="Customer" value={booking.full_name} />
                <Row label="Category" value={booking.category} />
                {booking.service && <Row label="Service" value={booking.service} />}
                <Row label="Area" value={areaName} />
                {booking.address && <Row label="Address" value={booking.address} />}
                <Row label="When" value={`${booking.preferred_date} · ${booking.preferred_time_slot}`} />
                {booking.budget_range && <Row label="Budget" value={booking.budget_range} />}
              </dl>
              {booking.notes && (
                <div className="mt-4 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                  <p className="mb-1 font-semibold text-foreground">Notes</p>{booking.notes}
                </div>
              )}
              <div className="mt-5 space-y-2">
                <Link to="/book" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                  <CalendarDays className="h-4 w-4" /> Book another service <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Currently serving Dhaka — same-day visits available.
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`text-right text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
