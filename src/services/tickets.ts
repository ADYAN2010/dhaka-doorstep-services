/**
 * Support tickets service — UI-only mock for the admin support module.
 *
 * Schema mirrors a future `support_tickets` table (with sub-tables for
 * notes, attachments, and timeline). When we add it, only this file
 * changes; the admin UI stays the same.
 */

import type {
  EscalationLevel,
  ID,
  InternalNote,
  RefundRecommendation,
  SupportAttachment,
  SupportTicket,
  TicketAnalytics,
  TicketCategory,
  TicketPriority,
  TicketResolution,
  TicketStatus,
  TicketTimelineEvent,
  TicketTimelineEventKind,
} from "@/domain/types";

let counter = 1284;
const ref = () => `TKT-${String(counter++).padStart(6, "0")}`;
const id = () => Math.random().toString(36).slice(2, 11);

const NOW = Date.now();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);
const minutesFromNow = (m: number) => new Date(NOW + m * 60_000).toISOString();

const SLA_FIRST_RESPONSE: Record<TicketPriority, number> = {
  urgent: 15,
  high: 60,
  normal: 240,
  low: 480,
};
const SLA_RESOLUTION_HOURS: Record<TicketPriority, number> = {
  urgent: 4,
  high: 24,
  normal: 72,
  low: 168,
};

function makeTimeline(events: Array<Omit<TicketTimelineEvent, "id">>): TicketTimelineEvent[] {
  return events.map((e) => ({ ...e, id: id() }));
}

const MOCK: SupportTicket[] = [
  {
    id: "t_1",
    reference: ref(),
    subject: "Provider didn't show up for AC service",
    body:
      "Booked an AC repair for 10am today. Provider confirmed last night but never arrived. Tried calling twice, no response. Need this fixed today — it's 38°C in Dhaka.",
    status: "open",
    priority: "urgent",
    category: "provider_quality",
    requesterRole: "customer",
    customerName: "Tasnim Akter",
    customerEmail: "tasnim@example.com",
    customerPhone: "+8801711-223344",
    customerLifetimeBookings: 7,
    customerLifetimeSpend: 18_400,
    bookingId: "b_demo_1",
    bookingReference: "BKG-1042",
    providerId: "p_demo_1",
    providerName: "Cool Breeze Services",
    assigneeId: null,
    assigneeName: null,
    firstResponseDueAt: minutesFromNow(5),
    resolutionDueAt: hoursAgo(-3),
    firstRespondedAt: null,
    escalationLevel: "tier1",
    refundRecommendation: "full",
    refundAmount: 1800,
    currency: "BDT",
    attachments: [
      {
        id: id(),
        name: "missed-call-log.png",
        mimeType: "image/png",
        size: 184_320,
        url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=60",
        uploadedAt: minutesAgo(12),
      },
    ],
    internalNotes: [
      {
        id: id(),
        authorId: "admin_1",
        authorName: "Nadia (Support Lead)",
        body: "Provider has 2 prior no-shows this month. Recommend full refund + provider warning.",
        createdAt: minutesAgo(8),
      },
    ],
    timeline: makeTimeline([
      { kind: "created", actor: "Tasnim Akter", body: "Ticket opened from booking BKG-1042", createdAt: minutesAgo(15) },
      { kind: "escalated", actor: "System", body: "Auto-escalated to Tier 1: urgent priority + provider no-show", createdAt: minutesAgo(14) },
      { kind: "note", actor: "Nadia (Support Lead)", body: "Internal note added", createdAt: minutesAgo(8) },
    ]),
    resolution: null,
    createdAt: minutesAgo(15),
    updatedAt: minutesAgo(8),
  },
  {
    id: "t_2",
    reference: ref(),
    subject: "Wrong amount on invoice",
    body:
      "I was charged ৳2,499 instead of the agreed ৳1,899 for the cleaning service. Please refund the difference of ৳600.",
    status: "in_progress",
    priority: "normal",
    category: "payment",
    requesterRole: "customer",
    customerName: "Imran Hossain",
    customerEmail: "imran@example.com",
    customerPhone: "+8801911-887766",
    customerLifetimeBookings: 3,
    customerLifetimeSpend: 5_200,
    bookingId: "b_demo_2",
    bookingReference: "BKG-1031",
    providerId: "p_demo_2",
    providerName: "ShineHome Cleaning",
    assigneeId: "admin_1",
    assigneeName: "Nadia (Support Lead)",
    firstResponseDueAt: hoursAgo(3),
    resolutionDueAt: hoursAgo(-69),
    firstRespondedAt: hoursAgo(3.5),
    escalationLevel: "none",
    refundRecommendation: "partial",
    refundAmount: 600,
    currency: "BDT",
    attachments: [
      {
        id: id(),
        name: "invoice-1031.pdf",
        mimeType: "application/pdf",
        size: 78_440,
        url: "#",
        uploadedAt: hoursAgo(4),
      },
    ],
    internalNotes: [
      {
        id: id(),
        authorId: "admin_1",
        authorName: "Nadia (Support Lead)",
        body: "Confirmed pricing mismatch — provider used wrong tariff card. Approve ৳600 refund.",
        createdAt: hoursAgo(2),
      },
    ],
    timeline: makeTimeline([
      { kind: "created", actor: "Imran Hossain", body: "Ticket opened", createdAt: hoursAgo(4) },
      { kind: "assigned", actor: "System", body: "Assigned to Nadia (Support Lead)", createdAt: hoursAgo(3.6) },
      { kind: "message_out", actor: "Nadia (Support Lead)", body: "Replied to customer", createdAt: hoursAgo(3.5) },
      { kind: "status_change", actor: "Nadia (Support Lead)", body: "Status: open → in_progress", createdAt: hoursAgo(3) },
      { kind: "refund_proposed", actor: "Nadia (Support Lead)", body: "Recommended partial refund: BDT 600", createdAt: hoursAgo(2) },
    ]),
    resolution: null,
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(2),
  },
  {
    id: "t_3",
    reference: ref(),
    subject: "How do I become a provider?",
    body:
      "I run a small cleaning team in Mirpur. Please advise on onboarding — what documents do I need?",
    status: "resolved",
    priority: "low",
    category: "account",
    requesterRole: "customer",
    customerName: "Shafiq Ahmed",
    customerEmail: "shafiq@example.com",
    customerPhone: null,
    customerLifetimeBookings: 0,
    customerLifetimeSpend: 0,
    bookingId: null,
    bookingReference: null,
    providerId: null,
    providerName: null,
    assigneeId: "admin_1",
    assigneeName: "Nadia (Support Lead)",
    firstResponseDueAt: hoursAgo(46),
    resolutionDueAt: hoursAgo(-120),
    firstRespondedAt: hoursAgo(47),
    escalationLevel: "none",
    refundRecommendation: "none",
    attachments: [],
    internalNotes: [],
    timeline: makeTimeline([
      { kind: "created", actor: "Shafiq Ahmed", body: "Ticket opened", createdAt: hoursAgo(48) },
      { kind: "message_out", actor: "Nadia (Support Lead)", body: "Sent onboarding guide", createdAt: hoursAgo(47) },
      { kind: "resolved", actor: "Nadia (Support Lead)", body: "Resolved: pointed to provider signup", createdAt: hoursAgo(24) },
    ]),
    resolution: {
      summary: "Sent onboarding guide and direct link to provider signup. Customer confirmed they would apply.",
      outcome: "no_action",
      resolvedById: "admin_1",
      resolvedByName: "Nadia (Support Lead)",
      resolvedAt: hoursAgo(24),
      satisfactionRating: 5,
    },
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(24),
  },
  {
    id: "t_4",
    reference: ref(),
    subject: "Urgent: gas leak smell after AC service",
    body:
      "Suspected gas leak after AC servicing yesterday. Smelling something off near the unit. Need someone to inspect immediately — safety concern.",
    status: "escalated",
    priority: "urgent",
    category: "safety",
    requesterRole: "customer",
    customerName: "Nadia Rahman",
    customerEmail: "nadia.r@example.com",
    customerPhone: "+8801555-101010",
    customerLifetimeBookings: 12,
    customerLifetimeSpend: 32_900,
    bookingId: "b_demo_3",
    bookingReference: "BKG-1019",
    providerId: "p_demo_3",
    providerName: "Pro AC Care",
    assigneeId: "admin_2",
    assigneeName: "Rakib (On-call)",
    firstResponseDueAt: minutesAgo(7),
    resolutionDueAt: hoursAgo(-2),
    firstRespondedAt: minutesAgo(5),
    escalationLevel: "leadership",
    refundRecommendation: "full",
    refundAmount: 3200,
    currency: "BDT",
    attachments: [
      {
        id: id(),
        name: "ac-unit-photo.jpg",
        mimeType: "image/jpeg",
        size: 421_770,
        url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=60",
        uploadedAt: minutesAgo(8),
      },
    ],
    internalNotes: [
      {
        id: id(),
        authorId: "admin_2",
        authorName: "Rakib (On-call)",
        body: "Dispatched safety inspector. Notified leadership per safety protocol.",
        createdAt: minutesAgo(4),
      },
    ],
    timeline: makeTimeline([
      { kind: "created", actor: "Nadia Rahman", body: "Ticket opened", createdAt: minutesAgo(8) },
      { kind: "escalated", actor: "System", body: "Auto-escalated to Leadership: safety category", createdAt: minutesAgo(8) },
      { kind: "assigned", actor: "System", body: "Assigned to Rakib (On-call)", createdAt: minutesAgo(7) },
      { kind: "message_out", actor: "Rakib (On-call)", body: "Called customer — inspector dispatched", createdAt: minutesAgo(5) },
      { kind: "note", actor: "Rakib (On-call)", body: "Internal note added", createdAt: minutesAgo(4) },
    ]),
    resolution: null,
    createdAt: minutesAgo(8),
    updatedAt: minutesAgo(4),
  },
  {
    id: "t_5",
    reference: ref(),
    subject: "Can't withdraw earnings to bKash",
    body:
      "Tried to withdraw ৳12,400 to my bKash but the request keeps failing. Tried 3 times today.",
    status: "pending",
    priority: "high",
    category: "payment",
    requesterRole: "provider",
    customerName: "Cool Breeze Services",
    customerEmail: "ops@coolbreeze.bd",
    customerPhone: "+8801711-998877",
    customerLifetimeBookings: 184,
    customerLifetimeSpend: 0,
    bookingId: null,
    bookingReference: null,
    providerId: "p_demo_1",
    providerName: "Cool Breeze Services",
    assigneeId: null,
    assigneeName: null,
    firstResponseDueAt: minutesFromNow(35),
    resolutionDueAt: hoursAgo(-22),
    firstRespondedAt: null,
    escalationLevel: "none",
    refundRecommendation: "none",
    attachments: [
      {
        id: id(),
        name: "error-screenshot.png",
        mimeType: "image/png",
        size: 92_300,
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=60",
        uploadedAt: minutesAgo(40),
      },
    ],
    internalNotes: [],
    timeline: makeTimeline([
      { kind: "created", actor: "Cool Breeze Services", body: "Ticket opened by provider", createdAt: minutesAgo(40) },
    ]),
    resolution: null,
    createdAt: minutesAgo(40),
    updatedAt: minutesAgo(40),
  },
  {
    id: "t_6",
    reference: ref(),
    subject: "Dispute: customer claims job not done",
    body:
      "Customer is disputing a completed deep-clean job. We have before/after photos. Please review.",
    status: "in_progress",
    priority: "high",
    category: "refund",
    requesterRole: "provider",
    customerName: "ShineHome Cleaning",
    customerEmail: "support@shinehome.bd",
    customerPhone: "+8801822-554433",
    customerLifetimeBookings: 92,
    customerLifetimeSpend: 0,
    bookingId: "b_demo_4",
    bookingReference: "BKG-1008",
    providerId: "p_demo_2",
    providerName: "ShineHome Cleaning",
    assigneeId: "admin_1",
    assigneeName: "Nadia (Support Lead)",
    firstResponseDueAt: hoursAgo(11),
    resolutionDueAt: hoursAgo(-13),
    firstRespondedAt: hoursAgo(11),
    escalationLevel: "tier2",
    refundRecommendation: "partial",
    refundAmount: 750,
    currency: "BDT",
    attachments: [
      {
        id: id(),
        name: "before.jpg",
        mimeType: "image/jpeg",
        size: 312_840,
        url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=60",
        uploadedAt: hoursAgo(12),
      },
      {
        id: id(),
        name: "after.jpg",
        mimeType: "image/jpeg",
        size: 298_120,
        url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=60",
        uploadedAt: hoursAgo(12),
      },
    ],
    internalNotes: [
      {
        id: id(),
        authorId: "admin_1",
        authorName: "Nadia (Support Lead)",
        body: "Photos look reasonable but customer still unhappy with bathroom area. Suggest goodwill ৳750 partial refund.",
        createdAt: hoursAgo(2),
      },
    ],
    timeline: makeTimeline([
      { kind: "created", actor: "ShineHome Cleaning", body: "Dispute opened by provider", createdAt: hoursAgo(12) },
      { kind: "assigned", actor: "System", body: "Assigned to Nadia (Support Lead)", createdAt: hoursAgo(11.5) },
      { kind: "escalated", actor: "Nadia (Support Lead)", body: "Escalated to Tier 2 — disputed evidence", createdAt: hoursAgo(8) },
      { kind: "refund_proposed", actor: "Nadia (Support Lead)", body: "Recommended partial refund: BDT 750 (goodwill)", createdAt: hoursAgo(2) },
    ]),
    resolution: null,
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(2),
  },
  {
    id: "t_7",
    reference: ref(),
    subject: "Refund processed — confirmation",
    body: "Got my refund of ৳1,200 today, thanks for the quick turnaround.",
    status: "closed",
    priority: "low",
    category: "refund",
    requesterRole: "customer",
    customerName: "Sadia Khan",
    customerEmail: "sadia@example.com",
    customerPhone: "+8801999-112233",
    customerLifetimeBookings: 5,
    customerLifetimeSpend: 9_400,
    bookingId: "b_demo_5",
    bookingReference: "BKG-0987",
    providerId: "p_demo_3",
    providerName: "Pro AC Care",
    assigneeId: "admin_1",
    assigneeName: "Nadia (Support Lead)",
    firstResponseDueAt: hoursAgo(70),
    resolutionDueAt: hoursAgo(-100),
    firstRespondedAt: hoursAgo(71),
    escalationLevel: "none",
    refundRecommendation: "full",
    refundAmount: 1200,
    currency: "BDT",
    attachments: [],
    internalNotes: [],
    timeline: makeTimeline([
      { kind: "created", actor: "Sadia Khan", body: "Ticket opened", createdAt: hoursAgo(72) },
      { kind: "refund_approved", actor: "Nadia (Support Lead)", body: "Refund approved: BDT 1,200", createdAt: hoursAgo(48) },
      { kind: "resolved", actor: "Nadia (Support Lead)", body: "Resolved with full refund", createdAt: hoursAgo(46) },
    ]),
    resolution: {
      summary: "Full refund issued via original payment method (bKash). Customer confirmed receipt.",
      outcome: "refunded",
      resolvedById: "admin_1",
      resolvedByName: "Nadia (Support Lead)",
      resolvedAt: hoursAgo(46),
      satisfactionRating: 5,
    },
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(46),
  },
];

export type TicketFilters = {
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  category?: TicketCategory | "all";
  requesterRole?: "customer" | "provider" | "all";
  escalation?: EscalationLevel | "all";
  query?: string;
};

function matches(t: SupportTicket, f: TicketFilters): boolean {
  if (f.status && f.status !== "all" && t.status !== f.status) return false;
  if (f.priority && f.priority !== "all" && t.priority !== f.priority) return false;
  if (f.category && f.category !== "all" && t.category !== f.category) return false;
  if (f.requesterRole && f.requesterRole !== "all" && t.requesterRole !== f.requesterRole)
    return false;
  if (f.escalation && f.escalation !== "all" && t.escalationLevel !== f.escalation)
    return false;
  if (f.query) {
    const q = f.query.toLowerCase();
    const hay = [t.subject, t.body, t.customerName, t.reference, t.providerName ?? ""]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function priorityWeight(p: TicketPriority) {
  return { urgent: 0, high: 1, normal: 2, low: 3 }[p];
}

export const ticketsService = {
  list: async (filters: TicketFilters = {}): Promise<SupportTicket[]> => {
    return [...MOCK]
      .filter((t) => matches(t, filters))
      .sort((a, b) => {
        // Open first, then by priority, then newest first.
        const aOpen = a.status !== "resolved" && a.status !== "closed" ? 0 : 1;
        const bOpen = b.status !== "resolved" && b.status !== "closed" ? 0 : 1;
        if (aOpen !== bOpen) return aOpen - bOpen;
        const pw = priorityWeight(a.priority) - priorityWeight(b.priority);
        if (pw !== 0) return pw;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  get: async (ticketId: ID): Promise<SupportTicket | null> =>
    MOCK.find((t) => t.id === ticketId) ?? null,

  setStatus: async (ticketId: ID, status: TicketStatus): Promise<void> => {
    const t = MOCK.find((x) => x.id === ticketId);
    if (!t) return;
    const prev = t.status;
    t.status = status;
    t.updatedAt = new Date().toISOString();
    t.timeline.push({
      id: id(),
      kind: status === "resolved" ? "resolved" : status === "open" ? "reopened" : "status_change",
      actor: "Admin",
      body: `Status: ${prev} → ${status}`,
      createdAt: t.updatedAt,
    });
  },

  setPriority: async (ticketId: ID, priority: TicketPriority): Promise<void> => {
    const t = MOCK.find((x) => x.id === ticketId);
    if (!t) return;
    const prev = t.priority;
    t.priority = priority;
    t.updatedAt = new Date().toISOString();
    t.timeline.push({
      id: id(),
      kind: "priority_change",
      actor: "Admin",
      body: `Priority: ${prev} → ${priority}`,
      createdAt: t.updatedAt,
    });
  },

  escalate: async (ticketId: ID, level: EscalationLevel): Promise<void> => {
    const t = MOCK.find((x) => x.id === ticketId);
    if (!t) return;
    t.escalationLevel = level;
    if (level !== "none") t.status = "escalated";
    t.updatedAt = new Date().toISOString();
    t.timeline.push({
      id: id(),
      kind: "escalated",
      actor: "Admin",
      body: level === "none" ? "Escalation cleared" : `Escalated to ${level}`,
      createdAt: t.updatedAt,
    });
  },

  addNote: async (
    ticketId: ID,
    note: { authorId: ID; authorName: string; body: string },
  ): Promise<InternalNote | null> => {
    const t = MOCK.find((x) => x.id === ticketId);
    if (!t) return null;
    const n: InternalNote = {
      id: id(),
      authorId: note.authorId,
      authorName: note.authorName,
      body: note.body,
      createdAt: new Date().toISOString(),
    };
    t.internalNotes.push(n);
    t.updatedAt = n.createdAt;
    t.timeline.push({
      id: id(),
      kind: "note",
      actor: note.authorName,
      body: "Internal note added",
      createdAt: n.createdAt,
    });
    return n;
  },

  recommendRefund: async (
    ticketId: ID,
    rec: RefundRecommendation,
    amount?: number,
  ): Promise<void> => {
    const t = MOCK.find((x) => x.id === ticketId);
    if (!t) return;
    t.refundRecommendation = rec;
    if (typeof amount === "number") t.refundAmount = amount;
    t.updatedAt = new Date().toISOString();
    t.timeline.push({
      id: id(),
      kind: "refund_proposed",
      actor: "Admin",
      body:
        rec === "none"
          ? "Refund recommendation cleared"
          : `Recommended ${rec} refund${amount ? `: BDT ${amount}` : ""}`,
      createdAt: t.updatedAt,
    });
  },

  resolve: async (ticketId: ID, resolution: TicketResolution): Promise<void> => {
    const t = MOCK.find((x) => x.id === ticketId);
    if (!t) return;
    t.status = "resolved";
    t.resolution = resolution;
    t.updatedAt = resolution.resolvedAt;
    t.timeline.push({
      id: id(),
      kind: "resolved",
      actor: resolution.resolvedByName,
      body: `Resolved: ${resolution.outcome}`,
      createdAt: resolution.resolvedAt,
    });
  },

  appendEvent: async (
    ticketId: ID,
    kind: TicketTimelineEventKind,
    actor: string,
    body: string,
  ): Promise<void> => {
    const t = MOCK.find((x) => x.id === ticketId);
    if (!t) return;
    const now = new Date().toISOString();
    t.timeline.push({ id: id(), kind, actor, body, createdAt: now });
    t.updatedAt = now;
  },

  attach: async (
    ticketId: ID,
    file: Omit<SupportAttachment, "id" | "uploadedAt">,
  ): Promise<SupportAttachment | null> => {
    const t = MOCK.find((x) => x.id === ticketId);
    if (!t) return null;
    const a: SupportAttachment = { ...file, id: id(), uploadedAt: new Date().toISOString() };
    t.attachments.push(a);
    t.updatedAt = a.uploadedAt;
    return a;
  },

  analytics: async (): Promise<TicketAnalytics> => {
    const total = MOCK.length;
    const open = MOCK.filter((t) => t.status === "open" || t.status === "pending").length;
    const inProgress = MOCK.filter((t) => t.status === "in_progress").length;
    const escalated = MOCK.filter((t) => t.status === "escalated").length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const resolvedToday = MOCK.filter(
      (t) => t.resolution && new Date(t.resolution.resolvedAt) >= todayStart,
    ).length;

    const slaBreaches = MOCK.filter(
      (t) =>
        !t.firstRespondedAt && new Date(t.firstResponseDueAt).getTime() < Date.now(),
    ).length;
    const slaBreachRate = total > 0 ? Math.round((slaBreaches / total) * 100) : 0;

    const responded = MOCK.filter((t) => t.firstRespondedAt);
    const avgFirstResponseMins = responded.length
      ? Math.round(
          responded.reduce(
            (s, t) =>
              s +
              (new Date(t.firstRespondedAt!).getTime() - new Date(t.createdAt).getTime()) /
                60_000,
            0,
          ) / responded.length,
        )
      : 0;

    const resolved = MOCK.filter((t) => t.resolution);
    const avgResolutionHours = resolved.length
      ? Math.round(
          (resolved.reduce(
            (s, t) =>
              s +
              (new Date(t.resolution!.resolvedAt).getTime() - new Date(t.createdAt).getTime()) /
                3_600_000,
            0,
          ) /
            resolved.length) *
            10,
        ) / 10
      : 0;

    const rated = resolved.filter((t) => t.resolution?.satisfactionRating);
    const csat = rated.length
      ? Math.round(
          (rated.reduce((s, t) => s + (t.resolution!.satisfactionRating ?? 0), 0) /
            rated.length) *
            10,
        ) / 10
      : 0;

    const byPriority = { urgent: 0, high: 0, normal: 0, low: 0 } as Record<
      TicketPriority,
      number
    >;
    const byCategory = {
      booking: 0,
      payment: 0,
      refund: 0,
      provider_quality: 0,
      account: 0,
      safety: 0,
      other: 0,
    } as Record<TicketCategory, number>;

    MOCK.forEach((t) => {
      byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
    });

    return {
      total,
      open,
      inProgress,
      escalated,
      resolvedToday,
      slaBreachRate,
      avgFirstResponseMins,
      avgResolutionHours,
      csat,
      byPriority,
      byCategory,
    };
  },
};

export const SLA_TARGETS = {
  firstResponseMinutes: SLA_FIRST_RESPONSE,
  resolutionHours: SLA_RESOLUTION_HOURS,
};
