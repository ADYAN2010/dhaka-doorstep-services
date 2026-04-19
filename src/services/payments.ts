/**
 * Payments / invoices / payouts / commission ledger shims. Active routes
 * read these tables directly from Supabase; these services are kept as
 * typed no-ops for any remaining legacy callers.
 */
import type {
  CommissionLedgerEntry,
  ID,
  Invoice,
  Payment,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  Payout,
} from "@/domain/types";

function notImplemented(name: string): never {
  throw new Error(`${name} is not available on this shim.`);
}

export const paymentsService = {
  forBooking: async (_bookingId: ID): Promise<Payment[]> => [],
  record: async (_input: {
    bookingId: ID;
    amount: number;
    method: PaymentMethod;
    gateway?: PaymentGateway;
    gatewayRef?: string;
    status?: PaymentStatus;
    notes?: string;
  }): Promise<Payment> => notImplemented("paymentsService.record"),
};

export const invoicesService = {
  forBooking: async (_bookingId: ID): Promise<Invoice[]> => [],
};

export const payoutsService = {
  forProvider: async (_providerId: ID): Promise<Payout[]> => [],
};

export const commissionLedgerService = {
  forProvider: async (_providerId: ID): Promise<CommissionLedgerEntry[]> => [],
};
