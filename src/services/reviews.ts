/**
 * Reviews service shim. Active routes read reviews directly from Supabase
 * (`reviews` table + `provider_review_stats` view). Kept here for legacy
 * callers; mutations throw.
 */
import type { ID, Review } from "@/domain/types";

export const reviewsService = {
  forProvider: async (_providerId: ID): Promise<Review[]> => {
    return [];
  },

  create: async (_input: {
    bookingId: ID;
    providerId: ID;
    userId: ID;
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string | null;
  }): Promise<Review> => {
    throw new Error("reviewsService.create is not available on this shim. Use supabase.from(\"reviews\") directly.");
  },
};
