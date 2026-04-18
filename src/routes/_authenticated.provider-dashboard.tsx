import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until auth is resolved AND roles have been fetched (roles array
    // is populated asynchronously after the session loads). Only redirect
    // once we're certain the user lacks the provider role.
    if (authLoading || !user) return;
    // Give roles one tick to populate; if still empty after profile loads, trust it.
    const t = setTimeout(() => {
      if (!isProvider) navigate({ to: "/dashboard" });
    }, 600);
    return () => clearTimeout(t);
  }, [authLoading, user, isProvider, navigate]);

  useEffect(() => {
    if (!user || !isProvider) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: bookingData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, area, provider_status")
          .eq("id", user.id)
          .maybeSingle(),
        // Providers see open leads in their service area; admins approve before
        // status changes. RLS lets users only see their own bookings, so for
        // now we show bookings explicitly assigned to this provider via user_id.
        // (Future: add provider_id column + lead-distribution policy.)
        supabase
          .from("bookings")
          .select(
            "id, full_name, phone, category, service, area, preferred_date, preferred_time_slot, budget_range, notes, status, created_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setProfile((prof as Profile | null) ?? null);
      setLeads((bookingData ?? []) as LeadRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isProvider]);

  const stats = useMemo(() => {
    const open = leads.filter((l) => ["new", "confirmed", "assigned"].includes(l.status)).length;
    const completed = leads.filter((l) => l.status === "completed");
    const earnings = completed.reduce((sum, l) => {
      return sum + (l.budget_range ? (BUDGET_MIDPOINT[l.budget_range] ?? 0) : 0);
    }, 0);
    return { open, completed: completed.length, earnings };
  }, [leads]);

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
      <section className="container-page py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Provider dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {profile?.full_name?.split(" ")[0] ?? "Welcome"}'s workspace
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your status, leads and earnings.
            </p>
          </div>
          <ProviderStatusBadge status={profile?.provider_status ?? "pending"} />
        </div>

        {profile?.provider_status !== "approved" && (
          <StatusBanner status={profile?.provider_status ?? "pending"} />
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Briefcase className="h-4 w-4" />}
            label="Open leads"
            value={stats.open.toString()}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Jobs completed"
            value={stats.completed.toString()}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Estimated earnings"
            value={`৳ ${stats.earnings.toLocaleString()}`}
            accent="text-primary"
          />
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Recent leads</h2>
              <p className="text-xs text-muted-foreground">
                Jobs assigned to you appear here.
              </p>
            </div>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <EmptyLeads approved={profile?.provider_status === "approved"} />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
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
                          <div className="text-xs capitalize text-muted-foreground">
                            {l.category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(l.preferred_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {l.preferred_time_slot}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{l.area}</TableCell>
                        <TableCell>
                          <BookingBadge status={l.status} />
                        </TableCell>
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
                        <div className="text-xs text-muted-foreground">
                          {l.service ?? l.category}
                        </div>
                      </div>
                      <BookingBadge status={l.status} />
                    </div>
                    <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(l.preferred_date).toLocaleDateString()} ·{" "}
                        {l.preferred_time_slot}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {l.area}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> {l.phone}
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
      <div className={`mt-2 text-3xl font-bold ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

function EmptyLeads({ approved }: { approved: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Briefcase className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No leads yet</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {approved
          ? "New jobs in your service area will show up here."
          : "Once your provider application is approved, leads will appear here."}
      </p>
    </div>
  );
}
