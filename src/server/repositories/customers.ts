import { bridgeCall } from "../bridge";
import type { CustomerRow } from "../types";

export const customersRepo = {
  list: (input: { limit?: number; offset?: number } = {}) =>
    bridgeCall<CustomerRow[]>("customers.list", input),
};
