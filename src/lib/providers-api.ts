/**
 * Public providers + reviews + saved-providers client.
 *
 * Talks to the Express backend via @/lib/api-client. All endpoints here are
 * what /providers, /p/$id and the saved-heart button consume.
 */
import { api } from "@/lib/api-client";

export type ApiProviderListItem = {
  id: string;
  slug: string | null;
  full_name: string;
  business_name: string | null;
  provider_type: "individual" | "agency";
  primary_area: string | null;
  primary_category: string | null;
  avatar_url: string | null;
  bio: string | null;
  pricing_label: string | null;
  response_time: string | null;
  years_experience: number;
  jobs_completed: number;
  languages: string[];
  gallery: string[];
  is_verified: boolean;
  is_top_rated: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  categories: string[];
  areas: string[];
};

export type ApiAvailabilitySlot = {
  weekday: number; // 0=Sun … 6=Sat
  start_time: string; // "09:00"
  end_time: string; // "18:00"
  is_active: boolean;
};

export type ApiReview = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
  customer_name: string;
};

export type ApiProviderDetail = ApiProviderListItem & {
  status: string;
  availability: ApiAvailabilitySlot[];
  review_stats: {
    count: number;
    avg_rating: number;
    breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
  };
  recent_reviews: ApiReview[];
};

export type ListProvidersParams = {
  q?: string;
  category?: string;
  area?: string;
  minRating?: number;
  sort?: "rating_desc" | "reviews_desc" | "jobs_desc" | "newest";
  page?: number;
  pageSize?: number;
};

export type ListProvidersResponse = {
  data: ApiProviderListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const providersApi = {
  list: (params: ListProvidersParams = {}) =>
    api<ListProvidersResponse>("/api/providers", { query: params as Record<string, string | number> }),

  getBySlug: (slug: string) =>
    api<{ data: ApiProviderDetail }>(`/api/providers/by-slug/${encodeURIComponent(slug)}`).then(
      (r) => r.data,
    ),

  getById: (id: string) =>
    api<{ data: ApiProviderDetail }>(`/api/providers/${encodeURIComponent(id)}`).then(
      (r) => r.data,
    ),
};

// ---------- Reviews ----------

export const reviewsApi = {
  forProvider: (providerId: string, opts: { limit?: number; offset?: number } = {}) =>
    api<{ data: ApiReview[]; total: number }>(`/api/reviews/providers/${providerId}`, {
      query: opts,
    }),

  upsert: (input: { provider_id: string; rating: 1 | 2 | 3 | 4 | 5; comment?: string }) =>
    api<{ data: ApiReview }>("/api/reviews", { method: "POST", body: input }),

  remove: (id: string) =>
    api<void>(`/api/reviews/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// ---------- Saved providers ----------

export const savedProvidersApi = {
  listIds: () => api<{ data: string[] }>("/api/saved-providers/ids"),
  list: () =>
    api<{ data: Array<ApiProviderListItem & { saved_at: string }> }>("/api/saved-providers"),
  save: (providerId: string) =>
    api<{ ok: true }>("/api/saved-providers", {
      method: "POST",
      body: { provider_id: providerId },
    }),
  unsave: (providerId: string) =>
    api<void>(`/api/saved-providers/${encodeURIComponent(providerId)}`, { method: "DELETE" }),
};
