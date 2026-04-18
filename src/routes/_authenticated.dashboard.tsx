import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  Phone,
  Plus,
  Loader2,
  ClipboardList,
  X,
  Heart,
  Star,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  provider_id: string | null;
};

type SavedRow = {
  id: string;
  provider_id: string;
  created_at: string;
};

type ProviderProfile = {
  id: string;
  full_name: string;
  area: string | null;
  avatar_url: string | null;
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
  const [savedRows, setSavedRows] = useState<SavedRow[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<Record<string, ProviderProfile>>({});
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [removingSavedId, setRemovingSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: bookingsData }, { data: savedData }] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, category, service, area, address, preferred_date, preferred_time_slot, budget_range, notes, status, created_at, provider_id",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("saved_providers")
          .select("id, provider_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      const bs = (bookingsData ?? []) as Booking[];
      const ss = (savedData ?? []) as SavedRow[];
      setBookings(bs);
      setSavedRows(ss);

      // Load reviews status for completed bookings with a provider
      const completedWithProvider = bs.filter(
        (b) => b.status === "completed" && b.provider_id,
      );
      if (completedWithProvider.length) {
        const { data: reviewed } = await supabase
          .from("reviews")
          .select("booking_id")
          .in(
            "booking_id",
            completedWithProvider.map((b) => b.id),
          );
        if (!cancelled) {
          setReviewedBookingIds(
            new Set((reviewed ?? []).map((r) => r.booking_id)),
          );
        }
      }

      // Load saved provider profiles
      if (ss.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, area, avatar_url")
          .in(
            "id",
            ss.map((s) => s.provider_id),
          );
        if (!cancelled) {
          const map: Record<string, ProviderProfile> = {};
          (profs ?? []).forEach((p) => {
            map[p.id] = p as ProviderProfile;
          });
          setSavedProfiles(map);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function confirmCancel() {
    if (!pendingCancelId) return;
    const id = pendingCancelId;
    const prev = bookings;
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

  async function removeSaved(rowId: string, providerId: string) {
    if (!user) return;
    setRemovingSavedId(rowId);
    const prev = savedRows;
    setSavedRows((rs) => rs.filter((r) => r.id !== rowId));
    const { error } = await supabase
      .from("saved_providers")
      .delete()
      .eq("id", rowId)
      .eq("user_id", user.id);
    setRemovingSavedId(null);
    if (error) {
      setSavedRows(prev);
      toast.error("Could not remove", { description: error.message });
      return;
    }
    toast.success("Removed from saved");
    void providerId;
  }

  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) =>
      ["new", "confirmed", "assigned"].includes(b.status),
    ).length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    return { total, active, completed, saved: savedRows.length };
  }, [bookings, savedRows]);

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
              Track your bookings, leave reviews and revisit saved providers.
            </p>
          </div>
          <Button asChild>
            <Link to="/book">
              <Plus className="mr-1.5 h-4 w-4" /> New booking
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total bookings" value={stats.total} />
          <StatCard label="Active" value={stats.active} accent="text-primary" />
          <StatCard
            label="Completed"
            value={stats.completed}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard label="Saved providers" value={stats.saved} />
        </div>

        <Tabs defaultValue="bookings" className="mt-10">
          <TabsList>
            <TabsTrigger value="bookings">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Heart className="mr-1.5 h-3.5 w-3.5" /> Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-4">
            <BookingsCard
              loading={loading}
              bookings={bookings}
              email={user?.email ?? ""}
              reviewedBookingIds={reviewedBookingIds}
              onCancel={(id) => setPendingCancelId(id)}
            />
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <SavedCard
              loading={loading}
              rows={savedRows}
              profiles={savedProfiles}
              removingId={removingSavedId}
              onRemove={removeSaved}
            />
          </TabsContent>
        </Tabs>
      </section>

      <AlertDialog
        open={pendingCancelId !== null}
        onOpenChange={(open) => !open && !cancelling && setPendingCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark your booking as cancelled. You can always book the same service
              again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault();
                confirmCancel();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SiteShell>
  );
}

function BookingsCard({
  loading,
  bookings,
  email,
  reviewedBookingIds,
  onCancel,
}: {
  loading: boolean;
  bookings: Booking[];
  email: string;
  reviewedBookingIds: Set<string>;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">My bookings</h2>
          <p className="text-xs text-muted-foreground">Bookings linked to {email}</p>
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
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const canCancel = b.status === "new" || b.status === "confirmed";
                  const canReview =
                    b.status === "completed" &&
                    b.provider_id &&
                    !reviewedBookingIds.has(b.id);
                  return (
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
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {b.provider_id && (b.status === "assigned" || b.status === "completed") && (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/messages" search={{ booking: b.id }}>
                              <MessageCircle className="mr-1 h-3.5 w-3.5" /> Message
                            </Link>
                          </Button>
                        )}
                        {canCancel && (
                          <Button size="sm" variant="outline" onClick={() => onCancel(b.id)}>
                            <X className="mr-1 h-3.5 w-3.5" /> Cancel
                          </Button>
                        )}
                        {canReview && (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/p/$id" params={{ id: b.provider_id! }}>
                              <Star className="mr-1 h-3.5 w-3.5" /> Leave review
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ul className="divide-y divide-border md:hidden">
            {bookings.map((b) => {
              const canCancel = b.status === "new" || b.status === "confirmed";
              const canReview =
                b.status === "completed" &&
                b.provider_id &&
                !reviewedBookingIds.has(b.id);
              return (
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
                      {new Date(b.preferred_date).toLocaleDateString()} ·{" "}
                      {b.preferred_time_slot}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {b.area}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.provider_id && (b.status === "assigned" || b.status === "completed") && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/messages" search={{ booking: b.id }}>
                          <MessageCircle className="mr-1 h-3.5 w-3.5" /> Message
                        </Link>
                      </Button>
                    )}
                    {canCancel && (
                      <Button size="sm" variant="outline" onClick={() => onCancel(b.id)}>
                        <X className="mr-1 h-3.5 w-3.5" /> Cancel booking
                      </Button>
                    )}
                    {canReview && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/p/$id" params={{ id: b.provider_id! }}>
                          <Star className="mr-1 h-3.5 w-3.5" /> Leave review
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function SavedCard({
  loading,
  rows,
  profiles,
  removingId,
  onRemove,
}: {
  loading: boolean;
  rows: SavedRow[];
  profiles: Record<string, ProviderProfile>;
  removingId: string | null;
  onRemove: (rowId: string, providerId: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">Saved providers</h2>
          <p className="text-xs text-muted-foreground">
            Quick access to providers you've favourited.
          </p>
        </div>
        <Heart className="h-5 w-5 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No saved providers yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap the heart on any provider profile to save them here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const p = profiles[r.provider_id];
            const initials = (p?.full_name || "?")
              .split(" ")
              .map((s: string) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <li
                key={r.id}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {p?.full_name ?? "Provider"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/p/$id" params={{ id: r.provider_id }}>
                    View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={removingId === r.id}
                  onClick={() => onRemove(r.id, r.provider_id)}
                  aria-label="Remove from saved"
                >
                  {removingId === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
        Book a verified professional in minutes — cleaning, repairs, beauty, tutoring and
        more.
      </p>
      <Button asChild className="mt-2">
        <Link to="/book">
          <Plus className="mr-1.5 h-4 w-4" /> Make your first booking
        </Link>
      </Button>
    </div>
  );
}
