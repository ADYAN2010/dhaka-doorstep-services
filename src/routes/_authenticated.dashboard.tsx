import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Phone, Plus, Loader2, ClipboardList, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: CustomerDashboard,
  head: () => ({
    meta: [
      { title: "My dashboard · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type BookingStatus = "new" | "confirmed" | "assigned" | "completed" | "cancelled";

type Booking = {
  id: string;
  category: string;
  service: string | null;
  area: string;
  address: string | null;
  preferred_date: string;
  preferred_time_slot: string;
  budget_range: string | null;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  new: "bg-muted text-foreground",
  confirmed: "bg-primary/15 text-primary",
  assigned: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-destructive/15 text-destructive",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select(
          "id, category, service, area, address, preferred_date, preferred_time_slot, budget_range, notes, status, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setBookings((data ?? []) as Booking[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function confirmCancel() {
    if (!pendingCancelId) return;
    const id = pendingCancelId;
    const prev = bookings;
    // Optimistic update
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    setCancelling(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);
    setCancelling(false);
    setPendingCancelId(null);
    if (error) {
      setBookings(prev);
      toast.error("Could not cancel booking", { description: error.message });
      return;
    }
    toast.success("Booking cancelled");
  }

  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) =>
      ["new", "confirmed", "assigned"].includes(b.status),
    ).length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    return { total, active, completed };
  }, [bookings]);

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? "there";

  return (
    <SiteShell>
      <section className="container-page py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">My dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              Hi {fullName.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your bookings and request new services from one place.
            </p>
          </div>
          <Button asChild>
            <Link to="/book">
              <Plus className="mr-1.5 h-4 w-4" /> New booking
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total bookings" value={stats.total} />
          <StatCard label="Active" value={stats.active} accent="text-primary" />
          <StatCard label="Completed" value={stats.completed} accent="text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">My bookings</h2>
              <p className="text-xs text-muted-foreground">
                Bookings linked to {user?.email}
              </p>
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <EmptyBookings />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Booked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {b.service ?? b.category}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {b.category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(b.preferred_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {b.preferred_time_slot}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{b.area}</TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(b.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile */}
              <ul className="divide-y divide-border md:hidden">
                {bookings.map((b) => (
                  <li key={b.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">
                          {b.service ?? b.category}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {b.category}
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(b.preferred_date).toLocaleDateString()} · {b.preferred_time_slot}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {b.area}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-bold ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

function EmptyBookings() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Phone className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No bookings yet</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Book a verified professional in minutes — cleaning, repairs, beauty, tutoring and more.
      </p>
      <Button asChild className="mt-2">
        <Link to="/book">
          <Plus className="mr-1.5 h-4 w-4" /> Make your first booking
        </Link>
      </Button>
    </div>
  );
}
