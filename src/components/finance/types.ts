// Shared finance types used across admin + provider finance UIs.
// Kept intentionally light — backed by Supabase rows where possible,
// and by mock structures (refund requests) until tables exist.

export type Money = { amount: number; currency: string };

export type FinanceTransaction = {
  id: string;
  bookingId: string;
  date: string; // ISO
  customer?: string | null;
  provider?: string | null;
  category?: string | null;
  area?: string | null;
  method: string;
  gateway: string;
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
  reference?: string | null;
};

export type LedgerLite = {
  id: string;
  providerId: string;
  category: string;
  gross: number;
  commission: number;
  net: number;
  paidOut: boolean;
  payoutId: string | null;
  createdAt: string;
};

export type PayoutLite = {
  id: string;
  providerId: string;
  total: number;
  currency: string;
  method: string;
  reference: string | null;
  status: "pending" | "paid" | "failed";
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  notes?: string | null;
};

export type RefundRequest = {
  id: string;
  bookingId: string;
  customer: string;
  amount: number;
  currency: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  decidedAt?: string | null;
};

export type FinanceFilters = {
  from?: string; // ISO date
  to?: string;   // ISO date
  providerId?: string;
  category?: string;
  status?: string;
};
