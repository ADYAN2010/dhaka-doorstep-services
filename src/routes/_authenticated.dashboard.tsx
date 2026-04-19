import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  GitCompare,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Receipt,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  User as UserIcon,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { findArea } from "@/data/areas";
import {
  BookingStatusTrackerCard,
  CompareProvidersPanel,
  FavoriteServicesPanel,
  PaymentHistoryView,
  RebookButton,
  RecentlyViewedPanel,
  RecommendedServicesPanel,
  SmartReviewDialog,
  SupportRequestPanel,
  type CustomerSupportTicket,
} from "@/components/customer-ux";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: CustomerDashboard,
  head: () => ({
    meta: [
      { title: "My dashboard · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

/* ============================== Types ============================== */

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

type SavedRow = { id: string; provider_id: string; created_at: string };
type ProviderProfile = { id: string; full_name: string; area: string | null; avatar_url: string | null };
type ReviewRow = { id: string; booking_id: string; rating: number; comment: string | null; created_at: string; provider_id: string };
type PaymentRow = { id: string; booking_id: string; amount: number; currency: string; method: string; status: string; created_at: string };

type SectionKey =
  | "overview" | "bookings" | "active" | "completed" | "saved"
  | "reviews" | "payments" | "support" | "profile" | "addresses";

const SECTIONS: { key: SectionKey; label: string; icon: ComponentType<{ className?: string }>; group: "Activity" | "Account" }[] = [
  { key: "overview",  label: "Overview",          icon: LayoutDashboard, group: "Activity" },
  { key: "bookings",  label: "My bookings",       icon: ClipboardList,   group: "Activity" },
  { key: "active",    label: "Active services",   icon: Clock,           group: "Activity" },
  { key: "completed", label: "Completed services",icon: CheckCircle2,    group: "Activity" },
  { key: "saved",     label: "Saved providers",   icon: Heart,           group: "Activity" },
  { key: "reviews",   label: "My reviews",        icon: Star,            group: "Activity" },
  { key: "payments",  label: "Payment history",   icon: Receipt,         group: "Account"  },
  { key: "support",   label: "Support tickets",   icon: LifeBuoy,        group: "Account"  },
  { key: "profile",   label: "Profile settings",  icon: Settings,        group: "Account"  },
  { key: "addresses", label: "Saved addresses",   icon: MapPin,          group: "Account"  },
];

const STATUS_STYLES: Record<BookingStatus, string> = {
  new:       "bg-muted text-foreground",
  confirmed: "bg-primary/15 text-primary",
  assigned:  "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

/* ============================== Mock data (for modules without backend tables yet) ============================== */

type SupportTicket = { id: string; subject: string; status: "open" | "in_progress" | "resolved"; updated: string; lastMessage: string };
type SavedAddress = { id: string; label: string; line1: string; area: string; phone: string; isDefault: boolean };

const MOCK_TICKETS: SupportTicket[] = [
  { id: "TCK-2041", subject: "Refund for cancelled AC service", status: "in_progress", updated: "2h ago", lastMessage: "Our finance team is processing your refund." },
  { id: "TCK-2018", subject: "Provider arrived late",            status: "resolved",   updated: "3d ago", lastMessage: "Apologies — we credited ৳200 to your wallet." },
];

const DEFAULT_MOCK_ADDRESSES: SavedAddress[] = [
  { id: "addr-1", label: "Home",   line1: "House 12, Road 5, Block C", area: "dhanmondi", phone: "+880 1700 000000", isDefault: true  },
  { id: "addr-2", label: "Office", line1: "Level 7, Plaza AR Tower",   area: "gulshan",   phone: "+880 1711 111111", isDefault: false },
];

/* ============================== Page ============================== */

function CustomerDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState<SectionKey>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedRows, setSavedRows] = useState<SavedRow[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<Record<string, ProviderProfile>>({});
  const [providerProfiles, setProviderProfiles] = useState<Record<string, ProviderProfile>>({});
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [removingSavedId, setRemovingSavedId] = useState<string | null>(null);

  // Local-only state for mocked modules
  const [addresses, setAddresses] = useState<SavedAddress[]>(DEFAULT_MOCK_ADDRESSES);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: bookingsData }, { data: savedData }, { data: reviewsData }] = await Promise.all([
        supabase.from("bookings")
          .select("id, category, service, area, address, preferred_date, preferred_time_slot, budget_range, notes, status, created_at, provider_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("saved_providers")
          .select("id, provider_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("reviews")
          .select("id, booking_id, rating, comment, created_at, provider_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      const bs = (bookingsData ?? []) as Booking[];
      const ss = (savedData ?? []) as SavedRow[];
      const rs = (reviewsData ?? []) as ReviewRow[];
      setBookings(bs);
      setSavedRows(ss);
      setReviews(rs);
      setReviewedBookingIds(new Set(rs.map((r) => r.booking_id)));

      // Payments for this customer's bookings
      const bookingIds = bs.map((b) => b.id);
      if (bookingIds.length) {
        const { data: pays } = await supabase
          .from("payments")
          .select("id, booking_id, amount, currency, method, status, created_at")
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: false });
        if (!cancelled) setPayments((pays ?? []) as PaymentRow[]);
      }

      // Saved provider profiles
      if (ss.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, area, avatar_url")
          .in("id", ss.map((s) => s.provider_id));
        if (!cancelled) {
          const map: Record<string, ProviderProfile> = {};
          (profs ?? []).forEach((p) => { map[p.id] = p as ProviderProfile; });
          setSavedProfiles(map);
        }
      }

      // Booking provider profiles (for active/completed views)
      const providerIds = Array.from(new Set(bs.map((b) => b.provider_id).filter(Boolean) as string[]));
      if (providerIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, area, avatar_url")
          .in("id", providerIds);
        if (!cancelled) {
          const map: Record<string, ProviderProfile> = {};
          (profs ?? []).forEach((p) => { map[p.id] = p as ProviderProfile; });
          setProviderProfiles(map);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  /* ----------- Actions ----------- */

  async function confirmCancel() {
    if (!pendingCancelId) return;
    const id = pendingCancelId;
    const prev = bookings;
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    setCancelling(true);
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    setCancelling(false);
    setPendingCancelId(null);
    if (error) {
      setBookings(prev);
      toast.error("Could not cancel booking", { description: error.message });
      return;
    }
    toast.success("Booking cancelled");
  }

  async function removeSaved(rowId: string) {
    if (!user) return;
    setRemovingSavedId(rowId);
    const prev = savedRows;
    setSavedRows((rs) => rs.filter((r) => r.id !== rowId));
    const { error } = await supabase.from("saved_providers").delete().eq("id", rowId).eq("user_id", user.id);
    setRemovingSavedId(null);
    if (error) {
      setSavedRows(prev);
      toast.error("Could not remove", { description: error.message });
      return;
    }
    toast.success("Removed from saved");
  }

  /* ----------- Derived ----------- */

  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) => ["new", "confirmed", "assigned"].includes(b.status)).length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const spent = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    return { total, active, completed, saved: savedRows.length, spent };
  }, [bookings, savedRows, payments]);

  const activeBookings    = useMemo(() => bookings.filter((b) => ["new", "confirmed", "assigned"].includes(b.status)), [bookings]);
  const completedBookings = useMemo(() => bookings.filter((b) => b.status === "completed"), [bookings]);

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? "there";
  const firstName = fullName.split(" ")[0];
  const currentSection = SECTIONS.find((s) => s.key === section)!;

  return (
    <SiteShell>
      <section className="container-page py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <DashboardSidebar
              current={section}
              onSelect={(k) => { setSection(k); setMobileNavOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              mobileOpen={mobileNavOpen}
              onCloseMobile={() => setMobileNavOpen(false)}
              firstName={firstName}
              email={user?.email ?? ""}
            />
          </aside>

          {/* Main */}
          <div className="min-w-0">
            {/* Top header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">My dashboard</p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {currentSection.label}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
                  <Settings className="mr-1.5 h-4 w-4" /> Menu
                </Button>
                <Button asChild size="sm">
                  <Link to="/book"><Plus className="mr-1.5 h-4 w-4" /> New booking</Link>
                </Button>
              </div>
            </div>

            {/* Section content */}
            {section === "overview" && (
              <OverviewSection
                firstName={firstName}
                stats={stats}
                bookings={bookings}
                providerProfiles={providerProfiles}
                loading={loading}
                onJump={setSection}
              />
            )}

            {section === "bookings" && (
              <BookingsList
                title="All bookings"
                blurb="Every service request you've made."
                loading={loading}
                bookings={bookings}
                providerProfiles={providerProfiles}
                reviewedBookingIds={reviewedBookingIds}
                onCancel={(id) => setPendingCancelId(id)}
                emptyTitle="No bookings yet"
              />
            )}

            {section === "active" && (
              <BookingsList
                title="Active services"
                blurb="Bookings in progress or scheduled for the future."
                loading={loading}
                bookings={activeBookings}
                providerProfiles={providerProfiles}
                reviewedBookingIds={reviewedBookingIds}
                onCancel={(id) => setPendingCancelId(id)}
                emptyTitle="No active services"
                emptyHint="Once you submit a booking, you'll see it here until it's completed."
              />
            )}

            {section === "completed" && (
              <BookingsList
                title="Completed services"
                blurb="Past jobs — leave a review to help others choose."
                loading={loading}
                bookings={completedBookings}
                providerProfiles={providerProfiles}
                reviewedBookingIds={reviewedBookingIds}
                onCancel={() => {}}
                emptyTitle="No completed services yet"
                emptyHint="Once a provider marks a job complete, it appears here."
              />
            )}

            {section === "saved" && (
              <SavedSection
                loading={loading}
                rows={savedRows}
                profiles={savedProfiles}
                removingId={removingSavedId}
                onRemove={removeSaved}
              />
            )}

            {section === "reviews" && (
              <ReviewsSection loading={loading} reviews={reviews} providerProfiles={providerProfiles} bookings={bookings} />
            )}

            {section === "payments" && (
              <PaymentsSection loading={loading} payments={payments} bookings={bookings} />
            )}

            {section === "support" && (
              <SupportSection tickets={MOCK_TICKETS} />
            )}

            {section === "profile" && (
              <ProfileSection email={user?.email ?? ""} fullName={fullName} />
            )}

            {section === "addresses" && (
              <AddressesSection addresses={addresses} setAddresses={setAddresses} />
            )}
          </div>
        </div>
      </section>

      <AlertDialog
        open={pendingCancelId !== null}
        onOpenChange={(open) => !open && !cancelling && setPendingCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark your booking as cancelled. You can always book the same service again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              onClick={(e) => { e.preventDefault(); confirmCancel(); }}
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

/* ============================== Sidebar ============================== */

function DashboardSidebar({
  current, onSelect, mobileOpen, onCloseMobile, firstName, email,
}: {
  current: SectionKey;
  onSelect: (k: SectionKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  firstName: string;
  email: string;
}) {
  const groups = useMemo(() => {
    const out: { name: string; items: typeof SECTIONS }[] = [];
    SECTIONS.forEach((item) => {
      let g = out.find((x) => x.name === item.group);
      if (!g) { g = { name: item.group, items: [] }; out.push(g); }
      g.items.push(item);
    });
    return out;
  }, []);

  const Body = (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
          {firstName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Hi {firstName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.name}>
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{g.name}</p>
            <ul className="mt-1 space-y-0.5">
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = current === item.key;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.key)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Link
        to="/book"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
      >
        <Plus className="h-4 w-4" /> New booking
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{Body}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] p-3">
            <div className="relative h-full">
              <button
                type="button"
                onClick={onCloseMobile}
                className="absolute -right-2 -top-2 z-10 rounded-full bg-background p-1.5 text-foreground shadow-soft"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              {Body}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================== Sections ============================== */

function OverviewSection({
  firstName, stats, bookings, providerProfiles, loading, onJump,
}: {
  firstName: string;
  stats: { total: number; active: number; completed: number; saved: number; spent: number };
  bookings: Booking[];
  providerProfiles: Record<string, ProviderProfile>;
  loading: boolean;
  onJump: (k: SectionKey) => void;
}) {
  const upcoming = useMemo(
    () => bookings
      .filter((b) => ["new", "confirmed", "assigned"].includes(b.status))
      .sort((a, b) => a.preferred_date.localeCompare(b.preferred_date))
      .slice(0, 3),
    [bookings],
  );
  const recent = useMemo(() => bookings.slice(0, 4), [bookings]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h2 className="text-xl font-bold text-foreground">Hi {firstName} 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's a quick look at your activity. Need something done? <Link to="/book" className="font-semibold text-primary underline">Book a service</Link>.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active" value={stats.active}    icon={Clock}         accent="text-primary" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="text-success" />
        <StatCard label="Saved" value={stats.saved}      icon={Heart} />
        <StatCard label="Spent" value={`৳${stats.spent.toLocaleString()}`} icon={Wallet} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Upcoming services"
          icon={Calendar}
          action={<button type="button" onClick={() => onJump("active")} className="text-xs font-semibold text-primary hover:underline">View all →</button>}
        >
          {loading ? <PanelSkeleton /> : upcoming.length === 0 ? (
            <EmptyInline icon={Calendar} title="Nothing on the calendar" hint="Book a service to see it scheduled here." cta={{ to: "/book", label: "Book a service" }} />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{b.service ?? b.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.preferred_date).toLocaleDateString()} · {b.preferred_time_slot} · {findArea(b.area)?.name ?? b.area}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent activity"
          icon={Bell}
          action={<button type="button" onClick={() => onJump("bookings")} className="text-xs font-semibold text-primary hover:underline">All bookings →</button>}
        >
          {loading ? <PanelSkeleton /> : recent.length === 0 ? (
            <EmptyInline icon={Sparkles} title="No activity yet" hint="Your booking history will appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{b.service ?? b.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.provider_id ? providerProfiles[b.provider_id]?.full_name ?? "Provider assigned" : "Awaiting provider"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Suggestions for you" icon={TrendingUp}>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Deep home cleaning", blurb: "From ৳1,200", to: "/services/cleaning" as const },
            { title: "AC servicing",       blurb: "From ৳800",   to: "/services/ac-repair" as const },
            { title: "Electrician visit",  blurb: "From ৳500",   to: "/services/electrical" as const },
          ].map((s) => (
            <Link key={s.title} to="/services" className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.blurb}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Browse <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function BookingsList({
  title, blurb, loading, bookings, providerProfiles, reviewedBookingIds, onCancel, emptyTitle, emptyHint,
}: {
  title: string;
  blurb: string;
  loading: boolean;
  bookings: Booking[];
  providerProfiles: Record<string, ProviderProfile>;
  reviewedBookingIds: Set<string>;
  onCancel: (id: string) => void;
  emptyTitle: string;
  emptyHint?: string;
}) {
  return (
    <Panel title={title} icon={ClipboardList} blurb={blurb}>
      {loading ? <PanelSkeleton /> : bookings.length === 0 ? (
        <EmptyInline
          icon={ClipboardList}
          title={emptyTitle}
          hint={emptyHint ?? "Book a verified pro in minutes — cleaning, repairs, beauty, tutoring and more."}
          cta={{ to: "/book", label: "Make a booking" }}
        />
      ) : (
        <ul className="divide-y divide-border">
          {bookings.map((b) => {
            const canCancel = b.status === "new" || b.status === "confirmed";
            const canReview = b.status === "completed" && b.provider_id && !reviewedBookingIds.has(b.id);
            const provider  = b.provider_id ? providerProfiles[b.provider_id] : undefined;
            return (
              <li key={b.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{b.service ?? b.category}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">{b.category}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(b.preferred_date).toLocaleDateString()} · {b.preferred_time_slot}</span>
                    <span className="flex items-center gap-1.5"><MapPin   className="h-3.5 w-3.5" />{findArea(b.area)?.name ?? b.area}</span>
                    {provider && <span className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" />{provider.full_name}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/booking-status/$id" params={{ id: b.id }}>Track</Link>
                  </Button>
                  {b.provider_id && (b.status === "assigned" || b.status === "completed") && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/messages" search={{ booking: b.id }}><MessageCircle className="mr-1 h-3.5 w-3.5" /> Message</Link>
                    </Button>
                  )}
                  {canCancel && (
                    <Button size="sm" variant="outline" onClick={() => onCancel(b.id)}>
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                  {canReview && (
                    <Button asChild size="sm">
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
      )}
    </Panel>
  );
}

function SavedSection({
  loading, rows, profiles, removingId, onRemove,
}: {
  loading: boolean;
  rows: SavedRow[];
  profiles: Record<string, ProviderProfile>;
  removingId: string | null;
  onRemove: (rowId: string) => void;
}) {
  return (
    <Panel title="Saved providers" icon={Heart} blurb="Quick access to providers you've favourited.">
      {loading ? <PanelSkeleton /> : rows.length === 0 ? (
        <EmptyInline icon={Heart} title="No saved providers yet" hint="Tap the heart on any provider profile to save them here." cta={{ to: "/providers", label: "Browse providers" }} />
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const p = profiles[r.provider_id];
            const initials = (p?.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
            return (
              <li key={r.id} className="flex items-center gap-4 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {p?.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{p?.full_name ?? "Provider"}</p>
                  <p className="text-xs text-muted-foreground">Saved {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/p/$id" params={{ id: r.provider_id }}>View <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
                <Button size="sm" variant="ghost" disabled={removingId === r.id} onClick={() => onRemove(r.id)} aria-label="Remove from saved">
                  {removingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function ReviewsSection({
  loading, reviews, providerProfiles, bookings,
}: {
  loading: boolean;
  reviews: ReviewRow[];
  providerProfiles: Record<string, ProviderProfile>;
  bookings: Booking[];
}) {
  const bookingMap = useMemo(() => Object.fromEntries(bookings.map((b) => [b.id, b])), [bookings]);
  const pendingToReview = useMemo(() => {
    const reviewedIds = new Set(reviews.map((r) => r.booking_id));
    return bookings.filter((b) => b.status === "completed" && b.provider_id && !reviewedIds.has(b.id));
  }, [bookings, reviews]);

  return (
    <div className="space-y-6">
      {pendingToReview.length > 0 && (
        <Panel title="Waiting for your review" icon={Star} blurb="Help others choose by sharing your experience.">
          <ul className="divide-y divide-border">
            {pendingToReview.slice(0, 5).map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{b.service ?? b.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.provider_id ? providerProfiles[b.provider_id]?.full_name ?? "Provider" : "Provider"} · {new Date(b.preferred_date).toLocaleDateString()}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/p/$id" params={{ id: b.provider_id! }}>Review</Link>
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="My reviews" icon={Star} blurb="Reviews you've left for completed jobs.">
        {loading ? <PanelSkeleton /> : reviews.length === 0 ? (
          <EmptyInline icon={Star} title="No reviews yet" hint="After a job is completed you can leave a star rating and a comment." />
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((r) => {
              const provider = providerProfiles[r.provider_id];
              const booking  = bookingMap[r.booking_id];
              return (
                <li key={r.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{provider?.full_name ?? "Provider"}</p>
                      <p className="text-xs text-muted-foreground">{booking?.service ?? booking?.category ?? "Service"} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">{r.comment}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function PaymentsSection({
  loading, payments, bookings,
}: {
  loading: boolean;
  payments: PaymentRow[];
  bookings: Booking[];
}) {
  const bookingMap = useMemo(() => Object.fromEntries(bookings.map((b) => [b.id, b])), [bookings]);
  const totals = useMemo(() => {
    const paid    = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    const pending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
    return { paid, pending };
  }, [payments]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total paid"    value={`৳${totals.paid.toLocaleString()}`}    icon={CheckCircle2} accent="text-success" />
        <StatCard label="Pending"       value={`৳${totals.pending.toLocaleString()}`} icon={Clock}        accent="text-primary" />
      </div>

      <Panel title="Payment history" icon={Receipt} blurb="All payments linked to your bookings.">
        {loading ? <PanelSkeleton /> : payments.length === 0 ? (
          <EmptyInline icon={CreditCard} title="No payments yet" hint="When you pay for a completed booking, the receipt will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2.5 pr-4 font-medium">Date</th>
                  <th className="py-2.5 pr-4 font-medium">Service</th>
                  <th className="py-2.5 pr-4 font-medium">Method</th>
                  <th className="py-2.5 pr-4 font-medium">Status</th>
                  <th className="py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => {
                  const b = bookingMap[p.booking_id];
                  return (
                    <tr key={p.id}>
                      <td className="py-3 pr-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="py-3 pr-4 font-medium text-foreground">{b?.service ?? b?.category ?? "Service"}</td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">{p.method.replace("_", " ")}</td>
                      <td className="py-3 pr-4">
                        <span className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          p.status === "paid" && "bg-success/15 text-success",
                          p.status === "pending" && "bg-primary/10 text-primary",
                          p.status === "failed" && "bg-destructive/10 text-destructive",
                          p.status === "refunded" && "bg-muted text-foreground",
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-foreground">
                        {p.currency === "BDT" ? "৳" : `${p.currency} `}{Number(p.amount).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SupportSection({ tickets }: { tickets: SupportTicket[] }) {
  return (
    <div className="space-y-6">
      <Panel
        title="Support tickets"
        icon={LifeBuoy}
        blurb="Get help with bookings, payments and providers."
        action={
          <Button asChild size="sm">
            <Link to="/contact"><Plus className="mr-1.5 h-4 w-4" /> New ticket</Link>
          </Button>
        }
      >
        {tickets.length === 0 ? (
          <EmptyInline icon={LifeBuoy} title="No tickets yet" hint="Have an issue? Open a ticket and our support team will reply within 4 hours." cta={{ to: "/contact", label: "Contact support" }} />
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{t.subject}</p>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      t.status === "resolved"    && "bg-success/15 text-success",
                      t.status === "in_progress" && "bg-primary/10 text-primary",
                      t.status === "open"        && "bg-muted text-foreground",
                    )}>{t.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.id} · Updated {t.updated}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{t.lastMessage}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/contact">View</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Phone,       title: "Call us",   blurb: "+880 1700 000000",  to: "tel:+8801700000000",   external: true  },
          { icon: Mail,        title: "Email",     blurb: "help@shebabd.com",   to: "mailto:help@shebabd.com", external: true },
          { icon: HelpCircle,  title: "Help center", blurb: "Read FAQs",        to: "/faq",                 external: false },
        ].map((c) => (
          <a
            key={c.title}
            href={c.external ? c.to : undefined}
            {...(!c.external ? {} : {})}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
            {...(c.external ? {} : { /* will use Link below */ })}
          >
            {!c.external ? (
              <Link to={c.to as "/faq"} className="block">
                <c.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.blurb}</p>
              </Link>
            ) : (
              <>
                <c.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.blurb}</p>
              </>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function ProfileSection({ email, fullName }: { email: string; fullName: string }) {
  return (
    <div className="space-y-6">
      <Panel title="Profile settings" icon={Settings} blurb="Manage how providers and our team contact you.">
        <p className="mb-3 text-xs text-muted-foreground">
          For full profile editing (avatar, phone, area), open the dedicated profile page.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldDisplay label="Full name" value={fullName} />
          <FieldDisplay label="Email"     value={email}    />
        </div>
        <Button asChild size="sm" className="mt-4">
          <Link to="/profile"><UserIcon className="mr-1.5 h-4 w-4" /> Edit full profile</Link>
        </Button>
      </Panel>

      <Panel title="Notifications" icon={Bell} blurb="Choose how we reach you.">
        <ToggleRow label="Booking updates"      hint="Status changes for active bookings." defaultOn />
        <ToggleRow label="Promotions & offers"  hint="Occasional discounts and new services." />
        <ToggleRow label="Provider messages"    hint="Get notified when a provider sends a message." defaultOn />
      </Panel>

      <Panel title="Security" icon={Lock} blurb="Keep your account safe.">
        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Password</p>
            <p className="text-xs text-muted-foreground">Reset via the secure password flow.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/reset-password">Change</Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function AddressesSection({
  addresses, setAddresses,
}: {
  addresses: SavedAddress[];
  setAddresses: (a: SavedAddress[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ label: string; line1: string; area: string; phone: string }>({ label: "", line1: "", area: "", phone: "" });

  function addAddress() {
    if (!draft.label || !draft.line1 || !draft.area) {
      toast.error("Please fill label, address and area.");
      return;
    }
    const id = `addr-${Date.now()}`;
    setAddresses([...addresses, { id, ...draft, isDefault: addresses.length === 0 }]);
    setDraft({ label: "", line1: "", area: "", phone: "" });
    setAdding(false);
    toast.success("Address saved");
  }

  function setDefault(id: string) {
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    toast.success("Default address updated");
  }

  function remove(id: string) {
    setAddresses(addresses.filter((a) => a.id !== id));
    toast.success("Address removed");
  }

  return (
    <Panel
      title="Saved addresses"
      icon={MapPin}
      blurb="Speed up booking — pick a saved address with one tap."
      action={
        <Button size="sm" onClick={() => setAdding((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" /> {adding ? "Close" : "Add address"}
        </Button>
      }
    >
      {adding && (
        <div className="mb-4 grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
          <Input placeholder="Label (Home, Office)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <Input placeholder="Phone (optional)" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <Input className="sm:col-span-2" placeholder="Address line (House, road, apartment)" value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} />
          <Input placeholder="Area (e.g. dhanmondi)" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
          <div className="flex items-center justify-end gap-2 sm:col-span-2">
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" onClick={addAddress}>Save</Button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <EmptyInline icon={Home} title="No saved addresses" hint="Add your home or office to book faster next time." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{a.label}</p>
                    {a.isDefault && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Default</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.line1}</p>
                  <p className="text-xs text-muted-foreground">{findArea(a.area)?.name ?? a.area}{a.phone && ` · ${a.phone}`}</p>
                </div>
                <button type="button" onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {!a.isDefault && (
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setDefault(a.id)}>Set as default</Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ============================== Building blocks ============================== */

function Panel({
  title, icon: Icon, blurb, action, children,
}: { title: string; icon: ComponentType<{ className?: string }>; blurb?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
            {blurb && <p className="text-xs text-muted-foreground">{blurb}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, accent,
}: { label: string; value: number | string; icon: ComponentType<{ className?: string }>; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4 text-muted-foreground", accent)} />
      </div>
      <div className={cn("mt-2 text-2xl font-bold", accent ?? "text-foreground")}>{value}</div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInline({
  icon: Icon, title, hint, cta,
}: { icon: ComponentType<{ className?: string }>; title: string; hint: string; cta?: { to: "/book" | "/providers" | "/contact"; label: string } }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>
      {cta && (
        <Button asChild size="sm" className="mt-1">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function ToggleRow({ label, hint, defaultOn = false }: { label: string; hint: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        role="switch"
        aria-checked={on}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted",
        )}
      >
        <span className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-background shadow-soft transition-transform",
          on ? "translate-x-5" : "translate-x-0.5",
        )} />
      </button>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("h-4 w-4", n <= rating ? "fill-warning text-warning" : "text-muted-foreground")} />
      ))}
    </div>
  );
}
