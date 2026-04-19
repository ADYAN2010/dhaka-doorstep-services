import { bridgeCall } from "../bridge";
import type { ReviewRow } from "../types";

export const reviewsRepo = {
  list: (input: { limit?: number; offset?: number } = {}) =>
    bridgeCall<ReviewRow[]>("reviews.list", input),
};
