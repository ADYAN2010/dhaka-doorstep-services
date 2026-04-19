/**
 * Reviews service — wraps the Supabase `reviews` table into domain Reviews.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ID, Review } from "@/domain/types";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["reviews"]["Row"];

function toReview(r: Row): Review {
  return {
    id: r.id,
    bookingId: r.booking_id,
    providerId: r.provider_id,
    userId: r.user_id,
    rating: r.rating as Review["rating"],
    comment: r.comment,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const reviewsService = {
  forProvider: async (providerId: ID): Promise<Review[]> => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toReview);
  },

  create: async (input: {
    bookingId: ID;
    providerId: ID;
    userId: ID;
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string | null;
  }): Promise<Review> => {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        booking_id: input.bookingId,
        provider_id: input.providerId,
        user_id: input.userId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toReview(data);
  },
};
