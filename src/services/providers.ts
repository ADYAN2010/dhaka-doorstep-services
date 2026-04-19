/**
 * Providers service.
 *
 * Source today: in-memory mock at `src/data/providers.ts` (also exposes a
 * Supabase-backed list/profile via existing routes — kept separate on purpose).
 * Source later: `profiles` + `provider_*` tables in Supabase, joined into the
 * Provider domain shape.
 */

import type { Provider, ProviderApprovalStatus } from "@/domain/types";
import {
  providers as rawProviders,
  featuredProviders as rawFeatured,
  type Provider as RawProvider,
} from "@/data/providers";

function toProvider(p: RawProvider): Provider {
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    businessName: p.businessName,
    type: p.type,
    initials: p.initials,
    categorySlug: p.categorySlug,
    categoryName: p.categoryName,
    rating: p.rating,
    reviews: p.reviews,
    jobsCompleted: p.jobsCompleted,
    responseTime: p.responseTime,
    yearsExperience: p.yearsExperience,
    areas: p.areas,
    verified: p.verified,
    topRated: p.topRated ?? false,
    bio: p.bio,
    pricing: p.pricing,
    services: p.services ?? [],
    gallery: p.gallery ?? [],
    availability:
      (p.availability ?? []).map((a, i) => ({
        weekday: i,
        startTime: "09:00",
        endTime: "18:00",
        isActive: a.hours !== "Closed",
      })) ?? [],
    languages: p.languages ?? ["Bangla"],
    ratingBreakdown: p.ratingBreakdown ?? [],
    approvalStatus: "approved" as ProviderApprovalStatus,
  };
}

export type ProviderListFilters = {
  categorySlug?: string;
  area?: string;
  query?: string;
  topRatedOnly?: boolean;
  verifiedOnly?: boolean;
  sort?: "rating" | "reviews" | "experience";
};

export const providersService = {
  list: async (filters: ProviderListFilters = {}): Promise<Provider[]> => {
    let items = rawProviders.map(toProvider);

    if (filters.categorySlug) {
      items = items.filter((p) => p.categorySlug === filters.categorySlug);
    }
    if (filters.area) {
      items = items.filter((p) => p.areas.includes(filters.area!));
    }
    if (filters.topRatedOnly) {
      items = items.filter((p) => p.topRated);
    }
    if (filters.verifiedOnly) {
      items = items.filter((p) => p.verified);
    }
    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.businessName?.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q),
      );
    }
    switch (filters.sort) {
      case "reviews":
        items.sort((a, b) => b.reviews - a.reviews);
        break;
      case "experience":
        items.sort((a, b) => b.yearsExperience - a.yearsExperience);
        break;
      case "rating":
      default:
        items.sort((a, b) => b.rating - a.rating);
    }
    return items;
  },

  featured: async (): Promise<Provider[]> => rawFeatured.map(toProvider),

  get: async (slug: string): Promise<Provider | null> => {
    const p = rawProviders.find((x) => x.slug === slug);
    return p ? toProvider(p) : null;
  },
};
