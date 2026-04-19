/**
 * Marketing & CMS service — mock for the admin growth & content area.
 *
 * Schema mirrors a future set of `cms_*` and `marketing_*` tables. The UI
 * never reads or writes Supabase directly — when those tables ship we only
 * change this file.
 */

export type ID = string;
const id = () => Math.random().toString(36).slice(2, 11);

/* ─────────────────────────── Homepage sections ────────────────────────── */

export type SectionKey =
  | "popularCategories"
  | "featuredServices"
  | "howItWorks"
  | "whyUs"
  | "featuredProviders"
  | "areas"
  | "testimonials"
  | "providerCta"
  | "finalCta";

export type HomepageSection = {
  id: ID;
  key: SectionKey;
  label: string;
  description: string;
  enabled: boolean;
  order: number;
};

const SECTIONS: HomepageSection[] = [
  { id: id(), key: "popularCategories", label: "Popular categories", description: "Top service categories grid", enabled: true, order: 0 },
  { id: id(), key: "featuredServices", label: "Featured services", description: "Most-booked services from catalog", enabled: true, order: 1 },
  { id: id(), key: "howItWorks", label: "How it works", description: "3-step explainer with icons", enabled: true, order: 2 },
  { id: id(), key: "whyUs", label: "Why choose us", description: "Trust badges and value props", enabled: true, order: 3 },
  { id: id(), key: "featuredProviders", label: "Featured providers", description: "Hand-picked partner spotlights", enabled: true, order: 4 },
  { id: id(), key: "areas", label: "Areas we cover", description: "Dhaka neighborhoods grid", enabled: true, order: 5 },
  { id: id(), key: "testimonials", label: "Testimonials", description: "Customer love quotes", enabled: true, order: 6 },
  { id: id(), key: "providerCta", label: "Become a provider CTA", description: "Funnel to provider signup", enabled: true, order: 7 },
  { id: id(), key: "finalCta", label: "Final CTA", description: "Bottom-of-page conversion bar", enabled: true, order: 8 },
];

/* ────────────────────────── Featured providers ────────────────────────── */

export type FeaturedProvider = {
  id: ID;
  providerId: ID;
  name: string;
  category: string;
  rating: number;
  jobs: number;
  area: string;
  pinned: boolean;
  order: number;
  startsAt: string;
  endsAt: string | null;
  avatarUrl?: string;
};

const FEATURED: FeaturedProvider[] = [
  { id: id(), providerId: "p_1", name: "Cool Breeze Services", category: "AC repair", rating: 4.9, jobs: 184, area: "Gulshan", pinned: true, order: 0, startsAt: "2026-04-01", endsAt: null, avatarUrl: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=120&h=120&fit=crop" },
  { id: id(), providerId: "p_2", name: "ShineHome Cleaning", category: "Home cleaning", rating: 4.8, jobs: 92, area: "Banani", pinned: false, order: 1, startsAt: "2026-04-01", endsAt: "2026-06-30", avatarUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&h=120&fit=crop" },
  { id: id(), providerId: "p_3", name: "Pro AC Care", category: "AC repair", rating: 4.7, jobs: 73, area: "Dhanmondi", pinned: false, order: 2, startsAt: "2026-03-15", endsAt: null },
  { id: id(), providerId: "p_4", name: "FlowFix Plumbing", category: "Plumbing", rating: 4.8, jobs: 56, area: "Mirpur", pinned: false, order: 3, startsAt: "2026-04-10", endsAt: null },
];

/* ────────────────────────── Banner campaigns ──────────────────────────── */

export type BannerVariant = "info" | "success" | "warning" | "brand";
export type BannerPlacement = "global" | "homepage" | "services" | "checkout";

export type BannerCampaign = {
  id: ID;
  name: string;
  headline: string;
  subtext?: string;
  cta?: string;
  href?: string;
  variant: BannerVariant;
  placement: BannerPlacement;
  enabled: boolean;
  startsAt: string;
  endsAt: string | null;
  /** Optional city filter. */
  cities: string[];
  impressions: number;
  clicks: number;
};

const BANNERS: BannerCampaign[] = [
  { id: id(), name: "Eid first-booking boost", headline: "Eid offer — 20% off first booking", subtext: "Use WELCOME20 at checkout", cta: "Book now", href: "/services", variant: "brand", placement: "global", enabled: true, startsAt: "2026-04-01", endsAt: "2026-05-15", cities: [], impressions: 84_220, clicks: 5_180 },
  { id: id(), name: "Provider recruitment", headline: "We're hiring trusted providers across Dhaka", subtext: "Join 500+ approved professionals", cta: "Apply", href: "/become-provider", variant: "info", placement: "homepage", enabled: true, startsAt: "2026-03-15", endsAt: null, cities: ["dhaka"], impressions: 32_400, clicks: 1_220 },
  { id: id(), name: "Gulshan AC blitz", headline: "Gulshan: same-day AC service", subtext: "Book by 2pm, technician by 6pm", cta: "Book AC", href: "/services/ac", variant: "warning", placement: "services", enabled: false, startsAt: "2026-04-12", endsAt: "2026-05-31", cities: ["dhaka"], impressions: 12_800, clicks: 940 },
];

/* ─────────────────────────────── FAQs ────────────────────────────────── */

export type FaqCategory = "general" | "booking" | "payment" | "providers" | "safety";

export type FaqEntry = {
  id: ID;
  question: string;
  answer: string;
  category: FaqCategory;
  order: number;
  published: boolean;
  updatedAt: string;
};

const FAQS: FaqEntry[] = [
  { id: id(), question: "How do I book a service?", answer: "Pick a category, choose a time slot, confirm your address — we'll match you with a verified provider in minutes.", category: "booking", order: 0, published: true, updatedAt: "2026-03-01T10:00:00Z" },
  { id: id(), question: "What payment methods do you accept?", answer: "bKash, Nagad, debit/credit card, and cash on completion.", category: "payment", order: 1, published: true, updatedAt: "2026-03-01T10:00:00Z" },
  { id: id(), question: "Are providers verified?", answer: "Yes — every provider goes through ID, address, and background checks before going live.", category: "providers", order: 2, published: true, updatedAt: "2026-03-01T10:00:00Z" },
  { id: id(), question: "What happens if I'm not happy with the service?", answer: "Open a ticket within 24 hours and our support team will arrange a fix or refund.", category: "general", order: 3, published: true, updatedAt: "2026-03-05T10:00:00Z" },
  { id: id(), question: "Is there a safety guarantee?", answer: "Every booking is covered by our service guarantee — including accidental damage protection.", category: "safety", order: 4, published: false, updatedAt: "2026-04-01T10:00:00Z" },
];

/* ──────────────────────── Blog categories ────────────────────────────── */

export type BlogCategory = {
  id: ID;
  name: string;
  slug: string;
  color: string;
  postCount: number;
  description?: string;
};

const BLOG_CATEGORIES: BlogCategory[] = [
  { id: id(), name: "Insights", slug: "insights", color: "primary", postCount: 8, description: "Industry insight & market reports" },
  { id: id(), name: "How-to", slug: "how-to", color: "emerald", postCount: 5, description: "Step-by-step guides for customers" },
  { id: id(), name: "Provider stories", slug: "provider-stories", color: "amber", postCount: 4, description: "Spotlight on our partners" },
  { id: id(), name: "Product updates", slug: "product-updates", color: "violet", postCount: 3, description: "What's new on Shebabd" },
];

/* ─────────────────────────── Coupons ─────────────────────────────────── */

export type CouponStatus = "active" | "paused" | "ended" | "scheduled";
export type CouponType = "percent" | "amount" | "freeService";

export type Coupon = {
  id: ID;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  uses: number;
  cap: number;
  status: CouponStatus;
  startsAt: string;
  endsAt: string;
  appliesTo: "all" | "first_booking" | "category" | "city";
  appliesValue?: string;
  minSpend?: number;
};

const COUPONS: Coupon[] = [
  { id: id(), code: "WELCOME20", description: "20% off your first booking", type: "percent", value: 20, uses: 412, cap: 1000, status: "active", startsAt: "2026-01-01", endsAt: "2026-12-31", appliesTo: "first_booking" },
  { id: id(), code: "EID2026", description: "৳200 off any service", type: "amount", value: 200, uses: 1842, cap: 2000, status: "active", startsAt: "2026-04-01", endsAt: "2026-04-30", appliesTo: "all", minSpend: 800 },
  { id: id(), code: "GULSHAN15", description: "15% off in Gulshan", type: "percent", value: 15, uses: 89, cap: 500, status: "active", startsAt: "2026-04-01", endsAt: "2026-06-30", appliesTo: "city", appliesValue: "Gulshan" },
  { id: id(), code: "AC10", description: "10% off all AC services", type: "percent", value: 10, uses: 220, cap: 220, status: "ended", startsAt: "2025-09-01", endsAt: "2025-09-30", appliesTo: "category", appliesValue: "AC repair" },
  { id: id(), code: "MONSOON", description: "Free service swap during monsoon", type: "freeService", value: 0, uses: 0, cap: 300, status: "scheduled", startsAt: "2026-06-01", endsAt: "2026-08-31", appliesTo: "all" },
];

/* ─────────────────────────── Referrals ───────────────────────────────── */

export type ReferralSettings = {
  enabled: boolean;
  referrerReward: number;
  refereeReward: number;
  rewardType: "credit" | "cash" | "discount";
  /** Referrer reward only triggers after referee completes this many bookings. */
  triggerThreshold: number;
  expiryDays: number;
  shareCopy: string;
};

let REFERRAL_SETTINGS: ReferralSettings = {
  enabled: true,
  referrerReward: 200,
  refereeReward: 150,
  rewardType: "credit",
  triggerThreshold: 1,
  expiryDays: 60,
  shareCopy: "Get ৳150 off your first Shebabd booking — use my link!",
};

/* ────────────────── Campaign performance / segments ──────────────────── */

export type CampaignPerf = {
  id: ID;
  name: string;
  channel: "email" | "sms" | "social" | "google" | "push";
  status: "live" | "paused" | "draft" | "ended";
  reach: number;
  engaged: number;
  converted: number;
  spend: number;
  /** Δ vs previous period in %. */
  trend: number;
};

const CAMPAIGNS: CampaignPerf[] = [
  { id: id(), name: "Eid cleaning rush", channel: "email", status: "live", reach: 12480, engaged: 1248, converted: 184, spend: 0, trend: 12 },
  { id: id(), name: "Gulshan AC service blast", channel: "sms", status: "live", reach: 3200, engaged: 412, converted: 89, spend: 4800, trend: 24 },
  { id: id(), name: "Provider recruitment Q2", channel: "google", status: "live", reach: 22000, engaged: 1840, converted: 47, spend: 28500, trend: -8 },
  { id: id(), name: "First-time customer 20% off", channel: "social", status: "paused", reach: 18400, engaged: 920, converted: 132, spend: 12000, trend: 0 },
  { id: id(), name: "Monsoon plumbing reminder", channel: "email", status: "draft", reach: 0, engaged: 0, converted: 0, spend: 0, trend: 0 },
];

/* ─────────────────────────── User segments ───────────────────────────── */

export type UserSegment = {
  id: ID;
  name: string;
  description: string;
  audience: number;
  filters: {
    city?: string;
    category?: string;
    lifecycle?: "new" | "active" | "lapsed" | "vip";
    minBookings?: number;
    minSpend?: number;
  };
};

const SEGMENTS: UserSegment[] = [
  { id: id(), name: "VIP customers", description: "10+ bookings, lifetime spend > ৳25k", audience: 184, filters: { lifecycle: "vip", minBookings: 10, minSpend: 25000 } },
  { id: id(), name: "Lapsed Gulshan", description: "Last booking > 60 days ago, in Gulshan", audience: 412, filters: { city: "Gulshan", lifecycle: "lapsed" } },
  { id: id(), name: "AC service seekers", description: "Booked AC repair in last 90 days", audience: 1_240, filters: { category: "AC repair", lifecycle: "active" } },
  { id: id(), name: "New signups (7d)", description: "Created account in last 7 days, 0 bookings", audience: 92, filters: { lifecycle: "new", minBookings: 0 } },
];

/* ───────────────────────── Public service API ────────────────────────── */

function reorder<T extends { id: ID; order: number }>(items: T[], fromId: ID, dir: "up" | "down"): T[] {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((x) => x.id === fromId);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= sorted.length) return sorted;
  [sorted[idx].order, sorted[swap].order] = [sorted[swap].order, sorted[idx].order];
  return [...sorted].sort((a, b) => a.order - b.order);
}

export const marketingService = {
  // Sections
  listSections: async (): Promise<HomepageSection[]> =>
    [...SECTIONS].sort((a, b) => a.order - b.order),
  toggleSection: async (id: ID): Promise<void> => {
    const s = SECTIONS.find((x) => x.id === id);
    if (s) s.enabled = !s.enabled;
  },
  moveSection: async (id: ID, dir: "up" | "down"): Promise<HomepageSection[]> => {
    const next = reorder(SECTIONS, id, dir);
    next.forEach((n, i) => {
      const target = SECTIONS.find((s) => s.id === n.id);
      if (target) target.order = i;
    });
    return [...SECTIONS].sort((a, b) => a.order - b.order);
  },

  // Featured providers
  listFeatured: async (): Promise<FeaturedProvider[]> =>
    [...FEATURED].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order),
  togglePinned: async (id: ID): Promise<void> => {
    const f = FEATURED.find((x) => x.id === id);
    if (f) f.pinned = !f.pinned;
  },
  removeFeatured: async (id: ID): Promise<void> => {
    const i = FEATURED.findIndex((x) => x.id === id);
    if (i >= 0) FEATURED.splice(i, 1);
  },
  addFeatured: async (input: Omit<FeaturedProvider, "id" | "order">): Promise<FeaturedProvider> => {
    const created: FeaturedProvider = { ...input, id: id(), order: FEATURED.length };
    FEATURED.push(created);
    return created;
  },

  // Banners
  listBanners: async (): Promise<BannerCampaign[]> => [...BANNERS],
  toggleBanner: async (id: ID): Promise<void> => {
    const b = BANNERS.find((x) => x.id === id);
    if (b) b.enabled = !b.enabled;
  },
  saveBanner: async (input: Omit<BannerCampaign, "id" | "impressions" | "clicks"> & { id?: ID }): Promise<BannerCampaign> => {
    if (input.id) {
      const existing = BANNERS.find((b) => b.id === input.id);
      if (existing) Object.assign(existing, input);
      return existing!;
    }
    const created: BannerCampaign = { ...input, id: id(), impressions: 0, clicks: 0 };
    BANNERS.unshift(created);
    return created;
  },
  removeBanner: async (id: ID): Promise<void> => {
    const i = BANNERS.findIndex((x) => x.id === id);
    if (i >= 0) BANNERS.splice(i, 1);
  },

  // FAQs
  listFaqs: async (): Promise<FaqEntry[]> => [...FAQS].sort((a, b) => a.order - b.order),
  saveFaq: async (input: Omit<FaqEntry, "id" | "updatedAt"> & { id?: ID }): Promise<FaqEntry> => {
    if (input.id) {
      const f = FAQS.find((x) => x.id === input.id);
      if (f) Object.assign(f, input, { updatedAt: new Date().toISOString() });
      return f!;
    }
    const created: FaqEntry = { ...input, id: id(), updatedAt: new Date().toISOString() };
    FAQS.push(created);
    return created;
  },
  removeFaq: async (id: ID): Promise<void> => {
    const i = FAQS.findIndex((x) => x.id === id);
    if (i >= 0) FAQS.splice(i, 1);
  },
  toggleFaq: async (id: ID): Promise<void> => {
    const f = FAQS.find((x) => x.id === id);
    if (f) {
      f.published = !f.published;
      f.updatedAt = new Date().toISOString();
    }
  },

  // Blog categories
  listBlogCategories: async (): Promise<BlogCategory[]> => [...BLOG_CATEGORIES],
  saveBlogCategory: async (input: Omit<BlogCategory, "id" | "postCount"> & { id?: ID }): Promise<BlogCategory> => {
    if (input.id) {
      const c = BLOG_CATEGORIES.find((x) => x.id === input.id);
      if (c) Object.assign(c, input);
      return c!;
    }
    const created: BlogCategory = { ...input, id: id(), postCount: 0 };
    BLOG_CATEGORIES.push(created);
    return created;
  },
  removeBlogCategory: async (id: ID): Promise<void> => {
    const i = BLOG_CATEGORIES.findIndex((x) => x.id === id);
    if (i >= 0) BLOG_CATEGORIES.splice(i, 1);
  },

  // Coupons
  listCoupons: async (): Promise<Coupon[]> => [...COUPONS],
  saveCoupon: async (input: Omit<Coupon, "id" | "uses"> & { id?: ID }): Promise<Coupon> => {
    if (input.id) {
      const c = COUPONS.find((x) => x.id === input.id);
      if (c) Object.assign(c, input);
      return c!;
    }
    const created: Coupon = { ...input, id: id(), uses: 0 };
    COUPONS.unshift(created);
    return created;
  },
  toggleCoupon: async (id: ID): Promise<void> => {
    const c = COUPONS.find((x) => x.id === id);
    if (c && c.status !== "ended") c.status = c.status === "active" ? "paused" : "active";
  },
  removeCoupon: async (id: ID): Promise<void> => {
    const i = COUPONS.findIndex((x) => x.id === id);
    if (i >= 0) COUPONS.splice(i, 1);
  },

  // Referral
  getReferralSettings: async (): Promise<ReferralSettings> => ({ ...REFERRAL_SETTINGS }),
  saveReferralSettings: async (next: ReferralSettings): Promise<void> => {
    REFERRAL_SETTINGS = { ...next };
  },

  // Campaigns + segments
  listCampaigns: async (): Promise<CampaignPerf[]> => [...CAMPAIGNS],
  listSegments: async (): Promise<UserSegment[]> => [...SEGMENTS],
};
