import { bridgeCall } from "../bridge";
import type { AreaRow, CityRow } from "../types";

export const locationsRepo = {
  cities: () => bridgeCall<CityRow[]>("cities.list", {}),
  areas: (input: { cityId?: string } = {}) =>
    bridgeCall<AreaRow[]>("areas.list", input),
  upsertCity: (input: {
    id?: string;
    slug: string;
    name: string;
    country?: string;
    launchStatus?: "coming_soon" | "beta" | "live" | "paused";
    isActive?: boolean;
    displayOrder?: number;
  }) => bridgeCall<{ id: string }>("cities.upsert", input),
};
