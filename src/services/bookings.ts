/**
 * Bookings service shim. Active routes call Supabase directly via
 * `supabase.from("bookings")`; this module is kept only so the
 * `@/services` barrel still exports `bookingsService` for legacy callers.
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

function notImplemented(method: string): never {
  throw new Error(
    `bookingsService.${method} is not available on this shim. Use supabase.from("bookings") directly.`,
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
    return notImplemented("create");
  },
  cancel: async (_id: ID): Promise<Booking> => {
    return notImplemented("cancel");
  },
};
