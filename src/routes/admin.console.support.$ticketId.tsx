import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ticketsService } from "@/services/tickets";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AttachmentGrid,
  CategoryChip,
  DisputeTimeline,
  EscalationBadge,
  IdentityBadge,
  InternalNotes,
  PriorityTag,
  RefundRecommendationCard,
  ResolutionSummary,
  SlaTimer,
  StatusBadge,
} from "@/components/support/ticket-ui";
import type {
  EscalationLevel,
  RefundRecommendation,
  SupportTicket,
  TicketPriority,
  TicketResolution,
  TicketStatus,
} from "@/domain/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/console/support/$ticketId")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { ticketId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolveOpen, setResolveOpen] = useState(false);

  async function load() {
    setLoading(true);
    const t = await ticketsService.get(ticketId);
    setTicket(t);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="font-semibold">Ticket not found</p>
        <p className="text-sm text-muted-foreground">It may have been deleted.</p>
        <Link
          to="/admin/console/support"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to support
        </Link>
      </div>
    );
  }

  async function changeStatus(s: TicketStatus) {
    await ticketsService.setStatus(ticket!.id, s);
    toast.success(`Status: ${s.replace("_", " ")}`);
    void load();
  }

  async function changePriority(p: TicketPriority) {
    await ticketsService.setPriority(ticket!.id, p);
    toast.success(`Priority set to ${p}`);
    void load();
  }

  async function escalate(level: EscalationLevel) {
    await ticketsService.escalate(ticket!.id, level);
    toast.success(level === "none" ? "Escalation cleared" : `Escalated to ${level}`);
    void load();
  }

  async function recommend(rec: RefundRecommendation, amount?: number) {
    await ticketsService.recommendRefund(ticket!.id, rec, amount);
    toast.success("Refund recommendation updated");
    void load();
  }

  async function addNote(body: string) {
    await ticketsService.addNote(ticket!.id, {
      authorId: user?.id ?? "admin",
      authorName: user?.email?.split("@")[0] ?? "Admin",
      body,
    });
    toast.success("Note added");
    void load();
  }

  async function resolve(res: TicketResolution) {
    await ticketsService.resolve(ticket!.id, res);
    toast.success("Ticket resolved");
    setResolveOpen(false);
    void load();
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/console/support" })}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all tickets
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{ticket.reference}</span>
              <PriorityTag priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              {ticket.escalationLevel !== "none" && (
                <EscalationBadge level={ticket.escalationLevel} />
              )}
              <CategoryChip category={ticket.category} />
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight md:text-2xl">{ticket.subject}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Opened {new Date(ticket.createdAt).toLocaleString()} · last update{" "}
              {new Date(ticket.updatedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Refresh
            </Button>
            {ticket.status !== "resolved" && ticket.status !== "closed" && (
              <Button size="sm" onClick={() => setResolveOpen(true)}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Resolve
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* SLA strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <SlaTimer
          dueAt={ticket.firstResponseDueAt}
          metAt={ticket.firstRespondedAt}
          label="First response"
        />
        {!ticket.resolution && (
          <SlaTimer dueAt={ticket.resolutionDueAt} label="Resolution" />
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          Assignee:{" "}
          <span className="font-medium text-foreground">
            {ticket.assigneeName ?? "Unassigned"}
          </span>
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Body */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <IdentityBadge
                role={ticket.requesterRole}
                name={ticket.customerName}
                email={ticket.customerEmail}
                size="md"
              />
              {ticket.providerName && ticket.requesterRole !== "provider" && (
                <span className="text-xs text-muted-foreground">
                  · provider <span className="font-medium text-foreground">{ticket.providerName}</span>
                </span>
              )}
              {ticket.bookingReference && (
                <span className="text-xs text-muted-foreground">
                  · booking {ticket.bookingReference}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.body}</p>
          </section>

          {ticket.resolution && <ResolutionSummary resolution={ticket.resolution} />}

          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Dispute timeline</TabsTrigger>
              <TabsTrigger value="attachments">
                Attachments ({ticket.attachments.length})
              </TabsTrigger>
              <TabsTrigger value="notes">
                Notes ({ticket.internalNotes.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="mt-4">
              <DisputeTimeline events={ticket.timeline} />
            </TabsContent>
            <TabsContent value="attachments" className="mt-4">
              <AttachmentGrid items={ticket.attachments} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <InternalNotes notes={ticket.internalNotes} onAdd={addNote} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Side column */}
        <aside className="space-y-4">
          {/* Customer info */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" />
              Requester
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="font-semibold">{ticket.customerName}</div>
              <a
                href={`mailto:${ticket.customerEmail}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" />
                {ticket.customerEmail}
              </a>
              {ticket.customerPhone && (
                <a
                  href={`tel:${ticket.customerPhone}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {ticket.customerPhone}
                </a>
              )}
            </div>
            {(ticket.customerLifetimeBookings || ticket.customerLifetimeSpend) && (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Bookings
                  </div>
                  <div className="text-sm font-bold">{ticket.customerLifetimeBookings ?? 0}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Lifetime
                  </div>
                  <div className="text-sm font-bold">
                    ৳{(ticket.customerLifetimeSpend ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Quick controls */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Manage
            </div>
            <div className="grid gap-3">
              <ControlRow label="Status">
                <Select
                  value={ticket.status}
                  onValueChange={(v) => changeStatus(v as TicketStatus)}
                >
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending reply</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </ControlRow>

              <ControlRow label="Priority">
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => changePriority(v as TicketPriority)}
                >
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </ControlRow>

              <ControlRow label="Escalation">
                <Select
                  value={ticket.escalationLevel}
                  onValueChange={(v) => escalate(v as EscalationLevel)}
                >
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No escalation</SelectItem>
                    <SelectItem value="tier1">Tier 1</SelectItem>
                    <SelectItem value="tier2">Tier 2</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </ControlRow>

              {ticket.escalationLevel === "none" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => escalate("tier1")}
                  className="w-full"
                >
                  <ArrowUpCircle className="mr-1 h-3.5 w-3.5" />
                  Escalate to Tier 1
                </Button>
              )}
            </div>
          </section>

          {/* Refund recommendation */}
          <RefundRecommendationCard
            recommendation={ticket.refundRecommendation}
            amount={ticket.refundAmount}
            currency={ticket.currency ?? "BDT"}
          />
          <RefundEditor
            recommendation={ticket.refundRecommendation}
            amount={ticket.refundAmount}
            onChange={recommend}
          />
        </aside>
      </div>

      <ResolveDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        onSubmit={resolve}
        defaultName={user?.email?.split("@")[0] ?? "Admin"}
        userId={user?.id ?? "admin"}
      />

      {/* fade-in age indicator anchor */}
      <span className="sr-only">
        <Clock />
      </span>
    </div>
  );
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function RefundEditor({
  recommendation,
  amount,
  onChange,
}: {
  recommendation: RefundRecommendation;
  amount?: number;
  onChange: (r: RefundRecommendation, amount?: number) => void;
}) {
  const [val, setVal] = useState<RefundRecommendation>(recommendation);
  const [amt, setAmt] = useState<string>(amount ? String(amount) : "");
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Update recommendation
      </div>
      <div className="grid gap-2">
        <Select value={val} onValueChange={(v) => setVal(v as RefundRecommendation)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No refund</SelectItem>
            <SelectItem value="partial">Partial refund</SelectItem>
            <SelectItem value="full">Full refund</SelectItem>
          </SelectContent>
        </Select>
        {val !== "none" && (
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Amount in BDT"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
          />
        )}
        <Button
          size="sm"
          variant="outline"
          className={cn("w-full", val === recommendation && amt === String(amount ?? "") && "opacity-50")}
          onClick={() => onChange(val, val === "none" ? undefined : Number(amt) || undefined)}
        >
          Save recommendation
        </Button>
      </div>
    </div>
  );
}

function ResolveDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultName,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (r: TicketResolution) => Promise<void> | void;
  defaultName: string;
  userId: string;
}) {
  const [outcome, setOutcome] = useState<TicketResolution["outcome"]>("fixed");
  const [summary, setSummary] = useState("");
  const [csat, setCsat] = useState<string>("");

  async function submit() {
    if (!summary.trim()) {
      toast.error("Please write a short summary");
      return;
    }
    await onSubmit({
      outcome,
      summary: summary.trim(),
      resolvedById: userId,
      resolvedByName: defaultName,
      resolvedAt: new Date().toISOString(),
      satisfactionRating: csat ? (Number(csat) as 1 | 2 | 3 | 4 | 5) : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve ticket</DialogTitle>
          <DialogDescription>
            Capture the outcome so we can learn from this dispute.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Outcome
            </label>
            <Select
              value={outcome}
              onValueChange={(v) => setOutcome(v as TicketResolution["outcome"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Issue fixed</SelectItem>
                <SelectItem value="refunded">Refund issued</SelectItem>
                <SelectItem value="compensated">Goodwill credit</SelectItem>
                <SelectItem value="no_action">No action needed</SelectItem>
                <SelectItem value="escalated">Escalated externally</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Summary
            </label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What was the issue, and what did we do about it?"
              className="w-full rounded-lg border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              CSAT (optional, 1–5)
            </label>
            <Input
              type="number"
              min="1"
              max="5"
              value={csat}
              onChange={(e) => setCsat(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Mark resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
