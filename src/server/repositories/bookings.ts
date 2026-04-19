import { bridgeCall } from "../bridge";
import type { BookingRow } from "../types";

export const bookingsRepo = {
  list: (input: { limit?: number; offset?: number; status?: string } = {}) =>
    bridgeCall<BookingRow[]>("bookings.list", input),
};
