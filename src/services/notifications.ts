/**
 * Notifications service — UI-only mock for now.
 *
 * The shape mirrors what a real `notifications` table would return so the
 * UI never changes when we move from this in-memory list to Supabase.
 */

import type { ID, Notification } from "@/domain/types";

const MOCK: Notification[] = [
  {
    id: "n_1001",
    userId: "demo-user",
    kind: "booking_update",
    title: "Booking confirmed",
    body: "Cool Tech BD accepted your AC service for tomorrow 10am.",
    href: "/booking-status/demo-1",
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "n_1002",
    userId: "demo-user",
    kind: "message",
    title: "New message",
    body: "Rashed Hossain: 'I'll arrive in 20 minutes.'",
    href: "/messages",
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "n_1003",
    userId: "demo-user",
    kind: "payment",
    title: "Payment received",
    body: "৳1,899 paid via bKash for Booking #SB-1042.",
    href: "/invoices",
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

export const notificationsService = {
  forUser: async (_userId: ID): Promise<Notification[]> => [...MOCK],

  unreadCount: async (_userId: ID): Promise<number> =>
    MOCK.filter((n) => n.readAt == null).length,

  markRead: async (id: ID): Promise<void> => {
    const n = MOCK.find((x) => x.id === id);
    if (n) n.readAt = new Date().toISOString();
  },

  markAllRead: async (_userId: ID): Promise<void> => {
    const now = new Date().toISOString();
    for (const n of MOCK) if (!n.readAt) n.readAt = now;
  },
};
