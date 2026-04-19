import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Loader2, MapPin, Phone, User } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { BookingStatusTimeline, statusMeta, type BookingStage } from "@/components/booking-status-timeline";
import { categories as ALL_CATEGORIES } from "@/data/categories";
import { areas as ALL_AREAS } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { buildSeo } from "@/lib/seo";

type Booking = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  category: string;
  service: string | null;
  area: string;
  address: string | null;
  preferred_date: string;
  preferred_time_slot: string;
  budget_range: string | null;
  notes: string | null;
  status: "new" | "confirmed" | "assigned" | "completed" | "cancelled";
  provider_id: string | null;
  created_at: string;
};

function statusToStage(s: Booking["status"]): BookingStage {
  switch (s) {
    case "new":
      return "submitted";
    case "confirmed":
      return "pending_review";
    case "assigned":
      return "assigned";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
  }
}

export const Route = createFileRoute("/booking-status/$id")({
  component: BookingStatusPage,
  head: ({ params }) => ({
    ...buildSeo({
      title: "Booking status — Shebabd",
      description: "Track the status of your Shebabd service booking in real time.",
      canonical: `/booking-status/${params.id}`,
      noindex: true,
    }),
  }),
  notFoundComponent: () => (
    <SiteShell>
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-3xl font-bold">Booking not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This booking may not exist or you may not have access.
        </p>
        <Link to="/" className="mt-6">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
          </Button>
        </Link>
      </section>
    </SiteShell>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <SiteShell>
        <section className="container-page py-16 text-center">
          <h1 className="text-2xl font-bold">Couldn't load booking</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Retry
          </Button>
        </section>
      </SiteShell>
    );
  },
});

function BookingStatusPage() {
  const { id } = Route.useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setMissing(false);
      const { data, error: e } = await supabase
        .from("bookings")
        .select(
          "id, full_name, phone, email, category, service, area, address, preferred_date, preferred_time_slot, budget_range, notes, status, provider_id, created_at",
        )
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (e) {
        setError(e.message);
      } else if (!data) {
        setMissing(true);
      } else {
        setBooking(data as Booking);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <SiteShell>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading booking…
        </div>
      </SiteShell>
    );
  }

  if (missing) throw notFound();

  if (error || !booking) {
    return (
      <SiteShell>
        <section className="container-page py-16 text-center">
          <h1 className="text-2xl font-bold">Couldn't load booking</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </section>
      </SiteShell>
    );
  }

  const categoryName =
    ALL_CATEGORIES.find((c) => c.slug === booking.category)?.name ?? booking.category;
  const areaName = ALL_AREAS.find((a) => a.slug === booking.area)?.name ?? booking.area;
  const stage = statusToStage(booking.status);
  const meta = statusMeta(stage);

  return (
    <SiteShell>
      <section className="container-page max-w-4xl py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Booking #{booking.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                {categoryName}
                {booking.service ? ` — ${booking.service}` : ""}
              </h1>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}
            >
              {meta.label}
            </span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{booking.full_name}</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{booking.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>
                  {new Date(booking.preferred_date).toLocaleDateString()} ·{" "}
                  {booking.preferred_time_slot}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>
                  {areaName}
                  {booking.address ? ` — ${booking.address}` : ""}
                </span>
              </div>
              {booking.budget_range && (
                <p className="text-xs text-muted-foreground">
                  Budget: <span className="font-medium text-foreground">{booking.budget_range}</span>
                </p>
              )}
              {booking.notes && (
                <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  {booking.notes}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-gradient-subtle p-5">
              <h3 className="mb-4 text-sm font-semibold">Status timeline</h3>
              <BookingStatusTimeline stage={stage} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/contact">
            <Button variant="outline">Contact support</Button>
          </Link>
          <Link to="/book">
            <Button>Book another service</Button>
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
