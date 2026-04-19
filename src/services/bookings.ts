/**
 * Bookings service — stubbed during the MySQL migration.
 *
 * The Supabase-backed implementation has been removed. Public booking
 * creation now lives at the Express endpoint (`POST /api/bookings`) and is
 * called directly via `@/lib/api-client`. This module is kept so the
 * `@/services` barrel still exports `bookingsService`; methods throw an
 * informative error if anything still tries to use them.
 */
import type { Booking, ID } from "@/domain/types";

export type CreateBookingInput = {
  fullName: string;
  email?: string | null;
  phone: string;
  category: string;
  service?: string | null;
  area: string;
  address?: string | null;
  preferredDate: string;
  preferredTimeSlot: string;
  budgetRange?: string | null;
  notes?: string | null;
  userId?: ID | null;
  providerId?: ID | null;
};

function notMigrated(method: string): never {
  throw new Error(
    `bookingsService.${method} is being migrated to the new backend.`,
  );
}

export const bookingsService = {
  listMine: async (): Promise<Booking[]> => {
    return [];
  },
  get: async (_id: ID): Promise<Booking | null> => {
    return null;
  },
  create: async (_input: CreateBookingInput): Promise<Booking> => {
    return notMigrated("create");
  },
  cancel: async (_id: ID): Promise<Booking> => {
    return notMigrated("cancel");
  },
};
