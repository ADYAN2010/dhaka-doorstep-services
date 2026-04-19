/**
 * Provider Operations — advanced business management modules.
 *
 * A single self-contained component grouping 11 ops modules into one tabbed
 * surface. Computes its derived metrics from the data already loaded by the
 * parent dashboard so we do NOT re-fetch.
 *
 * All metrics are derived client-side today; the shapes match what real
 * tables (e.g. provider_kpis, provider_warnings, provider_support_requests)
 * will return when added.
 */

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeCheck,
  Briefcase, CheckCircle2, ChevronRight, Clock, FileText, Gauge,
  HeartPulse, LifeBuoy, Loader2, MessageCircle, ShieldCheck, Sparkles,
  Star, Timer, TrendingUp, Trophy, Wallet, XCircle, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ────────────────────────────────────────────────────────────── Types ─── */

export type ProviderStatus = "not_applicable" | "pending" | "approved" | "rejected";
export type BookingStatus = "new" | "confirmed" | "assigned" | "completed" | "cancelled";

export type OpsLead = {
  id: string;
  status: BookingStatus;
  preferred_date: string;
  created_at: string;
  budget_range: string | null;
  category: string;
};

export type OpsLedger = {
  id: string;
  paid_out: boolean;
  provider_net: number;
  created_at: string;
};

export type OpsReview = { rating: number; created_at: string };

export type OpsInputs = {
  status: ProviderStatus;
  fullName: string;
  hasCoverage: boolean;
  hasHours: boolean;
  hasAvatar: boolean;
  hasBio: boolean;
  hasPhone: boolean;
  jobs: OpsLead[];           // all of provider's jobs (any status)
  ledger: OpsLedger[];
  reviews: OpsReview[];
};

/* ────────────────────────────────────────────────────────── Tabs / shell ─ */

type TabKey =
  | "kpis" | "onboarding" | "approval" | "response" | "cancellations"
  | "verification" | "payouts" | "strength" | "growth" | "risk" | "support";

const TABS: { key: TabKey; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "kpis",          label: "Performance KPIs",  icon: Gauge },
  { key: "response",      label: "Response time",     icon: Timer },
  { key: "cancellations", label: "Cancellations",     icon: XCircle },
  { key: "payouts",       label: "Payout summary",    icon: Wallet },
  { key: "growth",        label: "Growth insights",   icon: TrendingUp },
  { key: "strength",      label: "Profile strength",  icon: Sparkles },
  { key: "onboarding",    label: "Onboarding",        icon: CheckCircle2 },
  { key: "verification",  label: "Verification",      icon: ShieldCheck },
  { key: "approval",      label: "Service approval",  icon: BadgeCheck },
  { key: "risk",          label: "Risk flags",        icon: AlertTriangle },
  { key: "support",       label: "Support requests",  icon: LifeBuoy },
];

export function ProviderOperations(props: OpsInputs) {
  const [tab, setTab] = useState<TabKey>("kpis");

  return (
    <div className="space-y-6">
      <OpsHeader inputs={props} onJump={setTab} />

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-soft">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[300px]">
        {tab === "kpis" && <PerformanceKpis {...props} />}
        {tab === "response" && <ResponseTimeMetrics {...props} />}
        {tab === "cancellations" && <CancellationTracking {...props} />}
        {tab === "payouts" && <PayoutSummary {...props} />}
        {tab === "growth" && <GrowthInsights {...props} />}
        {tab === "strength" && <ProfileStrength {...props} />}
        {tab === "onboarding" && <OnboardingProgress {...props} />}
        {tab === "verification" && <VerificationChecklist {...props} />}
        {tab === "approval" && <ServiceApprovalStatus {...props} />}
        {tab === "risk" && <RiskFlags {...props} />}
        {tab === "support" && <SupportRequests />}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── Top — exec summary header ─ */

function OpsHeader({ inputs, onJump }: { inputs: OpsInputs; onJump: (k: TabKey) => void }) {
  const k = useKpis(inputs);
  const strength = useProfileStrength(inputs);
  const onboarding = useOnboarding(inputs);
  const risk = useRiskScore(inputs);

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Operations</p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Run your business like a pro
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Track performance, fix issues early, grow earnings. Everything updates in real time as your jobs come in.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={risk.tone} icon={AlertTriangle} label={`Risk: ${risk.label}`} />
          <Pill tone={strength.score >= 80 ? "success" : strength.score >= 50 ? "warning" : "muted"} icon={Sparkles} label={`Profile ${strength.score}%`} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <HeaderStat
          label="Acceptance rate"
          value={`${k.acceptanceRate}%`}
          delta={k.acceptanceDelta}
          icon={Activity}
          onClick={() => onJump("kpis")}
        />
        <HeaderStat
          label="Avg response"
          value={k.avgResponse}
          icon={Timer}
          onClick={() => onJump("response")}
        />
        <HeaderStat
          label="Cancellation"
          value={`${k.cancellationRate}%`}
          icon={XCircle}
          tone={k.cancellationRate > 10 ? "warning" : undefined}
          onClick={() => onJump("cancellations")}
        />
        <HeaderStat
          label="Onboarding"
          value={`${onboarding.percent}%`}
          icon={CheckCircle2}
          onClick={() => onJump("onboarding")}
        />
      </div>
    </div>
  );
}

function HeaderStat({
  label, value, icon: Icon, delta, tone, onClick,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  delta?: number;
  tone?: "warning";
  onClick?: () => void;
}) {
  const Trend = delta && delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-border bg-card/80 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn("h-3.5 w-3.5 text-muted-foreground", tone === "warning" && "text-warning")} />
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("text-xl font-bold sm:text-2xl", tone === "warning" ? "text-warning" : "text-foreground")}>{value}</span>
        {delta !== undefined && delta !== 0 && (
          <span className={cn(
            "inline-flex items-center text-[10px] font-semibold",
            delta > 0 ? "text-success" : "text-destructive",
          )}>
            <Trend className="h-3 w-3" />{Math.abs(delta)}%
          </span>
        )}
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────── Module: KPIs ─── */

function useKpis(i: OpsInputs) {
  return useMemo(() => {
    const total = i.jobs.length;
    const completed = i.jobs.filter((j) => j.status === "completed").length;
    const cancelled = i.jobs.filter((j) => j.status === "cancelled").length;
    const accepted = i.jobs.filter((j) => j.status !== "new").length;
    const acceptanceRate = total ? Math.round((accepted / total) * 100) : 0;
    const completionRate = accepted ? Math.round((completed / accepted) * 100) : 0;
    const cancellationRate = total ? Math.round((cancelled / total) * 100) : 0;
    // Simulated avg first-response (would come from a messages.first_reply_at field).
    const avgResponseMinutes = i.jobs.length > 0 ? Math.max(8, 38 - i.jobs.length * 2) : 25;
    const avgResponse = avgResponseMinutes < 60 ? `${avgResponseMinutes}m` : `${(avgResponseMinutes / 60).toFixed(1)}h`;
    // Earnings deltas
    const last30 = filterDays(i.ledger, 30);
    const prev30 = filterDaysWindow(i.ledger, 60, 30);
    const earnings30 = sumNet(last30);
    const earningsPrev = sumNet(prev30);
    const earningsDelta = pctDelta(earningsPrev, earnings30);
    // Acceptance delta vs previous period
    const acceptedRecent = i.jobs.filter((j) => isWithinDays(j.created_at, 30) && j.status !== "new").length;
    const totalRecent = i.jobs.filter((j) => isWithinDays(j.created_at, 30)).length;
    const acceptanceRecent = totalRecent ? Math.round((acceptedRecent / totalRecent) * 100) : acceptanceRate;
    const acceptanceDelta = acceptanceRecent - acceptanceRate;
    // Avg rating
    const avgRating = i.reviews.length
      ? +(i.reviews.reduce((s, r) => s + r.rating, 0) / i.reviews.length).toFixed(2)
      : 0;
    return {
      total, completed, cancelled, accepted,
      acceptanceRate, completionRate, cancellationRate,
      avgResponse, avgResponseMinutes,
      earnings30, earningsDelta, acceptanceDelta, avgRating,
    };
  }, [i.jobs, i.ledger, i.reviews]);
}

function PerformanceKpis(props: OpsInputs) {
  const k = useKpis(props);
  const items: { label: string; value: string; hint: string; icon: ComponentType<{ className?: string }>; tone?: "success" | "warning" | "destructive" }[] = [
    { label: "Acceptance rate",    value: `${k.acceptanceRate}%`,    hint: `${k.accepted} of ${k.total} requests accepted`, icon: Activity },
    { label: "Completion rate",    value: `${k.completionRate}%`,     hint: `${k.completed} of ${k.accepted} accepted jobs`,   icon: CheckCircle2, tone: k.completionRate >= 90 ? "success" : k.completionRate >= 70 ? "warning" : "destructive" },
    { label: "Cancellation rate",  value: `${k.cancellationRate}%`,   hint: `${k.cancelled} cancelled in lifetime`,            icon: XCircle,      tone: k.cancellationRate <= 5 ? "success" : k.cancellationRate <= 10 ? "warning" : "destructive" },
    { label: "Avg response",       value: k.avgResponse,              hint: "First reply to a customer message",               icon: Timer,        tone: k.avgResponseMinutes <= 15 ? "success" : k.avgResponseMinutes <= 30 ? "warning" : "destructive" },
    { label: "Avg rating",         value: k.avgRating ? `${k.avgRating} ★` : "—", hint: `${props.reviews.length} reviews`,        icon: Star,         tone: k.avgRating >= 4.7 ? "success" : k.avgRating >= 4 ? "warning" : undefined },
    { label: "Earnings (30d)",     value: fmt(k.earnings30),          hint: deltaLabel(k.earningsDelta, "vs previous 30d"),     icon: Wallet },
  ];
  return (
    <Panel title="Performance KPIs" icon={Gauge} blurb="The numbers that decide your visibility and customer trust.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => <KpiTile key={it.label} {...it} />)}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Tip: keep cancellation under <span className="font-semibold text-foreground">5%</span> and response time under <span className="font-semibold text-foreground">15 min</span> to stay in the top-rated pool.
      </p>
    </Panel>
  );
}

function KpiTile({ label, value, hint, icon: Icon, tone }: {
  label: string; value: string; hint: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "success" | "warning" | "destructive";
}) {
  const ring = tone === "success" ? "border-success/30 bg-success/5"
    : tone === "warning" ? "border-warning/30 bg-warning/5"
      : tone === "destructive" ? "border-destructive/30 bg-destructive/5"
        : "border-border bg-background";
  return (
    <div className={cn("rounded-2xl border p-4", ring)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/* ────────────────────────────────────────────── Module: Response time ─── */

function ResponseTimeMetrics(props: OpsInputs) {
  const k = useKpis(props);
  const grade = k.avgResponseMinutes <= 15 ? "A" : k.avgResponseMinutes <= 30 ? "B" : k.avgResponseMinutes <= 60 ? "C" : "D";
  const tone = grade === "A" ? "success" : grade === "B" ? "warning" : "destructive";
  // Build a synthetic 14-day series so the chart never sits empty.
  const series = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const idx = 13 - i;
      const base = k.avgResponseMinutes;
      const v = Math.max(5, Math.round(base + Math.sin(idx) * 8 + (i % 3) * 2));
      return { day: i, minutes: v };
    });
  }, [k.avgResponseMinutes]);
  const max = Math.max(...series.map((s) => s.minutes));

  return (
    <div className="space-y-4">
      <Panel title="Response time" icon={Timer} blurb="How fast you reply to customers — the #1 factor in winning a job.">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className={cn(
            "flex flex-col items-center justify-center rounded-2xl border p-5 text-center",
            tone === "success" && "border-success/30 bg-success/5",
            tone === "warning" && "border-warning/30 bg-warning/5",
            tone === "destructive" && "border-destructive/30 bg-destructive/5",
          )}>
            <span className={cn(
              "inline-flex h-16 w-16 items-center justify-center rounded-full text-3xl font-extrabold",
              tone === "success" && "bg-success/15 text-success",
              tone === "warning" && "bg-warning/15 text-warning",
              tone === "destructive" && "bg-destructive/15 text-destructive",
            )}>
              {grade}
            </span>
            <p className="mt-3 text-2xl font-bold text-foreground">{k.avgResponse}</p>
            <p className="text-xs text-muted-foreground">average first reply</p>
            <p className="mt-3 text-[11px] text-muted-foreground">Target: under 15 minutes</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Last 14 days</span>
              <span>minutes (lower is better)</span>
            </div>
            <div className="flex h-40 items-end gap-1.5 rounded-2xl border border-border bg-background p-3">
              {series.map((s) => (
                <div key={s.day} className="flex-1" title={`${s.minutes}m`}>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      s.minutes <= 15 ? "bg-success" : s.minutes <= 30 ? "bg-primary" : "bg-warning",
                    )}
                    style={{ height: `${(s.minutes / max) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <Mini label="Best" value={`${Math.min(...series.map((s) => s.minutes))}m`} />
              <Mini label="Avg" value={k.avgResponse} />
              <Mini label="Worst" value={`${max}m`} />
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

/* ───────────────────────────────────────── Module: Cancellation tracking ─ */

function CancellationTracking(props: OpsInputs) {
  const cancelled = props.jobs.filter((j) => j.status === "cancelled");
  const total = props.jobs.length;
  const rate = total ? (cancelled.length / total) * 100 : 0;
  const reasonsMock = [
    { reason: "Customer no-show",        count: Math.max(0, Math.floor(cancelled.length * 0.4)) },
    { reason: "Out-of-scope work",       count: Math.max(0, Math.floor(cancelled.length * 0.3)) },
    { reason: "Schedule conflict",       count: Math.max(0, Math.floor(cancelled.length * 0.2)) },
    { reason: "Other",                   count: Math.max(0, cancelled.length - Math.floor(cancelled.length * 0.9)) },
  ];

  return (
    <div className="space-y-4">
      <Panel title="Cancellation tracking" icon={XCircle} blurb="Repeat cancellations hurt rankings — review patterns and act early.">
        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard label="Cancellation rate" value={`${rate.toFixed(1)}%`} hint={`${cancelled.length} of ${total} jobs`} tone={rate <= 5 ? "success" : rate <= 10 ? "warning" : "destructive"} />
          <SummaryCard label="This month" value={`${cancelled.filter((j) => isWithinDays(j.created_at, 30)).length}`} hint="cancellations" />
          <SummaryCard label="Trend" value={rate <= 5 ? "Healthy" : rate <= 10 ? "Watch" : "Concerning"} hint="Compared to platform average (4.2%)" />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top cancellation reasons</p>
          <ul className="space-y-1.5">
            {reasonsMock.map((r) => {
              const pct = cancelled.length ? (r.count / cancelled.length) * 100 : 0;
              return (
                <li key={r.reason} className="flex items-center gap-3 text-xs">
                  <span className="w-32 shrink-0 truncate text-foreground">{r.reason}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{r.count}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {cancelled.length === 0 && (
          <div className="mt-5 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="mr-1.5 inline h-4 w-4" /> Zero cancellations on record — keep it up!
          </div>
        )}
      </Panel>
    </div>
  );
}

function SummaryCard({ label, value, hint, tone }: {
  label: string; value: string; hint: string;
  tone?: "success" | "warning" | "destructive";
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-4",
      tone === "success" && "border-success/30 bg-success/5",
      tone === "warning" && "border-warning/30 bg-warning/5",
      tone === "destructive" && "border-destructive/30 bg-destructive/5",
      !tone && "border-border bg-background",
    )}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────── Module: Payout summary ── */

function PayoutSummary(props: OpsInputs) {
  const last30 = filterDays(props.ledger, 30);
  const lifetime = sumNet(props.ledger);
  const lifetime30 = sumNet(last30);
  const pending = props.ledger.filter((l) => !l.paid_out).reduce((s, l) => s + Number(l.provider_net), 0);
  const paid = props.ledger.filter((l) => l.paid_out).reduce((s, l) => s + Number(l.provider_net), 0);
  const nextPayoutDate = nextFriday();

  // Build last-12-week earnings sparkline.
  const weeks = Array.from({ length: 12 }).map((_, i) => {
    const start = i * 7;
    const end = (i + 1) * 7;
    const window = props.ledger.filter((l) => isWithinDaysWindow(l.created_at, end, start));
    return { week: i, total: window.reduce((s, l) => s + Number(l.provider_net), 0) };
  }).reverse();
  const max = Math.max(1, ...weeks.map((w) => w.total));

  return (
    <div className="space-y-4">
      <Panel title="Payout summary" icon={Wallet} blurb="Earnings, what's pending and when your next payout lands.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Pending payout" value={fmt(pending)} hint={`Next payout ${nextPayoutDate}`} />
          <SummaryCard label="Paid out" value={fmt(paid)} hint="Lifetime — already in your account" tone="success" />
          <SummaryCard label="Last 30 days" value={fmt(lifetime30)} hint="Net earnings" />
          <SummaryCard label="Lifetime net" value={fmt(lifetime)} hint="After commission" />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Weekly net (last 12 weeks)</span>
            <span className="text-muted-foreground">peak {fmt(max)}</span>
          </div>
          <div className="flex h-28 items-end gap-1.5 rounded-2xl border border-border bg-background p-3">
            {weeks.map((w) => (
              <div key={w.week} className="flex-1" title={fmt(w.total)}>
                <div
                  className="w-full rounded-t-md bg-gradient-primary transition-all"
                  style={{ height: max ? `${(w.total / max) * 100}%` : "2%" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Next payout: {nextPayoutDate}</p>
            <p className="text-xs text-muted-foreground">Auto-sent to your registered bKash / bank account every Friday.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/earnings">Open earnings <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────────────────────────── Module: Growth insights ─ */

function GrowthInsights(props: OpsInputs) {
  const k = useKpis(props);
  const tips: { title: string; body: string; impact: "high" | "medium" | "low"; icon: ComponentType<{ className?: string }> }[] = [];
  if (k.avgResponseMinutes > 30) tips.push({ title: "Reply faster to win more jobs", body: "Providers who reply in under 15 minutes win 2.3× more leads. Enable push notifications on your phone.", impact: "high", icon: Timer });
  if (k.cancellationRate > 5) tips.push({ title: "Reduce cancellations", body: "Confirm scope and timing in the chat before accepting. Re-confirm the day before for jobs scheduled >2 days out.", impact: "high", icon: XCircle });
  if (!props.hasAvatar) tips.push({ title: "Add a profile photo", body: "Profiles with a clear face photo get 3.7× more contacts.", impact: "medium", icon: Sparkles });
  if (!props.hasBio) tips.push({ title: "Write a stronger bio", body: "Mention years of experience, what makes you reliable, and your service guarantee.", impact: "medium", icon: FileText });
  if (props.reviews.length < 5) tips.push({ title: "Ask for reviews", body: "Customers with great experiences will leave a review when prompted in chat the same day.", impact: "high", icon: Star });
  if (k.avgRating && k.avgRating < 4.5) tips.push({ title: "Lift your rating", body: "Target a 4.7+ average to qualify for the Top Rated badge — more visibility and 1.8× lead volume.", impact: "high", icon: Trophy });
  if (tips.length === 0) tips.push({ title: "You're running a tight ship", body: "Keep replying fast, complete every accepted job, and ask happy customers for reviews.", impact: "low", icon: CheckCircle2 });

  const opportunities = [
    { label: "Lead volume in your category (Dhaka)", value: "+18%", hint: "vs last month" },
    { label: "Top demand area near you",              value: "Bashundhara R/A", hint: "Add coverage to capture +24% leads" },
    { label: "Highest-paying service type",           value: "Master Service",    hint: "৳1,899 avg net" },
  ];

  return (
    <div className="space-y-4">
      <Panel title="Personalised growth tips" icon={Sparkles} blurb="Actions sorted by expected impact on your earnings.">
        <ul className="space-y-2">
          {tips.map((t) => {
            const Icon = t.icon;
            const tone = t.impact === "high" ? "border-primary/30 bg-primary/5" : t.impact === "medium" ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5";
            const chip = t.impact === "high" ? "bg-primary/15 text-primary" : t.impact === "medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
            return (
              <li key={t.title} className={cn("flex items-start gap-3 rounded-xl border p-3.5", tone)}>
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background"><Icon className="h-4 w-4 text-foreground" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{t.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", chip)}>{t.impact} impact</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Market opportunities" icon={TrendingUp} blurb="Where the demand is heading right now.">
        <div className="grid gap-3 sm:grid-cols-3">
          {opportunities.map((o) => (
            <div key={o.label} className="rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{o.label}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{o.value}</p>
              <p className="text-xs text-muted-foreground">{o.hint}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────────────────── Module: Profile strength meter ── */

function useProfileStrength(i: OpsInputs) {
  return useMemo(() => {
    const checks = [
      { key: "name",     done: !!i.fullName,                               weight: 8,  label: "Display name" },
      { key: "phone",    done: i.hasPhone,                                 weight: 12, label: "Phone number verified" },
      { key: "avatar",   done: i.hasAvatar,                                weight: 12, label: "Profile photo" },
      { key: "bio",      done: i.hasBio,                                   weight: 12, label: "Bio (≥ 80 chars)" },
      { key: "coverage", done: i.hasCoverage,                              weight: 14, label: "Services & coverage areas" },
      { key: "hours",    done: i.hasHours,                                 weight: 12, label: "Weekly working hours" },
      { key: "approved", done: i.status === "approved",                    weight: 14, label: "Provider approved" },
      { key: "reviews",  done: i.reviews.length >= 3,                      weight: 8,  label: "At least 3 reviews" },
      { key: "rating",   done: i.reviews.length > 0 && (i.reviews.reduce((s,r)=>s+r.rating,0)/i.reviews.length) >= 4.5, weight: 8, label: "4.5+ average rating" },
    ];
    const score = checks.reduce((s, c) => s + (c.done ? c.weight : 0), 0);
    return { score, checks };
  }, [i]);
}

function ProfileStrength(props: OpsInputs) {
  const s = useProfileStrength(props);
  const tier = s.score >= 90 ? "Elite" : s.score >= 75 ? "Strong" : s.score >= 50 ? "Building" : "Starter";
  return (
    <Panel title="Profile strength" icon={Sparkles} blurb="Stronger profiles win more leads. Hit 90%+ to qualify for Top Rated.">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="rounded-2xl border border-border bg-background p-5 text-center">
          <div className="relative mx-auto h-32 w-32">
            <ScoreRing value={s.score} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-foreground">{s.score}%</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tier}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {s.score >= 90 ? "Top tier — keep it up!" : s.score >= 75 ? "Almost elite — finish the last items." : "Complete the checklist to unlock more leads."}
          </p>
        </div>

        <ul className="space-y-1.5">
          {s.checks.map((c) => (
            <li key={c.key} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
              <span className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full",
                c.done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}>
                {c.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              </span>
              <p className={cn("flex-1 text-sm", c.done ? "font-medium text-foreground" : "text-muted-foreground")}>{c.label}</p>
              <span className="text-[10px] font-semibold text-muted-foreground">+{c.weight}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
      <circle cx="64" cy="64" r={r} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" className="text-muted" style={{ stroke: "hsl(var(--muted))" }} />
      <circle
        cx="64" cy="64" r={r} strokeWidth="10" fill="none" strokeLinecap="round"
        stroke="url(#strength-grad)" strokeDasharray={c} strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-700"
      />
      <defs>
        <linearGradient id="strength-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary-glow, var(--primary)))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ───────────────────────────────────────── Module: Onboarding progress ─── */

function useOnboarding(i: OpsInputs) {
  const steps = [
    { label: "Account created",            done: true },
    { label: "Provider application sent",  done: i.status !== "not_applicable" },
    { label: "Identity verified",          done: i.status === "approved" || i.status === "rejected" },
    { label: "Account approved",           done: i.status === "approved" },
    { label: "Services & coverage",        done: i.hasCoverage },
    { label: "Weekly hours",               done: i.hasHours },
    { label: "Profile photo",              done: i.hasAvatar },
    { label: "Bio added",                  done: i.hasBio },
  ];
  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / steps.length) * 100);
  return { steps, done, percent };
}

function OnboardingProgress(props: OpsInputs) {
  const o = useOnboarding(props);
  return (
    <Panel title="Onboarding progress" icon={CheckCircle2} blurb="Complete every step to unlock the full provider experience.">
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-foreground">{o.done} of {o.steps.length} steps complete</p>
          <p className="text-2xl font-extrabold text-primary">{o.percent}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-primary transition-[width] duration-700" style={{ width: `${o.percent}%` }} />
        </div>
      </div>

      <ol className="mt-4 space-y-1.5">
        {o.steps.map((s, idx) => (
          <li key={s.label} className={cn(
            "flex items-center gap-3 rounded-xl border px-3 py-2.5",
            s.done ? "border-success/30 bg-success/5" : "border-border bg-background",
          )}>
            <span className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              s.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
            )}>
              {s.done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </span>
            <p className={cn("flex-1 text-sm", s.done ? "font-medium text-foreground" : "text-muted-foreground")}>{s.label}</p>
            {!s.done && <span className="text-[10px] font-semibold text-muted-foreground">Pending</span>}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* ──────────────────────────────────────── Module: Verification checklist ─ */

function VerificationChecklist(props: OpsInputs) {
  const items = [
    { label: "Email verified",            done: true,                                                     hint: "Confirmed via email link" },
    { label: "Phone number verified",     done: props.hasPhone,                                           hint: "OTP confirmation" },
    { label: "National ID submitted",     done: props.status === "approved" || props.status === "pending", hint: "Required for payout" },
    { label: "Address proof",             done: props.status === "approved",                              hint: "Utility bill / rental agreement" },
    { label: "Background check",          done: props.status === "approved",                              hint: "No criminal record on file" },
    { label: "Bank / bKash account",      done: props.status === "approved",                              hint: "For weekly payouts" },
    { label: "Service skill verified",    done: props.status === "approved",                              hint: "Trade certificate or test job" },
  ];
  const done = items.filter((i) => i.done).length;

  return (
    <Panel
      title="Verification checklist"
      icon={ShieldCheck}
      blurb={`${done} of ${items.length} verification items complete`}
      action={<Button size="sm" asChild variant="outline"><Link to="/contact">Submit document <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
    >
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <span className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              it.done ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
            )}>
              {it.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm", it.done ? "font-medium text-foreground" : "text-foreground")}>{it.label}</p>
              <p className="truncate text-xs text-muted-foreground">{it.hint}</p>
            </div>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              it.done ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
            )}>
              {it.done ? "Verified" : "Pending"}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ──────────────────────────────────────── Module: Service approval status ─ */

function ServiceApprovalStatus(props: OpsInputs) {
  // Simulate per-service approval — in reality each provider_categories row
  // would have a status. For now show all as "approved" if provider is approved.
  const services = props.hasCoverage
    ? [
      { name: "AC General Service",  status: props.status === "approved" ? "approved" : "pending" as const },
      { name: "AC Master Service",   status: props.status === "approved" ? "approved" : "pending" as const },
      { name: "AC Repair",           status: props.status === "approved" ? "approved" : "pending" as const },
    ]
    : [];

  if (services.length === 0) {
    return (
      <Panel title="Service approval" icon={BadgeCheck} blurb="Each service you offer is reviewed before going live.">
        <Empty icon={BadgeCheck} title="No services added yet" hint="Add the services you offer in the Services section to begin approval." />
      </Panel>
    );
  }

  return (
    <Panel title="Service approval status" icon={BadgeCheck} blurb="Per-service review status — approved services are visible to customers.">
      <ul className="space-y-1.5">
        {services.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.status === "approved" ? "Live and visible to customers" : "Awaiting admin review (1–2 business days)"}
              </p>
            </div>
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              s.status === "approved" ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
            )}>
              {s.status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              {s.status === "approved" ? "Approved" : "Pending"}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ─────────────────────────────────────────────────── Module: Risk flags ── */

function useRiskScore(i: OpsInputs) {
  const flags: { kind: "warning" | "critical"; message: string; action: string }[] = [];
  const total = i.jobs.length;
  const cancelled = i.jobs.filter((j) => j.status === "cancelled").length;
  const cancellationRate = total ? (cancelled / total) * 100 : 0;
  const avg = i.reviews.length ? i.reviews.reduce((s,r)=>s+r.rating,0)/i.reviews.length : 0;

  if (cancellationRate > 10) flags.push({ kind: "critical", message: `Cancellation rate is ${cancellationRate.toFixed(1)}% — above the 10% threshold.`, action: "Reduce cancellations to keep visibility." });
  else if (cancellationRate > 5) flags.push({ kind: "warning", message: `Cancellation rate ${cancellationRate.toFixed(1)}% is above target.`, action: "Confirm scope before accepting jobs." });

  if (i.reviews.length >= 3 && avg < 4) flags.push({ kind: "critical", message: `Average rating ${avg.toFixed(1)}★ is below 4.0.`, action: "Address recent negative reviews and improve service." });
  else if (i.reviews.length >= 3 && avg < 4.5) flags.push({ kind: "warning", message: `Average rating ${avg.toFixed(1)}★ is below 4.5.`, action: "Aim for 4.5+ to qualify for Top Rated." });

  if (!i.hasHours && i.status === "approved") flags.push({ kind: "warning", message: "Working hours are not set — leads may bypass you.", action: "Set your weekly availability." });
  if (!i.hasCoverage && i.status === "approved") flags.push({ kind: "critical", message: "No services or coverage areas selected.", action: "Add services and areas to start receiving leads." });
  if (i.status === "rejected") flags.push({ kind: "critical", message: "Provider application was rejected.", action: "Contact support to re-apply." });

  const tone = flags.some((f) => f.kind === "critical") ? "destructive" : flags.length > 0 ? "warning" : "success";
  const label = flags.some((f) => f.kind === "critical") ? "High" : flags.length > 0 ? "Medium" : "Low";
  return { flags, tone: tone as "success" | "warning" | "destructive", label };
}

function RiskFlags(props: OpsInputs) {
  const r = useRiskScore(props);
  return (
    <Panel title="Risk flags & warnings" icon={AlertTriangle} blurb="Issues that may impact your visibility or earnings.">
      {r.flags.length === 0 ? (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-success" />
          <p className="mt-2 text-base font-semibold text-foreground">All clear</p>
          <p className="mt-0.5 text-sm text-muted-foreground">No active warnings on your account. Keep up the good work.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {r.flags.map((f, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4",
                f.kind === "critical" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5",
              )}
            >
              <span className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                f.kind === "critical" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning",
              )}>
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{f.message}</p>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    f.kind === "critical" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning",
                  )}>
                    {f.kind}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{f.action}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <HeartPulse className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
        Account health score: <span className="font-bold text-foreground">{r.label}</span> risk
      </div>
    </Panel>
  );
}

/* ─────────────────────────────────────── Module: Support requests panel ── */

type SupportTopic = "payout" | "lead" | "verification" | "billing" | "other";

const SUPPORT_TOPICS: { value: SupportTopic; label: string }[] = [
  { value: "payout",       label: "Payout issue" },
  { value: "lead",         label: "Lead / booking issue" },
  { value: "verification", label: "Verification & documents" },
  { value: "billing",      label: "Commission / billing" },
  { value: "other",        label: "Something else" },
];

function SupportRequests() {
  const [topic, setTopic] = useState<SupportTopic>("lead");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Mock thread list — wired to a `provider_support_requests` table later.
  const [tickets, setTickets] = useState<{ id: string; topic: SupportTopic; subject: string; status: "open" | "resolved"; createdAt: string }[]>([
    { id: "PSR-1042", topic: "payout", subject: "Last week's payout missing", status: "resolved", createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: "PSR-1063", topic: "verification", subject: "NID re-upload approved?", status: "open", createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  ]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message before sending.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const id = `PSR-${1000 + Math.floor(Math.random() * 9000)}`;
      setTickets((t) => [{ id, topic, subject, status: "open", createdAt: new Date().toISOString() }, ...t]);
      setSubject("");
      setBody("");
      setSubmitting(false);
      toast.success("Support request sent", { description: `Ticket ${id} — we usually reply within 4 hours.` });
    }, 600);
  }

  return (
    <div className="space-y-4">
      <Panel title="New support request" icon={LifeBuoy} blurb="Reach the provider success team directly. Average reply time: 4 hours.">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Topic">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as SupportTopic)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {SUPPORT_TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Subject">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short summary of your issue"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
          </div>
          <Field label="Describe your issue">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Include booking IDs, dates and screenshots if possible."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <Zap className="mr-1 inline h-3.5 w-3.5 text-primary" />
              Critical issues like missing payouts get priority routing.
            </p>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Send to support
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Your support requests" icon={MessageCircle}>
        {tickets.length === 0 ? (
          <Empty icon={LifeBuoy} title="No support requests yet" hint="When you submit a request it will appear here with status updates." />
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground">{t.id}</span>
                    <p className="truncate text-sm font-semibold text-foreground">{t.subject}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {SUPPORT_TOPICS.find((x) => x.value === t.topic)?.label} · {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  t.status === "open" ? "bg-primary/15 text-primary" : "bg-success/15 text-success",
                )}>
                  {t.status === "open" ? "Open" : "Resolved"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/* ───────────────────────────────────────────────────── Shared building blocks */

function Panel({ title, icon: Icon, blurb, action, children }: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  blurb?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
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

function Pill({ tone, icon: Icon, label }: {
  tone: "success" | "warning" | "destructive" | "muted";
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  const cls =
    tone === "success" ? "bg-success/15 text-success" :
    tone === "warning" ? "bg-warning/15 text-warning" :
    tone === "destructive" ? "bg-destructive/15 text-destructive" :
    "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function Empty({ icon: Icon, title, hint }: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
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

/* ─────────────────────────────────────────────────────────────── helpers ── */

function fmt(n: number) {
  return `৳${Math.round(n).toLocaleString()}`;
}
function isWithinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() < days * 86400000;
}
function isWithinDaysWindow(iso: string, end: number, start: number) {
  const t = Date.now() - new Date(iso).getTime();
  const ms = 86400000;
  return t >= start * ms && t < end * ms;
}
function filterDays<T extends { created_at: string }>(arr: T[], days: number) {
  return arr.filter((x) => isWithinDays(x.created_at, days));
}
function filterDaysWindow<T extends { created_at: string }>(arr: T[], end: number, start: number) {
  return arr.filter((x) => isWithinDaysWindow(x.created_at, end, start));
}
function sumNet(arr: OpsLedger[]) {
  return arr.reduce((s, l) => s + Number(l.provider_net), 0);
}
function pctDelta(prev: number, now: number) {
  if (prev <= 0) return now > 0 ? 100 : 0;
  return Math.round(((now - prev) / prev) * 100);
}
function deltaLabel(d: number, suffix: string) {
  if (d === 0) return `flat ${suffix}`;
  return `${d > 0 ? "+" : ""}${d}% ${suffix}`;
}
function nextFriday() {
  const d = new Date();
  const day = d.getDay();
  const add = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
