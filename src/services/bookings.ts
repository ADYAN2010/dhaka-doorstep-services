/**
 * Bookings service.
 *
 * Today this is a thin typed wrapper around the existing Supabase bookings
 * table — already real, but reshaped into the domain `Booking` so the UI
 * does not have to know about snake_case or enum strings.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Booking, BookingStatus, ID } from "@/domain/types";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["bookings"]["Row"];

function toBooking(r: Row): Booking {
  return {
    id: r.id,
    userId: r.user_id,
    providerId: r.provider_id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    category: r.category,
    service: r.service,
    area: r.area,
    address: r.address,
    preferredDate: r.preferred_date,
    preferredTimeSlot: r.preferred_time_slot,
    budgetRange: r.budget_range,
    notes: r.notes,
    status: r.status as BookingStatus,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

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

export const bookingsService = {
  /** All bookings the current user is allowed to see (RLS enforced). */
  listMine: async (): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toBooking);
  },

  get: async (id: ID): Promise<Booking | null> => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toBooking(data) : null;
  },

  create: async (input: CreateBookingInput): Promise<Booking> => {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        full_name: input.fullName,
        email: input.email ?? null,
        phone: input.phone,
        category: input.category,
        service: input.service ?? null,
        area: input.area,
        address: input.address ?? null,
        preferred_date: input.preferredDate,
        preferred_time_slot: input.preferredTimeSlot,
        budget_range: input.budgetRange ?? null,
        notes: input.notes ?? null,
        user_id: input.userId ?? null,
        provider_id: input.providerId ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toBooking(data);
  },

  cancel: async (id: ID): Promise<Booking> => {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toBooking(data);
  },
};
