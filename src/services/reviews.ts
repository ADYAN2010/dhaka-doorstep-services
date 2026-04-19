/**
 * Reviews service — stubbed during the MySQL migration.
 *
 * Returns empty data; mutations throw. Will be reimplemented against the
 * Express backend once a `/api/reviews` controller exists.
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
    throw new Error("Reviews are being migrated to the new backend.");
  },
};
