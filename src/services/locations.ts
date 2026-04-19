/**
 * Locations service — cities and their areas.
 *
 * Source today: in-memory mocks at `src/data/cities.ts` and `src/data/areas.ts`.
 * Source later: `cities` and `areas` tables in Supabase.
 */

import type { Area, City } from "@/domain/types";
import {
  cities as rawCities,
  type City as RawCity,
} from "@/data/cities";
import {
  areas as rawAreas,
  type Area as RawArea,
} from "@/data/areas";

function toCity(c: RawCity): City {
  return {
    id: c.slug,
    slug: c.slug,
    name: c.name,
    country: c.country,
    isLive: c.live,
    tagline: c.tagline,
  };
}

function toArea(citySlug: string, a: RawArea): Area {
  return {
    id: a.slug,
    citySlug,
    slug: a.slug,
    name: a.name,
    zone: a.zone,
    postal: a.postal,
    blurb: a.blurb,
  };
}

export const locationsService = {
  cities: async (): Promise<City[]> => rawCities.map(toCity),

  liveCities: async (): Promise<City[]> =>
    rawCities.filter((c) => c.live).map(toCity),

  getCity: async (slug: string): Promise<City | null> => {
    const c = rawCities.find((x) => x.slug === slug);
    return c ? toCity(c) : null;
  },

  /** Today every area is in Dhaka — when more cities go live this filters by parent. */
  areasIn: async (citySlug: string = "dhaka"): Promise<Area[]> => {
    if (citySlug !== "dhaka") return [];
    return rawAreas.map((a) => toArea(citySlug, a));
  },

  getArea: async (slug: string): Promise<Area | null> => {
    const a = rawAreas.find((x) => x.slug === slug);
    return a ? toArea("dhaka", a) : null;
  },
};
