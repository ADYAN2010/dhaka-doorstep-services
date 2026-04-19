import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  Inbox,
  Layers,
  LayoutDashboard,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User as UserIcon,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/components/record-payment-dialog";
import { categories as ALL_CATEGORIES } from "@/data/categories";
import { areas as ALL_AREAS, findArea } from "@/data/areas";
import { ProviderOperations } from "@/components/provider-ops";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/provider-dashboard")({
  component: ProviderDashboard,
  head: () => ({
    meta: [
      { title: "Provider dashboard · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

/* ============================== Types ============================== */

type ProviderStatus = "not_applicable" | "pending" | "approved" | "rejected";
type BookingStatus = "new" | "confirmed" | "assigned" | "completed" | "cancelled";

type LeadRow = {
  id: string;
  full_name: string;
  phone: string;
  category: string;
  service: string | null;
  area: string;
  preferred_date: string;
  preferred_time_slot: string;
  budget_range: string | null;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  provider_id: string | null;
};

type Profile = {
  full_name: string;
  area: string | null;
  provider_status: ProviderStatus;
};

type LedgerRow = {
  id: string;
  booking_id: string;
  category: string;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  provider_net: number;
  currency: string;
  paid_out: boolean;
  created_at: string;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  booking_id: string;
};

type Slot = { weekday: number; is_active: boolean; start_time: string; end_time: string };

type SectionKey =
  | "overview" | "operations" | "requests" | "assigned" | "completed" | "earnings"
  | "reviews" | "services" | "coverage" | "availability" | "verification"
  | "notifications" | "profile";

const SECTIONS: { key: SectionKey; label: string; icon: ComponentType<{ className?: string }>; group: "Work" | "Operations" | "Earn" | "Settings" }[] = [
  { key: "overview",      label: "Overview",          icon: LayoutDashboard, group: "Work" },
  { key: "requests",      label: "Booking requests",  icon: Inbox,           group: "Work" },
  { key: "assigned",      label: "Assigned jobs",     icon: Briefcase,       group: "Work" },
  { key: "completed",     label: "Completed jobs",    icon: CheckCircle2,    group: "Work" },
  { key: "operations",    label: "Operations",        icon: TrendingUp,      group: "Operations" },
  { key: "earnings",      label: "Earnings",          icon: Wallet,          group: "Earn" },
  { key: "reviews",       label: "Ratings & reviews", icon: Star,            group: "Earn" },
  { key: "services",      label: "Services offered",  icon: Layers,          group: "Settings" },
  { key: "coverage",      label: "Coverage areas",    icon: MapPin,          group: "Settings" },
  { key: "availability",  label: "Availability",      icon: Clock,           group: "Settings" },
  { key: "verification",  label: "Verification",      icon: ShieldCheck,     group: "Settings" },
  { key: "notifications", label: "Notifications",     icon: Bell,            group: "Settings" },
  { key: "profile",       label: "Profile settings",  icon: Settings,        group: "Settings" },
];

const BUDGET_MIDPOINT: Record<string, number> = {
  "under-1000": 800,
  "1000-3000": 2000,
  "3000-5000": 4000,
  "5000-10000": 7500,
  "10000-20000": 15000,
  "20000+": 25000,
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function slotToTime(slot: string): string {
  const s = slot.toLowerCase();
  if (s.includes("morning")) return "10:00:00";
  if (s.includes("afternoon")) return "14:00:00";
  if (s.includes("evening")) return "18:00:00";
  return "11:00:00";
}

function leadMatchesAvailability(l: { preferred_date: string; preferred_time_slot: string }, availability: Slot[]) {
  if (!availability.length) return true;
  const weekday = new Date(`${l.preferred_date}T00:00:00`).getDay();
  const slot = availability.find((a) => a.weekday === weekday);
  if (!slot || !slot.is_active) return false;
  if (l.preferred_time_slot.toLowerCase().includes("anytime")) return true;
  const t = slotToTime(l.preferred_time_slot);
  return slot.start_time <= t && slot.end_time > t;
}

function fmtBDT(n: number) {
  return `৳${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/* ============================== Page ============================== */

function ProviderDashboard() {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isProvider = roles.includes("provider");

  const [section, setSection] = useState<SectionKey>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [openLeads, setOpenLeads] = useState<LeadRow[]>([]);
  const [myJobs, setMyJobs] = useState<LeadRow[]>([]);
  const [coverageCats, setCoverageCats] = useState<Set<string>>(new Set());
  const [coverageAreas, setCoverageAreas] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Slot[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [respectAvailability, setRespectAvailability] = useState(true);
  const [activePaymentJob, setActivePaymentJob] = useState<{ id: string; complete: boolean } | null>(null);

  // Redirect non-providers
  useEffect(() => {
    if (authLoading || !user) return;
    const t = setTimeout(() => { if (!isProvider) navigate({ to: "/dashboard" }); }, 600);
    return () => clearTimeout(t);
  }, [authLoading, user, isProvider, navigate]);

  const refresh = useCallback(async () => {
    if (!user || !isProvider) return;
    const [
      { data: prof },
      { data: openData },
      { data: minedData },
      { data: cats },
      { data: ars },
      { data: avail },
      { data: ledgerData },
    ] = await Promise.all([
      supabase.from("profiles").select("full_name, area, provider_status").eq("id", user.id).maybeSingle(),
      supabase.from("bookings")
        .select("id, full_name, phone, category, service, area, preferred_date, preferred_time_slot, budget_range, notes, status, created_at, provider_id")
        .is("provider_id", null).eq("status", "new").order("created_at", { ascending: false }),
      supabase.from("bookings")
        .select("id, full_name, phone, category, service, area, preferred_date, preferred_time_slot, budget_range, notes, status, created_at, provider_id")
        .eq("provider_id", user.id).order("created_at", { ascending: false }),
      supabase.from("provider_categories").select("category").eq("user_id", user.id),
      supabase.from("provider_areas").select("area").eq("user_id", user.id),
      supabase.from("provider_availability").select("weekday, is_active, start_time, end_time").eq("user_id", user.id),
      supabase.from("commission_ledger")
        .select("id, booking_id, category, gross_amount, commission_rate, commission_amount, provider_net, currency, paid_out, created_at")
        .eq("provider_id", user.id).order("created_at", { ascending: false }),
    ]);

    setProfile((prof as Profile | null) ?? null);
    setOpenLeads((openData ?? []) as LeadRow[]);
    setMyJobs((minedData ?? []) as LeadRow[]);
    setCoverageCats(new Set((cats ?? []).map((c) => c.category)));
    setCoverageAreas(new Set((ars ?? []).map((a) => a.area)));
    setAvailability((avail ?? []) as Slot[]);
    setLedger((ledgerData ?? []) as LedgerRow[]);

    // Reviews for this provider
    const { data: revs } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user_id, booking_id")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });
    const r = (revs ?? []) as ReviewRow[];
    setReviews(r);
    if (r.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", r.map((x) => x.user_id));
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p) => { map[p.id] = p.full_name ?? "Customer"; });
      setReviewerNames(map);
    }

    setLoading(false);
  }, [user, isProvider]);

  useEffect(() => {
    if (!user || !isProvider) return;
    setLoading(true);
    refresh();
  }, [user, isProvider, refresh]);

  async function acceptLead(id: string) {
    setAcceptingId(id);
    const prev = openLeads;
    setOpenLeads((ls) => ls.filter((l) => l.id !== id));
    const { error } = await supabase.rpc("accept_lead", { _booking_id: id });
    setAcceptingId(null);
    if (error) {
      setOpenLeads(prev);
      toast.error("Could not accept lead", { description: error.message });
      return;
    }
    toast.success("Lead accepted — it's now in your jobs.");
    await refresh();
  }

  /* Derived */
  const visibleOpenLeads = useMemo(() => {
    if (!respectAvailability || availability.length === 0) return openLeads;
    return openLeads.filter((l) => leadMatchesAvailability(l, availability));
  }, [openLeads, availability, respectAvailability]);

  const assignedJobs = useMemo(() => myJobs.filter((j) => j.status === "assigned" || j.status === "confirmed"), [myJobs]);
  const completedJobs = useMemo(() => myJobs.filter((j) => j.status === "completed"), [myJobs]);

  const earningsStats = useMemo(() => {
    let gross = 0, net = 0, pending = 0, paid = 0;
    ledger.forEach((r) => {
      gross += Number(r.gross_amount);
      net += Number(r.provider_net);
      if (r.paid_out) paid += Number(r.provider_net);
      else pending += Number(r.provider_net);
    });
    // Fallback estimate from budget midpoints if ledger is empty
    const estimate = completedJobs.reduce((s, j) => s + (j.budget_range ? (BUDGET_MIDPOINT[j.budget_range] ?? 0) : 0), 0);
    return { gross, net, pending, paid, estimate };
  }, [ledger, completedJobs]);

  const reviewStats = useMemo(() => {
    if (!reviews.length) return { avg: 0, total: 0, breakdown: [0, 0, 0, 0, 0] };
    const total = reviews.length;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const breakdown = [0, 0, 0, 0, 0];
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating - 1]++; });
    return { avg: sum / total, total, breakdown };
  }, [reviews]);

  const status: ProviderStatus = profile?.provider_status ?? "pending";
  const isApproved = status === "approved";
  const noCoverage = isApproved && (coverageCats.size === 0 || coverageAreas.size === 0);
  const noHours = isApproved && availability.length === 0;
  const fullName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "Provider";
  const firstName = fullName.split(" ")[0];

  const currentSection = SECTIONS.find((s) => s.key === section)!;

  if (authLoading || (user && !isProvider)) {
    return (
      <SiteShell>
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="container-page py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ProviderSidebar
              current={section}
              onSelect={(k) => { setSection(k); setMobileNavOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              mobileOpen={mobileNavOpen}
              onCloseMobile={() => setMobileNavOpen(false)}
              firstName={firstName}
              email={user?.email ?? ""}
              status={status}
            />
          </aside>

          {/* Main */}
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Provider dashboard</p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {currentSection.label}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <ProviderStatusBadge status={status} />
                <Button size="sm" variant="outline" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
                  <Settings className="mr-1.5 h-4 w-4" /> Menu
                </Button>
              </div>
            </div>

            {section === "overview" && (
              <OverviewSection
                firstName={firstName}
                status={status}
                isApproved={isApproved}
                noCoverage={noCoverage}
                noHours={noHours}
                openCount={visibleOpenLeads.length}
                openTotal={openLeads.length}
                assignedCount={assignedJobs.length}
                completedCount={completedJobs.length}
                pendingPayout={earningsStats.pending || earningsStats.estimate}
                avgRating={reviewStats.avg}
                reviewCount={reviewStats.total}
                upcoming={assignedJobs.slice(0, 3)}
                latestLeads={visibleOpenLeads.slice(0, 3)}
                loading={loading}
                onJump={setSection}
                onAccept={acceptLead}
                acceptingId={acceptingId}
              />
            )}

            {section === "operations" && (
              <ProviderOperations
                status={status}
                fullName={fullName}
                hasCoverage={!noCoverage}
                hasHours={!noHours}
                hasAvatar={!!user?.user_metadata?.avatar_url}
                hasBio={!!(user?.user_metadata?.bio as string | undefined)?.length}
                hasPhone={!!profile?.area}
                jobs={myJobs.map((j) => ({
                  id: j.id, status: j.status, preferred_date: j.preferred_date,
                  created_at: j.created_at, budget_range: j.budget_range, category: j.category,
                }))}
                ledger={ledger.map((l) => ({
                  id: l.id, paid_out: l.paid_out,
                  provider_net: Number(l.provider_net), created_at: l.created_at,
                }))}
                reviews={reviews.map((r) => ({ rating: r.rating, created_at: r.created_at }))}
              />
            )}

            {section === "requests" && (
              <RequestsSection
                loading={loading}
                openLeads={openLeads}
                visibleOpenLeads={visibleOpenLeads}
                hasAvailability={availability.length > 0}
                respectAvailability={respectAvailability}
                onToggleRespect={setRespectAvailability}
                isApproved={isApproved}
                noCoverage={noCoverage}
                acceptingId={acceptingId}
                onAccept={acceptLead}
                onJump={setSection}
              />
            )}

            {section === "assigned" && (
              <JobsSection
                title="Assigned jobs"
                blurb="Jobs you've accepted — message the customer and complete when done."
                loading={loading}
                jobs={assignedJobs}
                empty={{ title: "No active jobs", hint: "Accept a request to see it here with the customer's contact details." }}
                onComplete={(id) => setActivePaymentJob({ id, complete: true })}
              />
            )}

            {section === "completed" && (
              <JobsSection
                title="Completed jobs"
                blurb="Past jobs — record extra payments or check ratings."
                loading={loading}
                jobs={completedJobs}
                empty={{ title: "No completed jobs yet", hint: "Once you mark a job complete it shows up here with earnings." }}
                onAddPayment={(id) => setActivePaymentJob({ id, complete: false })}
              />
            )}

            {section === "earnings" && (
              <EarningsSection loading={loading} stats={earningsStats} ledger={ledger} completedCount={completedJobs.length} />
            )}

            {section === "reviews" && (
              <ReviewsSection loading={loading} reviews={reviews} reviewerNames={reviewerNames} stats={reviewStats} />
            )}

            {section === "services" && (
              <ServicesOfferedSection
                isApproved={isApproved}
                selected={coverageCats}
                onChange={setCoverageCats}
                userId={user!.id}
              />
            )}

            {section === "coverage" && (
              <CoverageAreasSection
                isApproved={isApproved}
                selected={coverageAreas}
                onChange={setCoverageAreas}
                userId={user!.id}
              />
            )}

            {section === "availability" && (
              <AvailabilitySection
                isApproved={isApproved}
                slots={availability}
                onChange={setAvailability}
                userId={user!.id}
              />
            )}

            {section === "verification" && (
              <VerificationSection status={status} hasCoverage={!noCoverage} hasHours={!noHours} />
            )}

            {section === "notifications" && <NotificationsSection />}

            {section === "profile" && (
              <ProfileShortcutSection
                fullName={fullName}
                email={user?.email ?? ""}
                area={profile?.area ?? null}
              />
            )}
          </div>
        </div>
      </section>

      {activePaymentJob && (
        <RecordPaymentDialog
          bookingId={activePaymentJob.id}
          open={!!activePaymentJob}
          onOpenChange={(v) => !v && setActivePaymentJob(null)}
          alsoCompleteBooking={activePaymentJob.complete}
          onRecorded={() => { setActivePaymentJob(null); void refresh(); }}
        />
      )}
    </SiteShell>
  );
}

/* ============================== Sidebar ============================== */

function ProviderSidebar({
  current, onSelect, mobileOpen, onCloseMobile, firstName, email, status,
}: {
  current: SectionKey;
  onSelect: (k: SectionKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  firstName: string;
  email: string;
  status: ProviderStatus;
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
          <p className="truncate text-sm font-semibold text-foreground">{firstName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-foreground">Provider status</p>
        </div>
        <div className="mt-1.5"><ProviderStatusBadge status={status} /></div>
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
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{Body}</div>
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
  firstName, status, isApproved, noCoverage, noHours,
  openCount, openTotal, assignedCount, completedCount, pendingPayout,
  avgRating, reviewCount, upcoming, latestLeads, loading, onJump, onAccept, acceptingId,
}: {
  firstName: string;
  status: ProviderStatus;
  isApproved: boolean;
  noCoverage: boolean;
  noHours: boolean;
  openCount: number;
  openTotal: number;
  assignedCount: number;
  completedCount: number;
  pendingPayout: number;
  avgRating: number;
  reviewCount: number;
  upcoming: LeadRow[];
  latestLeads: LeadRow[];
  loading: boolean;
  onJump: (k: SectionKey) => void;
  onAccept: (id: string) => void;
  acceptingId: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h2 className="text-xl font-bold text-foreground">{firstName}'s workspace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isApproved
            ? "Accept matching leads, complete your jobs and get paid."
            : "We'll unlock leads as soon as your application is approved."}
        </p>
      </div>

      {!isApproved && <StatusBanner status={status} />}
      {isApproved && (noCoverage || noHours) && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Finish setting up your workspace</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {noCoverage && noHours
                  ? "Add your services, coverage areas and weekly hours so we can match leads to you."
                  : noCoverage
                    ? "Add the services and areas you cover."
                    : "Set your weekly working hours."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {noCoverage && <Button size="sm" onClick={() => onJump("services")}>Set services & areas</Button>}
                {noHours && <Button size="sm" variant="outline" onClick={() => onJump("availability")}>Set hours</Button>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open requests" value={openCount} icon={Inbox} accent="text-primary" />
        <StatCard label="Active jobs" value={assignedCount} icon={Briefcase} />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} accent="text-success" />
        <StatCard label="Pending payout" value={fmtBDT(pendingPayout)} icon={Wallet} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="New requests for you"
          icon={Inbox}
          blurb={openTotal > openCount ? `Showing ${openCount} matching your hours of ${openTotal}.` : "First to accept gets the job."}
          action={<button type="button" onClick={() => onJump("requests")} className="text-xs font-semibold text-primary hover:underline">View all →</button>}
        >
          {loading ? <PanelSkeleton /> : latestLeads.length === 0 ? (
            <EmptyInline icon={Inbox} title="No new requests" hint={isApproved ? "Matching leads will appear here as they come in." : "Once approved, leads will start arriving."} />
          ) : (
            <ul className="divide-y divide-border">
              {latestLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{l.service ?? l.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {findArea(l.area)?.name ?? l.area} · {new Date(l.preferred_date).toLocaleDateString()} · {l.preferred_time_slot}
                    </p>
                  </div>
                  <Button size="sm" disabled={acceptingId === l.id} onClick={() => onAccept(l.id)}>
                    {acceptingId === l.id && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Accept
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Upcoming jobs"
          icon={Calendar}
          action={<button type="button" onClick={() => onJump("assigned")} className="text-xs font-semibold text-primary hover:underline">All jobs →</button>}
        >
          {loading ? <PanelSkeleton /> : upcoming.length === 0 ? (
            <EmptyInline icon={Calendar} title="No upcoming jobs" hint="Accepted jobs will appear here with the customer's contact details." />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{j.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.service ?? j.category} · {new Date(j.preferred_date).toLocaleDateString()} · {j.preferred_time_slot}
                    </p>
                  </div>
                  <StatusBadge status={j.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Performance" icon={TrendingUp}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average rating</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{avgRating ? avgRating.toFixed(1) : "—"}</span>
              {avgRating > 0 && <Star className="h-4 w-4 fill-warning text-warning" />}
            </div>
            <p className="text-xs text-muted-foreground">{reviewCount} review{reviewCount === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lifetime jobs</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending payout</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{fmtBDT(pendingPayout)}</p>
            <p className="text-xs text-muted-foreground">Paid weekly by Shebabd</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function RequestsSection({
  loading, openLeads, visibleOpenLeads, hasAvailability, respectAvailability, onToggleRespect,
  isApproved, noCoverage, acceptingId, onAccept, onJump,
}: {
  loading: boolean;
  openLeads: LeadRow[];
  visibleOpenLeads: LeadRow[];
  hasAvailability: boolean;
  respectAvailability: boolean;
  onToggleRespect: (v: boolean) => void;
  isApproved: boolean;
  noCoverage: boolean;
  acceptingId: string | null;
  onAccept: (id: string) => void;
  onJump: (k: SectionKey) => void;
}) {
  return (
    <Panel
      title="Booking requests"
      icon={Inbox}
      blurb={hasAvailability && respectAvailability
        ? `Showing ${visibleOpenLeads.length} of ${openLeads.length} open requests that match your hours.`
        : "Open requests in your service area — first to accept wins."}
      action={hasAvailability ? (
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={respectAvailability} onChange={(e) => onToggleRespect(e.target.checked)} className="h-3.5 w-3.5 rounded border-border" />
          Match my hours
        </label>
      ) : isApproved ? (
        <Button size="sm" variant="outline" onClick={() => onJump("availability")}><Clock className="mr-1 h-3.5 w-3.5" /> Set hours</Button>
      ) : null}
    >
      {loading ? <PanelSkeleton /> : visibleOpenLeads.length === 0 ? (
        <EmptyInline
          icon={Inbox}
          title={openLeads.length > 0 && respectAvailability && hasAvailability ? "No requests match your hours" : "No open requests right now"}
          hint={
            openLeads.length > 0 && respectAvailability && hasAvailability
              ? "Uncheck \"Match my hours\" to see all open requests, or update your working hours."
              : isApproved
                ? noCoverage ? "Set your services and coverage to start receiving matched requests." : "We'll show new jobs in your categories and areas as they come in."
                : "Once your provider application is approved, matching requests will appear here."
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {visibleOpenLeads.map((l) => (
            <li key={l.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{l.service ?? l.category}</p>
                  <span className="text-xs capitalize text-muted-foreground">· {l.category}</span>
                </div>
                <p className="mt-0.5 text-sm font-medium text-foreground">{l.full_name}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(l.preferred_date).toLocaleDateString()} · {l.preferred_time_slot}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{findArea(l.area)?.name ?? l.area}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{l.phone}</span>
                  {l.budget_range && <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />{l.budget_range}</span>}
                </div>
                {l.notes && <p className="mt-2 line-clamp-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">"{l.notes}"</p>}
              </div>
              <div className="sm:justify-self-end">
                <Button size="sm" disabled={acceptingId === l.id} onClick={() => onAccept(l.id)}>
                  {acceptingId === l.id && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Accept request
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function JobsSection({
  title, blurb, loading, jobs, empty, onComplete, onAddPayment,
}: {
  title: string;
  blurb: string;
  loading: boolean;
  jobs: LeadRow[];
  empty: { title: string; hint: string };
  onComplete?: (id: string) => void;
  onAddPayment?: (id: string) => void;
}) {
  return (
    <Panel title={title} icon={Briefcase} blurb={blurb}>
      {loading ? <PanelSkeleton /> : jobs.length === 0 ? (
        <EmptyInline icon={Briefcase} title={empty.title} hint={empty.hint} />
      ) : (
        <ul className="divide-y divide-border">
          {jobs.map((j) => (
            <li key={j.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{j.full_name}</p>
                  <StatusBadge status={j.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{j.service ?? j.category}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(j.preferred_date).toLocaleDateString()} · {j.preferred_time_slot}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{findArea(j.area)?.name ?? j.area}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{j.phone}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button asChild size="sm" variant="outline">
                  <Link to="/messages" search={{ booking: j.id }}><MessageCircle className="mr-1 h-3.5 w-3.5" /> Message</Link>
                </Button>
                {onComplete && (j.status === "assigned" || j.status === "confirmed") && (
                  <Button size="sm" onClick={() => onComplete(j.id)}>
                    <CheckCheck className="mr-1 h-3.5 w-3.5" /> Complete & record
                  </Button>
                )}
                {onAddPayment && j.status === "completed" && (
                  <Button size="sm" variant="outline" onClick={() => onAddPayment(j.id)}>
                    <Wallet className="mr-1 h-3.5 w-3.5" /> Add payment
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function EarningsSection({
  loading, stats, ledger, completedCount,
}: {
  loading: boolean;
  stats: { gross: number; net: number; pending: number; paid: number; estimate: number };
  ledger: LedgerRow[];
  completedCount: number;
}) {
  const hasLedger = ledger.length > 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Lifetime gross" value={fmtBDT(stats.gross)} icon={TrendingUp} />
        <StatCard label="Lifetime net" value={fmtBDT(stats.net)} icon={Wallet} accent="text-success" />
        <StatCard label="Pending payout" value={fmtBDT(stats.pending)} icon={Clock} accent="text-primary" />
        <StatCard label="Paid out" value={fmtBDT(stats.paid)} icon={CheckCircle2} />
      </div>

      <Panel title="Commission ledger" icon={Receipt} blurb="Each completed job with commission and your net earnings." action={
        <Button asChild size="sm" variant="outline"><Link to="/earnings">Open full earnings →</Link></Button>
      }>
        {loading ? <PanelSkeleton /> : !hasLedger ? (
          <EmptyInline
            icon={Receipt}
            title="No payouts recorded yet"
            hint={completedCount > 0
              ? `You've completed ${completedCount} job${completedCount === 1 ? "" : "s"}. Once payments are recorded, your commission ledger appears here.`
              : "Once you complete a job and a payment is recorded, your earnings appear here."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2.5 pr-4 font-medium">Date</th>
                  <th className="py-2.5 pr-4 font-medium">Category</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Gross</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Commission</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Your net</th>
                  <th className="py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 capitalize text-foreground">{r.category}</td>
                    <td className="py-3 pr-4 text-right">{fmtBDT(Number(r.gross_amount))}</td>
                    <td className="py-3 pr-4 text-right text-xs text-muted-foreground">-{fmtBDT(Number(r.commission_amount))} ({Number(r.commission_rate)}%)</td>
                    <td className="py-3 pr-4 text-right font-semibold text-foreground">{fmtBDT(Number(r.provider_net))}</td>
                    <td className="py-3">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        r.paid_out ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
                      )}>
                        {r.paid_out ? "Paid out" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function ReviewsSection({
  loading, reviews, reviewerNames, stats,
}: {
  loading: boolean;
  reviews: ReviewRow[];
  reviewerNames: Record<string, string>;
  stats: { avg: number; total: number; breakdown: number[] };
}) {
  return (
    <div className="space-y-6">
      <Panel title="Ratings overview" icon={Star}>
        <div className="grid gap-6 sm:grid-cols-[200px_1fr] sm:items-center">
          <div className="text-center sm:text-left">
            <div className="text-5xl font-bold text-foreground">{stats.avg ? stats.avg.toFixed(1) : "—"}</div>
            <div className="mt-1 flex items-center justify-center gap-0.5 sm:justify-start">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn("h-5 w-5", n <= Math.round(stats.avg) ? "fill-warning text-warning" : "text-muted-foreground")} />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stats.total} review{stats.total === 1 ? "" : "s"}</p>
          </div>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.breakdown[star - 1];
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-6 text-muted-foreground">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-warning" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel title="All reviews" icon={Star} blurb="Customer feedback for your completed jobs.">
        {loading ? <PanelSkeleton /> : reviews.length === 0 ? (
          <EmptyInline icon={Star} title="No reviews yet" hint="After you complete jobs, customers can leave a star rating and a comment." />
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{reviewerNames[r.user_id] ?? "Customer"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn("h-4 w-4", n <= r.rating ? "fill-warning text-warning" : "text-muted-foreground")} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function ServicesOfferedSection({
  isApproved, selected, onChange, userId,
}: {
  isApproved: boolean;
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  userId: string;
}) {
  const [saving, setSaving] = useState(false);
  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange(next);
  }
  async function save() {
    if (!isApproved) { toast.error("Approval required to save services."); return; }
    setSaving(true);
    const { data: current } = await supabase.from("provider_categories").select("category").eq("user_id", userId);
    const currentSet = new Set((current ?? []).map((c) => c.category));
    const toAdd = [...selected].filter((c) => !currentSet.has(c));
    const toRemove = [...currentSet].filter((c) => !selected.has(c));
    const ops: Promise<{ error: unknown }>[] = [];
    if (toAdd.length) ops.push(supabase.from("provider_categories").insert(toAdd.map((category) => ({ user_id: userId, category }))) as unknown as Promise<{ error: unknown }>);
    if (toRemove.length) ops.push(supabase.from("provider_categories").delete().eq("user_id", userId).in("category", toRemove) as unknown as Promise<{ error: unknown }>);
    const results = await Promise.all(ops);
    setSaving(false);
    const err = results.find((r) => r.error);
    if (err) { toast.error("Could not save", { description: (err.error as { message?: string })?.message }); return; }
    toast.success("Services updated");
  }
  return (
    <Panel
      title="Services offered"
      icon={Layers}
      blurb="Pick every category you can take jobs in. We only show matching leads."
      action={<Button size="sm" onClick={save} disabled={saving || !isApproved}>{saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Save</Button>}
    >
      {!isApproved && <ApprovalNotice />}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ALL_CATEGORIES.map((c) => {
          const on = selected.has(c.slug);
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => toggle(c.slug)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              <span className="truncate">{c.name}</span>
              {on && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{selected.size} categor{selected.size === 1 ? "y" : "ies"} selected</p>
    </Panel>
  );
}

function CoverageAreasSection({
  isApproved, selected, onChange, userId,
}: {
  isApproved: boolean;
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  userId: string;
}) {
  const [saving, setSaving] = useState(false);
  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange(next);
  }
  async function save() {
    if (!isApproved) { toast.error("Approval required to save areas."); return; }
    setSaving(true);
    const { data: current } = await supabase.from("provider_areas").select("area").eq("user_id", userId);
    const currentSet = new Set((current ?? []).map((a) => a.area));
    const toAdd = [...selected].filter((a) => !currentSet.has(a));
    const toRemove = [...currentSet].filter((a) => !selected.has(a));
    const ops: Promise<{ error: unknown }>[] = [];
    if (toAdd.length) ops.push(supabase.from("provider_areas").insert(toAdd.map((area) => ({ user_id: userId, area }))) as unknown as Promise<{ error: unknown }>);
    if (toRemove.length) ops.push(supabase.from("provider_areas").delete().eq("user_id", userId).in("area", toRemove) as unknown as Promise<{ error: unknown }>);
    const results = await Promise.all(ops);
    setSaving(false);
    const err = results.find((r) => r.error);
    if (err) { toast.error("Could not save", { description: (err.error as { message?: string })?.message }); return; }
    toast.success("Coverage updated");
  }
  return (
    <Panel
      title="Coverage areas"
      icon={MapPin}
      blurb="Pick every Dhaka area you'll travel to."
      action={<Button size="sm" onClick={save} disabled={saving || !isApproved}>{saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Save</Button>}
    >
      {!isApproved && <ApprovalNotice />}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ALL_AREAS.map((a) => {
          const on = selected.has(a.slug);
          return (
            <button
              key={a.slug}
              type="button"
              onClick={() => toggle(a.slug)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              <span className="truncate">{a.name}</span>
              {on && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{selected.size} area{selected.size === 1 ? "" : "s"} selected</p>
    </Panel>
  );
}

function AvailabilitySection({
  isApproved, slots, onChange, userId,
}: {
  isApproved: boolean;
  slots: Slot[];
  onChange: (s: Slot[]) => void;
  userId: string;
}) {
  const [saving, setSaving] = useState(false);
  const fullSlots: Slot[] = useMemo(() => {
    const map = new Map(slots.map((s) => [s.weekday, s]));
    return WEEKDAYS.map((_, n) => map.get(n) ?? { weekday: n, is_active: n >= 1 && n <= 5, start_time: "09:00:00", end_time: "18:00:00" });
  }, [slots]);

  function update(weekday: number, patch: Partial<Slot>) {
    onChange(fullSlots.map((s) => (s.weekday === weekday ? { ...s, ...patch } : s)));
  }

  async function save() {
    if (!isApproved) { toast.error("Approval required to save hours."); return; }
    for (const s of fullSlots) {
      if (s.is_active && s.end_time <= s.start_time) {
        toast.error(`Fix ${WEEKDAYS[s.weekday]}: end must be after start.`);
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase.from("provider_availability").upsert(
      fullSlots.map((s) => ({
        user_id: userId,
        weekday: s.weekday,
        is_active: s.is_active,
        start_time: s.start_time.slice(0, 5),
        end_time: s.end_time.slice(0, 5),
      })),
      { onConflict: "user_id,weekday" },
    );
    setSaving(false);
    if (error) { toast.error("Could not save", { description: error.message }); return; }
    toast.success("Working hours updated");
  }

  return (
    <Panel
      title="Weekly availability"
      icon={Clock}
      blurb="Set the hours you take jobs each day."
      action={<Button size="sm" onClick={save} disabled={saving || !isApproved}>{saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Save hours</Button>}
    >
      {!isApproved && <ApprovalNotice />}
      <ul className="divide-y divide-border">
        {fullSlots.map((s) => (
          <li key={s.weekday} className="grid items-center gap-3 py-3 sm:grid-cols-[120px_1fr_80px]">
            <label className="flex items-center gap-2.5 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={s.is_active}
                onChange={(e) => update(s.weekday, { is_active: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              {WEEKDAYS[s.weekday]}
            </label>
            <div className="flex items-center gap-2 text-sm">
              <input
                type="time"
                value={s.start_time.slice(0, 5)}
                disabled={!s.is_active}
                onChange={(e) => update(s.weekday, { start_time: `${e.target.value}:00` })}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="time"
                value={s.end_time.slice(0, 5)}
                disabled={!s.is_active}
                onChange={(e) => update(s.weekday, { end_time: `${e.target.value}:00` })}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <span className={cn("text-xs font-medium", s.is_active ? "text-success" : "text-muted-foreground")}>
              {s.is_active ? "Open" : "Closed"}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function VerificationSection({
  status, hasCoverage, hasHours,
}: {
  status: ProviderStatus;
  hasCoverage: boolean;
  hasHours: boolean;
}) {
  const checklist = [
    { label: "Account created", done: true },
    { label: "Application submitted", done: status !== "not_applicable" },
    { label: "Identity & documents reviewed", done: status === "approved" || status === "rejected" },
    { label: "Provider account approved", done: status === "approved" },
    { label: "Services & coverage configured", done: hasCoverage },
    { label: "Working hours set", done: hasHours },
  ];

  return (
    <div className="space-y-6">
      <Panel title="Verification status" icon={ShieldCheck}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
            status === "approved" ? "bg-success/15 text-success" :
            status === "rejected" ? "bg-destructive/15 text-destructive" :
            status === "pending" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}>
            {status === "approved" ? <CheckCircle2 className="h-7 w-7" /> :
             status === "rejected" ? <XCircle className="h-7 w-7" /> :
             status === "pending" ? <Clock className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1"><ProviderStatusBadge status={status} /></div>
            <p className="text-sm text-foreground">
              {status === "approved" && "Your provider account is fully verified. You can accept leads, set hours and get paid."}
              {status === "pending" && "Our team is reviewing your application. You'll receive an email when verified — usually within 1–2 business days."}
              {status === "rejected" && "Your application wasn't approved. Reach out to support to update your details and re-apply."}
              {status === "not_applicable" && "You haven't applied to become a provider yet. Submit an application to start receiving leads."}
            </p>
            {status === "not_applicable" && (
              <Button asChild size="sm" className="mt-3"><Link to="/become-provider">Apply now</Link></Button>
            )}
            {status === "rejected" && (
              <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/contact">Contact support</Link></Button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Onboarding checklist" icon={FileCheck2} blurb="Complete every step to start earning.">
        <ul className="space-y-2">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                c.done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}>
                {c.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              <p className={cn("text-sm", c.done ? "font-medium text-foreground" : "text-muted-foreground")}>{c.label}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function NotificationsSection() {
  return (
    <Panel title="Notification preferences" icon={Bell} blurb="Choose how we reach you about new leads and customer activity.">
      <ToggleRow label="New booking requests" hint="Get notified the moment a matching lead arrives." defaultOn />
      <ToggleRow label="Customer messages" hint="Push and email when a customer sends a message." defaultOn />
      <ToggleRow label="Job status updates" hint="Reminders for upcoming jobs and post-job actions." defaultOn />
      <ToggleRow label="Payout updates" hint="When a payout is processed or sent." defaultOn />
      <ToggleRow label="Tips & growth advice" hint="Occasional tips to help you win more jobs." />
      <ToggleRow label="Promotions" hint="Special offers from Shebabd to providers." />
    </Panel>
  );
}

function ProfileShortcutSection({
  fullName, email, area,
}: {
  fullName: string;
  email: string;
  area: string | null;
}) {
  return (
    <div className="space-y-6">
      <Panel title="Profile" icon={UserIcon} blurb="Your public-facing details are managed in your full profile.">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldDisplay label="Full name" value={fullName} />
          <FieldDisplay label="Email" value={email} />
          <FieldDisplay label="Primary area" value={area ? (findArea(area)?.name ?? area) : "—"} />
        </div>
        <Button asChild size="sm" className="mt-4"><Link to="/profile"><UserIcon className="mr-1.5 h-4 w-4" /> Edit full profile</Link></Button>
      </Panel>

      <Panel title="Quick links" icon={ChevronRight}>
        <ul className="grid gap-2 sm:grid-cols-2">
          <QuickLink to="/messages" icon={MessageCircle} title="Messages" hint="Chat with active customers" />
          <QuickLink to="/invoices" icon={Receipt} title="Invoices" hint="View invoices for your jobs" />
          <QuickLink to="/earnings" icon={Wallet} title="Earnings & payouts" hint="Detailed earnings history" />
          <QuickLink to="/p/$id" params={{ id: "" }} icon={UserIcon} title="Public profile" hint="See how customers find you" disabled />
        </ul>
      </Panel>
    </div>
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
  icon: Icon, title, hint,
}: { icon: ComponentType<{ className?: string }>; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>
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

function ApprovalNotice() {
  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-foreground">
      Your provider account isn't approved yet. You can edit selections, but they'll only save once approved.
    </div>
  );
}

function QuickLink({
  to, icon: Icon, title, hint, disabled,
}: {
  to: "/messages" | "/invoices" | "/earnings" | "/p/$id";
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  disabled?: boolean;
  params?: { id: string };
}) {
  const inner = (
    <li className={cn(
      "flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-colors",
      !disabled && "hover:border-primary/40 hover:bg-muted/40",
      disabled && "opacity-60",
    )}>
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </li>
  );
  if (disabled || to === "/p/$id") return inner;
  return <Link to={to}>{inner}</Link>;
}

function StatusBanner({ status }: { status: ProviderStatus }) {
  if (status === "pending") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Application under review</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Our team is reviewing your provider profile. You'll start receiving leads as soon as you're approved (usually within 1–2 business days).</p>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <h3 className="text-sm font-semibold text-destructive">Application not approved</h3>
          <p className="mt-0.5 text-sm text-destructive/80">Reach out to support if you'd like another review or to update your application.</p>
        </div>
      </div>
    );
  }
  if (status === "not_applicable") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">No provider application yet</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Submit a provider application to start receiving leads on Shebabd.</p>
          <Button asChild size="sm" className="mt-3"><Link to="/become-provider"><Plus className="mr-1.5 h-4 w-4" /> Apply now</Link></Button>
        </div>
      </div>
    );
  }
  return null;
}

function ProviderStatusBadge({ status }: { status: ProviderStatus }) {
  const map: Record<ProviderStatus, { label: string; cls: string; Icon: ComponentType<{ className?: string }> }> = {
    not_applicable: { label: "Not applied",    cls: "bg-muted text-muted-foreground",   Icon: AlertCircle },
    pending:        { label: "Pending review", cls: "bg-primary/15 text-primary",       Icon: Clock },
    approved:       { label: "Approved",       cls: "bg-success/15 text-success",       Icon: CheckCircle2 },
    rejected:       { label: "Rejected",       cls: "bg-destructive/15 text-destructive", Icon: XCircle },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", cls)}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
