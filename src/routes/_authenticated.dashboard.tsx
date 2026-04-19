import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, CalendarCheck, MessageSquare, User as UserIcon, Heart } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Booking = {
  id: string;
  category: string;
  service: string | null;
  area: string;
  preferred_date: string;
  preferred_time_slot: string;
  status: string;
  created_at: string;
};

function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [b, s] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, category, service, area, preferred_date, preferred_time_slot, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("saved_providers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      setBookings((b.data ?? []) as Booking[]);
      setSavedCount(s.count ?? 0);
      setLoading(false);
    })();
  }, [user]);

  const fullName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? user?.email;

  return (
    <SiteShell>
      <section className="container-page py-10">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{fullName}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/dashboard" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarCheck className="h-5 w-5" /></span>
              <div>
                <div className="text-2xl font-bold">{bookings.length}</div>
                <div className="text-xs text-muted-foreground">Bookings (recent)</div>
              </div>
            </div>
          </Link>
          <Link to="/dashboard" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-500"><Heart className="h-5 w-5" /></span>
              <div>
                <div className="text-2xl font-bold">{savedCount}</div>
                <div className="text-xs text-muted-foreground">Saved providers</div>
              </div>
            </div>
          </Link>
          <Link to="/messages" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-500"><MessageSquare className="h-5 w-5" /></span>
              <div>
                <div className="text-2xl font-bold">—</div>
                <div className="text-xs text-muted-foreground">Open messages</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-semibold">Your recent bookings</div>
              <div className="text-xs text-muted-foreground">Latest 10 bookings on your account.</div>
            </div>
            <Button asChild size="sm" variant="outline"><Link to="/book">New booking</Link></Button>
          </div>
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : bookings.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              You haven't booked any service yet.
              <div className="mt-3"><Button asChild size="sm"><Link to="/services">Browse services</Link></Button></div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {bookings.map((b) => (
                <li key={b.id} className="px-5 py-4">
                  <Link to="/booking-status/$id" params={{ id: b.id }} className="flex flex-wrap items-center justify-between gap-3 hover:opacity-90">
                    <div>
                      <div className="font-medium capitalize">{b.category}{b.service ? ` · ${b.service}` : ""}</div>
                      <div className="text-xs text-muted-foreground">{b.area} · {b.preferred_date} · {b.preferred_time_slot}</div>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold capitalize">{b.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/profile"><UserIcon className="mr-2 h-4 w-4" />Edit profile</Link></Button>
        </div>
      </section>
    </SiteShell>
  );
}
