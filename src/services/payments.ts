/**
 * Payments / invoices / payouts / commission ledger — stubbed during the
 * MySQL migration. The old Supabase implementation has been removed; the
 * new Express backend will expose these endpoints in a follow-up pass.
 *
 * All read methods return empty arrays so the UI stays well-behaved; all
 * write methods throw a descriptive error.
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

function notMigrated(name: string): never {
  throw new Error(`${name} is being migrated to the new backend.`);
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
  }): Promise<Payment> => notMigrated("paymentsService.record"),
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
