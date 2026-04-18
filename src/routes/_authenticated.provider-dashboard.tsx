import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Phone,
  TrendingUp,
  XCircle,
  AlertCircle,
  Sparkles,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
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

export const Route = createFileRoute("/_authenticated/provider-dashboard")({
  component: ProviderDashboard,
  head: () => ({
    meta: [
      { title: "Provider dashboard · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

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

const BUDGET_MIDPOINT: Record<string, number> = {
  "under-1000": 800,
  "1000-3000": 2000,
  "3000-5000": 4000,
  "5000-10000": 7500,
  "10000-20000": 15000,
  "20000+": 25000,
};

function ProviderDashboard() {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isProvider = roles.includes("provider");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [openLeads, setOpenLeads] = useState<LeadRow[]>([]);
  const [myJobs, setMyJobs] = useState<LeadRow[]>([]);
  const [coverage, setCoverage] = useState<{ categories: number; areas: number }>({
    categories: 0,
    areas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    const t = setTimeout(() => {
      if (!isProvider) navigate({ to: "/dashboard" });
    }, 600);
    return () => clearTimeout(t);
  }, [authLoading, user, isProvider, navigate]);

  const refresh = useCallback(async () => {
    if (!user || !isProvider) return;
    const [
      { data: prof },
      { data: openData },
      { data: minedData },
      { count: catCount },
      { count: areaCount },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, area, provider_status")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("bookings")
        .select(
          "id, full_name, phone, category, service, area, preferred_date, preferred_time_slot, budget_range, notes, status, created_at, provider_id",
        )
        .is("provider_id", null)
        .eq("status", "new")
        .order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select(
          "id, full_name, phone, category, service, area, preferred_date, preferred_time_slot, budget_range, notes, status, created_at, provider_id",
        )
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("provider_categories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("provider_areas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    setProfile((prof as Profile | null) ?? null);
    setOpenLeads((openData ?? []) as LeadRow[]);
    setMyJobs((minedData ?? []) as LeadRow[]);
    setCoverage({ categories: catCount ?? 0, areas: areaCount ?? 0 });
    setLoading(false);
  }, [user, isProvider]);

  useEffect(() => {
    if (!user || !isProvider) return;
    setLoading(true);
    refresh();
  }, [user, isProvider, refresh]);

  async function acceptLead(id: string) {
    setAcceptingId(id);
    const prevOpen = openLeads;
    // Optimistic: remove from open list
    setOpenLeads((ls) => ls.filter((l) => l.id !== id));
    const { error } = await supabase.rpc("accept_lead", { _booking_id: id });
    setAcceptingId(null);
    if (error) {
      setOpenLeads(prevOpen);
      toast.error("Could not accept lead", { description: error.message });
      return;
    }
    toast.success("Lead accepted — it's now in your jobs.");
    await refresh();
  }

  const stats = useMemo(() => {
    const completed = myJobs.filter((l) => l.status === "completed");
    const earnings = completed.reduce((sum, l) => {
      return sum + (l.budget_range ? (BUDGET_MIDPOINT[l.budget_range] ?? 0) : 0);
    }, 0);
    return {
      open: openLeads.length,
      assigned: myJobs.filter((l) => l.status === "assigned").length,
      completed: completed.length,
      earnings,
    };
  }, [openLeads, myJobs]);

  if (authLoading || (user && !isProvider)) {
    return (
      <SiteShell>
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteShell>
    );
  }

  const status = profile?.provider_status ?? "pending";
  const isApproved = status === "approved";
  const noCoverage = isApproved && (coverage.categories === 0 || coverage.areas === 0);

  return (
    <SiteShell>
      <section className="container-page py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Provider dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {profile?.full_name?.split(" ")[0] ?? "Welcome"}'s workspace
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Accept new leads in your service area and track your jobs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProviderStatusBadge status={status} />
            {isApproved && (
              <Button asChild variant="outline" size="sm">
                <Link to="/coverage">
                  <Settings2 className="mr-1 h-3.5 w-3.5" /> Coverage
                </Link>
              </Button>
            )}
          </div>
        </div>

        {!isApproved && <StatusBanner status={status} />}
        {noCoverage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Set up your coverage</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pick the categories and Dhaka areas you cover so we can match leads to you.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/coverage">Configure coverage</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Briefcase className="h-4 w-4" />}
            label="Open leads"
            value={stats.open.toString()}
            accent="text-primary"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Active jobs"
            value={stats.assigned.toString()}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Completed"
            value={stats.completed.toString()}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Estimated earnings"
            value={`৳ ${stats.earnings.toLocaleString()}`}
          />
        </div>

        {/* Open leads */}
        <div className="mt-10 rounded-3xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Open leads</h2>
              <p className="text-xs text-muted-foreground">
                First provider to accept gets the job.
              </p>
            </div>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : openLeads.length === 0 ? (
            <EmptyState
              title="No open leads right now"
              body={
                isApproved
                  ? noCoverage
                    ? "Set your coverage to start receiving matched leads."
                    : "We'll show new jobs in your categories and areas as soon as they come in."
                  : "Once your provider application is approved, matching leads will appear here."
              }
            />
          ) : (
            <LeadsList
              leads={openLeads}
              renderAction={(l) => (
                <Button
                  size="sm"
                  onClick={() => acceptLead(l.id)}
                  disabled={acceptingId === l.id}
                >
                  {acceptingId === l.id && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  Accept lead
                </Button>
              )}
            />
          )}
        </div>

        {/* My jobs */}
        <div className="mt-10 rounded-3xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">My jobs</h2>
              <p className="text-xs text-muted-foreground">
                Bookings assigned to you.
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : myJobs.length === 0 ? (
            <EmptyState
              title="No jobs yet"
              body="Accepted leads will show up here with the customer's contact details."
            />
          ) : (
            <LeadsList leads={myJobs} showStatus />
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function LeadsList({
  leads,
  showStatus,
  renderAction,
}: {
  leads: LeadRow[];
  showStatus?: boolean;
  renderAction?: (l: LeadRow) => React.ReactNode;
}) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Budget</TableHead>
              {showStatus && <TableHead>Status</TableHead>}
              {renderAction && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="font-medium text-foreground">{l.full_name}</div>
                  <div className="text-xs text-muted-foreground">{l.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{l.service ?? l.category}</div>
                  <div className="text-xs capitalize text-muted-foreground">{l.category}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(l.preferred_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{l.preferred_time_slot}</div>
                </TableCell>
                <TableCell className="text-sm capitalize">{l.area}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {l.budget_range ?? "—"}
                </TableCell>
                {showStatus && (
                  <TableCell>
                    <BookingBadge status={l.status} />
                  </TableCell>
                )}
                {renderAction && <TableCell className="text-right">{renderAction(l)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="divide-y divide-border md:hidden">
        {leads.map((l) => (
          <li key={l.id} className="px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{l.full_name}</div>
                <div className="text-xs text-muted-foreground">{l.service ?? l.category}</div>
              </div>
              {showStatus && <BookingBadge status={l.status} />}
            </div>
            <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(l.preferred_date).toLocaleDateString()} · {l.preferred_time_slot}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> <span className="capitalize">{l.area}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {l.phone}
              </div>
              {l.budget_range && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Budget: {l.budget_range}
                </div>
              )}
            </div>
            {renderAction && <div className="mt-3">{renderAction(l)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

function StatusBanner({ status }: { status: ProviderStatus }) {
  if (status === "pending") {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Application under review
          </h3>
          <p className="mt-0.5 text-sm text-amber-900/80 dark:text-amber-200/80">
            Our team is reviewing your provider profile. You'll start receiving leads as soon
            as you're approved (usually within 1–2 business days).
          </p>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <h3 className="text-sm font-semibold text-destructive">Application not approved</h3>
          <p className="mt-0.5 text-sm text-destructive/80">
            Reach out to support if you'd like another review or to update your application.
          </p>
        </div>
      </div>
    );
  }
  if (status === "not_applicable") {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">No provider application yet</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Submit a provider application to start receiving leads on Shebabd.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/become-provider">Apply now</Link>
          </Button>
        </div>
      </div>
    );
  }
  return null;
}

function ProviderStatusBadge({ status }: { status: ProviderStatus }) {
  const map: Record<ProviderStatus, { label: string; cls: string; Icon: typeof Clock }> = {
    not_applicable: { label: "Not applied", cls: "bg-muted text-muted-foreground", Icon: AlertCircle },
    pending: { label: "Pending review", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300", Icon: Clock },
    approved: { label: "Approved", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", Icon: CheckCircle2 },
    rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive", Icon: XCircle },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

const BOOKING_STYLES: Record<BookingStatus, string> = {
  new: "bg-muted text-foreground",
  confirmed: "bg-primary/15 text-primary",
  assigned: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-destructive/15 text-destructive",
};

function BookingBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${BOOKING_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Briefcase className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
