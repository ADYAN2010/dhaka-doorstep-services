/**
 * Categories / subcategories / services service.
 *
 * Source today: in-memory mock at `src/data/categories.ts`.
 * Source later: `categories` table + a `services` catalog table in Supabase.
 */

import type { Category, Service, Subcategory } from "@/domain/types";
import {
  categories as rawCategories,
  popularCategories as rawPopular,
  mainGroups as rawGroups,
  type Category as RawCategory,
  type Service as RawService,
  type Subcategory as RawSubcategory,
} from "@/data/categories";

/** Map the legacy mock Category → domain Category (drops the icon ref). */
function toCategory(c: RawCategory): Category {
  return {
    id: c.slug,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    iconName: c.icon.displayName ?? c.icon.name ?? "Sparkles",
    accentClass: c.accent,
    commissionRate: 15,
    popular: c.popular ?? false,
    isActive: true,
  };
}

function toSubcategory(categorySlug: string, s: RawSubcategory): Subcategory {
  return {
    id: `${categorySlug}/${s.slug}`,
    categorySlug,
    slug: s.slug,
    name: s.name,
  };
}

function toService(
  categorySlug: string,
  subcategorySlug: string,
  s: RawService,
): Service {
  return {
    id: `${categorySlug}/${subcategorySlug}/${s.slug}`,
    categorySlug,
    subcategorySlug,
    slug: s.slug,
    name: s.name,
    short: s.short,
    startingPrice: s.startingPrice,
    unit: s.unit,
    duration: s.duration,
  };
}

export const categoriesService = {
  /** All categories (in display order). */
  list: async (): Promise<Category[]> => rawCategories.map(toCategory),

  /** Popular categories (used on the home page). */
  popular: async (): Promise<Category[]> => rawPopular.map(toCategory),

  /** Curated groups (used in the mega-menu / footer). */
  groups: async () => rawGroups,

  /** Find one category by slug. */
  get: async (slug: string): Promise<Category | null> => {
    const c = rawCategories.find((x) => x.slug === slug);
    return c ? toCategory(c) : null;
  },

  /** All subcategories for a category. */
  subcategories: async (categorySlug: string): Promise<Subcategory[]> => {
    const c = rawCategories.find((x) => x.slug === categorySlug);
    return c ? c.subcategories.map((s) => toSubcategory(categorySlug, s)) : [];
  },

  /** All services across all subcategories of a category. */
  servicesIn: async (categorySlug: string): Promise<Service[]> => {
    const c = rawCategories.find((x) => x.slug === categorySlug);
    if (!c) return [];
    return c.subcategories.flatMap((sub) =>
      sub.services.map((s) => toService(categorySlug, sub.slug, s)),
    );
  },

  /** Find a single service by category + service slug. */
  findService: async (
    categorySlug: string,
    serviceSlug: string,
  ): Promise<{
    category: Category;
    subcategory: Subcategory;
    service: Service;
  } | null> => {
    const c = rawCategories.find((x) => x.slug === categorySlug);
    if (!c) return null;
    for (const sub of c.subcategories) {
      const s = sub.services.find((x) => x.slug === serviceSlug);
      if (s) {
        return {
          category: toCategory(c),
          subcategory: toSubcategory(categorySlug, sub),
          service: toService(categorySlug, sub.slug, s),
        };
      }
    }
    return null;
  },
};
