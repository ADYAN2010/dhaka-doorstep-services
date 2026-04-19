import { bridgeCall } from "../bridge";
import type { TicketRow } from "../types";

export const ticketsRepo = {
  list: (input: { limit?: number; offset?: number; status?: string } = {}) =>
    bridgeCall<TicketRow[]>("tickets.list", input),
};
