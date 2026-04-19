import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivitySquare,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  Star,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ticketsService } from "@/services/tickets";
import type {
  EscalationLevel,
  SupportTicket,
  TicketAnalytics,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/domain/types";
import {
  CategoryChip,
  EscalationBadge,
  IdentityBadge,
  PriorityTag,
  SlaTimer,
  StatusBadge,
} from "@/components/support/ticket-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/console/support")({
  component: SupportPage,
});

type ContactMsg = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  handled: boolean;
  created_at: string;
};

function SupportPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Support & Disputes"
        title="Support operations"
        description="Tickets, disputes, and contact-form messages — all in one console."
      />

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets" className="gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5">
            <Inbox className="h-3.5 w-3.5" />
            Contact inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-5">
          <TicketsTab />
        </TabsContent>
        <TabsContent value="contact" className="mt-5">
          <ContactInboxTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────────────────────────── Tickets ─────────────────────────────── */

function TicketsTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [category, setCategory] = useState<TicketCategory | "all">("all");
  const [escalation, setEscalation] = useState<EscalationLevel | "all">("all");
  const [scope, setScope] = useState<"all" | "customer" | "provider">("all");

  async function load() {
    setLoading(true);
    const [list, an] = await Promise.all([ticketsService.list(), ticketsService.analytics()]);
    setTickets(list);
    setAnalytics(an);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      tickets.filter((t) => {
        if (status !== "all" && t.status !== status) return false;
        if (priority !== "all" && t.priority !== priority) return false;
        if (category !== "all" && t.category !== category) return false;
        if (escalation !== "all" && t.escalationLevel !== escalation) return false;
        if (scope !== "all" && t.requesterRole !== scope) return false;
        if (q) {
          const t1 = q.toLowerCase();
          const hay = [t.subject, t.body, t.customerName, t.reference, t.providerName ?? ""]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(t1)) return false;
        }
        return true;
      }),
    [tickets, status, priority, category, escalation, scope, q],
  );

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {analytics && <AnalyticsOverview analytics={analytics} />}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subject, ref, customer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All requesters</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="provider">Providers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending reply</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="provider_quality">Provider quality</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={escalation} onValueChange={(v) => setEscalation(v as typeof escalation)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All escalations</SelectItem>
            <SelectItem value="none">No escalation</SelectItem>
            <SelectItem value="tier1">Tier 1</SelectItem>
            <SelectItem value="tier2">Tier 2</SelectItem>
            <SelectItem value="leadership">Leadership</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No tickets match your filters"
          description="Try clearing some filters or check the contact inbox tab."
        />
      ) : (
        <ul className="grid gap-3">
          {filtered.map((t) => (
            <TicketRow key={t.id} t={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketRow({ t }: { t: SupportTicket }) {
  const isOpen = t.status !== "resolved" && t.status !== "closed";
  return (
    <li>
      <Link
        to="/admin/console/support/$ticketId"
        params={{ ticketId: t.id }}
        className={cn(
          "block rounded-2xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-elevated",
          isOpen ? "border-border" : "border-border opacity-80",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">{t.reference}</span>
              <PriorityTag priority={t.priority} />
              <StatusBadge status={t.status} />
              {t.escalationLevel !== "none" && <EscalationBadge level={t.escalationLevel} />}
              <CategoryChip category={t.category} />
            </div>
            <h3 className="mt-1.5 truncate text-base font-semibold">{t.subject}</h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{t.body}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <IdentityBadge role={t.requesterRole} name={t.customerName} email={t.customerEmail} />
              {t.providerName && t.requesterRole !== "provider" && (
                <span className="text-muted-foreground">
                  · provider <span className="font-medium text-foreground">{t.providerName}</span>
                </span>
              )}
              {t.bookingReference && (
                <span className="text-muted-foreground">
                  · {t.bookingReference}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
            <SlaTimer
              dueAt={t.firstResponseDueAt}
              metAt={t.firstRespondedAt}
              label="First response"
              compact
            />
            {!t.resolution && (
              <SlaTimer dueAt={t.resolutionDueAt} label="Resolution" compact />
            )}
            <span className="text-[10px] text-muted-foreground">
              Updated {new Date(t.updatedAt).toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              Open ticket
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

/* ──────────────────────── Analytics overview row ─────────────────────── */

function AnalyticsOverview({ analytics }: { analytics: TicketAnalytics }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <KpiCard
        icon={ShieldAlert}
        label="Open"
        value={analytics.open + analytics.inProgress}
        sub={`${analytics.escalated} escalated`}
        accent="primary"
      />
      <KpiCard
        icon={CheckCircle2}
        label="Resolved today"
        value={analytics.resolvedToday}
        sub={`Total ${analytics.total}`}
        accent="success"
      />
      <KpiCard
        icon={TimerReset}
        label="SLA breach rate"
        value={`${analytics.slaBreachRate}%`}
        sub="First response"
        accent={analytics.slaBreachRate > 10 ? "danger" : "neutral"}
      />
      <KpiCard
        icon={Clock}
        label="Avg first response"
        value={`${analytics.avgFirstResponseMins}m`}
        sub={`Resolution ${analytics.avgResolutionHours}h`}
        accent="neutral"
      />
      <KpiCard
        icon={Star}
        label="CSAT"
        value={analytics.csat ? `${analytics.csat}/5` : "—"}
        sub="Resolved tickets"
        accent="warning"
      />
      <KpiCard
        icon={ActivitySquare}
        label="Urgent / High"
        value={analytics.byPriority.urgent + analytics.byPriority.high}
        sub={`Urgent ${analytics.byPriority.urgent}`}
        accent="danger"
      />
    </div>
  );
}

const ACCENT: Record<string, string> = {
  primary: "border-primary/30 bg-primary/5 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  danger: "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  neutral: "border-border bg-card text-foreground",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: string | number;
  sub?: string;
  accent: keyof typeof ACCENT;
}) {
  return (
    <div className={cn("rounded-2xl border p-3", ACCENT[accent])}>
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide opacity-80">
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

/* ───────────────────────── Contact inbox (legacy) ────────────────────── */

function ContactInboxTab() {
  const [msgs, setMsgs] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"open" | "handled" | "all">("open");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setMsgs((data ?? []) as ContactMsg[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleHandled(id: string, handled: boolean) {
    setBusy(id);
    const { error } = await supabase.from("contact_messages").update({ handled }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, handled } : m)));
    toast.success(handled ? "Marked handled" : "Reopened");
  }

  const filtered = useMemo(() => {
    let list = msgs;
    if (filter === "open") list = list.filter((m) => !m.handled);
    else if (filter === "handled") list = list.filter((m) => m.handled);
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((m) =>
        [m.full_name, m.email, m.phone, m.message].some((v) => v?.toLowerCase().includes(t)),
      );
    }
    return list;
  }, [msgs, filter, q]);

  const open = msgs.filter((m) => !m.handled).length;

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Open messages" value={open} accent={open > 0} />
        <Stat label="Handled" value={msgs.length - open} />
        <Stat label="Total" value={msgs.length} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["open", "handled", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="ml-auto">
          {loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No messages"
          description={filter === "open" ? "Inbox zero. Nice work." : undefined}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-2xl border p-4 shadow-soft",
                m.handled ? "border-border bg-card opacity-70" : "border-primary/20 bg-card",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{m.full_name}</div>
                    {!m.handled && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        Open
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <a
                      href={`mailto:${m.email}`}
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {m.email}
                    </a>
                    {m.phone && (
                      <a
                        href={`tel:${m.phone}`}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {m.phone}
                      </a>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
                </div>
                <Button
                  size="sm"
                  variant={m.handled ? "outline" : "default"}
                  onClick={() => toggleHandled(m.id, !m.handled)}
                  disabled={busy === m.id}
                >
                  {busy === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {m.handled ? "Reopen" : "Mark handled"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-soft",
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

// keep TrendingUp import used for tree-shaking and analytics extension hooks
void TrendingUp;
