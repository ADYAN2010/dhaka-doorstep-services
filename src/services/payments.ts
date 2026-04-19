/**
 * Payments, invoices, payouts, commission ledger.
 *
 * All four wrap their Supabase tables and return domain shapes. Mutations
 * use the existing security-definer RPCs (record_booking_payment,
 * admin_create_payout, …) so RLS is honoured.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  CommissionLedgerEntry,
  ID,
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  Payout,
  PayoutMethod,
  PayoutStatus,
} from "@/domain/types";
import type { Database } from "@/integrations/supabase/types";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type PayoutRow = Database["public"]["Tables"]["payouts"]["Row"];
type LedgerRow = Database["public"]["Tables"]["commission_ledger"]["Row"];

function toPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    bookingId: r.booking_id,
    amount: Number(r.amount),
    currency: r.currency as Payment["currency"],
    method: r.method as PaymentMethod,
    gateway: r.gateway as PaymentGateway,
    gatewayRef: r.gateway_ref,
    status: r.status as PaymentStatus,
    notes: r.notes,
    recordedBy: r.recorded_by,
    createdAt: r.created_at,
  };
}

function toInvoice(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    bookingId: r.booking_id,
    invoiceNumber: r.invoice_number,
    subtotal: Number(r.subtotal),
    tax: Number(r.tax),
    total: Number(r.total),
    currency: r.currency as Invoice["currency"],
    status: r.status as InvoiceStatus,
    pdfUrl: r.pdf_url,
    issuedAt: r.issued_at,
    paidAt: r.paid_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toPayout(r: PayoutRow): Payout {
  return {
    id: r.id,
    providerId: r.provider_id,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    totalNet: Number(r.total_net),
    currency: r.currency as Payout["currency"],
    method: r.method as PayoutMethod,
    reference: r.reference,
    status: r.status as PayoutStatus,
    notes: r.notes,
    paidAt: r.paid_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toLedger(r: LedgerRow): CommissionLedgerEntry {
  return {
    id: r.id,
    bookingId: r.booking_id,
    providerId: r.provider_id,
    customerId: r.customer_id,
    category: r.category,
    grossAmount: Number(r.gross_amount),
    commissionRate: Number(r.commission_rate),
    commissionAmount: Number(r.commission_amount),
    providerNet: Number(r.provider_net),
    currency: r.currency as CommissionLedgerEntry["currency"],
    paidOut: r.paid_out,
    payoutId: r.payout_id,
    createdAt: r.created_at,
  };
}

export const paymentsService = {
  forBooking: async (bookingId: ID): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toPayment);
  },

  record: async (input: {
    bookingId: ID;
    amount: number;
    method: PaymentMethod;
    gateway?: PaymentGateway;
    gatewayRef?: string;
    status?: PaymentStatus;
    notes?: string;
  }): Promise<Payment> => {
    const { data, error } = await supabase.rpc("record_booking_payment", {
      _booking_id: input.bookingId,
      _amount: input.amount,
      _method: input.method,
      _gateway: input.gateway,
      _gateway_ref: input.gatewayRef,
      _status: input.status,
      _notes: input.notes,
    });
    if (error) throw error;
    return toPayment(data as PaymentRow);
  },
};

export const invoicesService = {
  forBooking: async (bookingId: ID): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toInvoice);
  },
};

export const payoutsService = {
  forProvider: async (providerId: ID): Promise<Payout[]> => {
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toPayout);
  },
};

export const commissionLedgerService = {
  forProvider: async (providerId: ID): Promise<CommissionLedgerEntry[]> => {
    const { data, error } = await supabase
      .from("commission_ledger")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toLedger);
  },
};
