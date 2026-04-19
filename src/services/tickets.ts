/**
 * Support tickets service — UI-only mock for the admin support module.
 *
 * Schema mirrors a future `support_tickets` table. When we add it, only
 * this file changes; the admin UI stays the same.
 */

import type { ID, SupportTicket, TicketPriority, TicketStatus } from "@/domain/types";

let counter = 1284;
const ref = () => `TKT-${String(counter++).padStart(6, "0")}`;

const NOW = Date.now();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

const MOCK: SupportTicket[] = [
  {
    id: "t_1",
    reference: ref(),
    subject: "Provider didn't show up",
    body: "Booked a plumber for 10am, no one arrived. Please refund.",
    status: "open",
    priority: "high",
    customerName: "Tasnim Akter",
    customerEmail: "tasnim@example.com",
    bookingId: "b_demo_1",
    assigneeId: null,
    createdAt: minutesAgo(15),
    updatedAt: minutesAgo(15),
  },
  {
    id: "t_2",
    reference: ref(),
    subject: "Wrong amount on invoice",
    body: "I was charged ৳2,499 instead of ৳1,899. Please correct it.",
    status: "pending",
    priority: "normal",
    customerName: "Imran Hossain",
    customerEmail: "imran@example.com",
    bookingId: "b_demo_2",
    assigneeId: "admin_1",
    createdAt: minutesAgo(60 * 4),
    updatedAt: minutesAgo(60),
  },
  {
    id: "t_3",
    reference: ref(),
    subject: "How do I become a provider?",
    body: "I run a small cleaning team in Mirpur. Please advise on onboarding.",
    status: "resolved",
    priority: "low",
    customerName: "Shafiq Ahmed",
    customerEmail: "shafiq@example.com",
    bookingId: null,
    assigneeId: "admin_1",
    createdAt: minutesAgo(60 * 24 * 2),
    updatedAt: minutesAgo(60 * 24),
  },
  {
    id: "t_4",
    reference: ref(),
    subject: "Urgent: gas leak after AC service",
    body: "Suspected gas leak after AC servicing yesterday. Need immediate help.",
    status: "open",
    priority: "urgent",
    customerName: "Nadia Rahman",
    customerEmail: "nadia@example.com",
    bookingId: "b_demo_3",
    assigneeId: null,
    createdAt: minutesAgo(8),
    updatedAt: minutesAgo(8),
  },
];

export type TicketFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  query?: string;
};

export const ticketsService = {
  list: async (filters: TicketFilters = {}): Promise<SupportTicket[]> => {
    let items = [...MOCK];
    if (filters.status) items = items.filter((t) => t.status === filters.status);
    if (filters.priority) items = items.filter((t) => t.priority === filters.priority);
    if (filters.query) {
      const q = filters.query.toLowerCase();
      items = items.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q),
      );
    }
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  get: async (id: ID): Promise<SupportTicket | null> =>
    MOCK.find((t) => t.id === id) ?? null,

  setStatus: async (id: ID, status: TicketStatus): Promise<void> => {
    const t = MOCK.find((x) => x.id === id);
    if (t) {
      t.status = status;
      t.updatedAt = new Date().toISOString();
    }
  },
};
