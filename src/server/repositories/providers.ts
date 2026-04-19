import { bridgeCall } from "../bridge";
import type { ProviderRow } from "../types";

export const providersRepo = {
  list: (input: { limit?: number; offset?: number; status?: string } = {}) =>
    bridgeCall<ProviderRow[]>("providers.list", input),
};
