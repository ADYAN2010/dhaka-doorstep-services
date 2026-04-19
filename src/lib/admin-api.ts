/**
 * Admin API client — talks to the Express backend (/api/*).
 *
 * Replaces the legacy TanStack server-functions/Hostinger-bridge layer for
 * admin console list pages. Every call goes through `@/lib/api-client`, which
 * sends the admin Bearer token from localStorage and surfaces typed errors.
 *
 * Endpoint shapes follow `backend/lib/crud-factory.js`:
 *   GET  /api/<resource>?q=&limit=&offset=  → { data, total, limit, offset }
 *   GET  /api/<resource>/:id                → { data }
 *   POST /api/<resource>                    → { data }
 *   PATCH/DELETE /api/<resource>/:id        → { data } / 204
 */
import { api } from "@/lib/api-client";

// ---------- Shared list response shape ----------

export type ListResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

export type ListQuery = {
  q?: string;
  limit?: number;
  offset?: number;
};

function listQuery(q: ListQuery = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {
    limit: q.limit ?? 100,
    offset: q.offset ?? 0,
  };
  if (q.q) out.q = q.q;
  return out;
}

// ---------- Customers ----------

export type AdminCustomer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  area: string | null;
  is_active: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

export const customersApi = {
  list: (q: ListQuery = {}) =>
    api<ListResponse<AdminCustomer>>("/api/customers", { query: listQuery(q) }),
  getOne: (id: string) =>
    api<{ data: AdminCustomer }>(`/api/customers/${encodeURIComponent(id)}`),
};

// ---------- Providers (admin variant — pass ?all=1 for non-approved) ----------

export type AdminProvider = {
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

export type AdminProviderListResponse = {
  data: AdminProvider[];
  total: number;
  page: number;
  pageSize: number;
};

export const providersAdminApi = {
  /** Admin list — set `all=true` to include non-approved providers. */
  list: (params: {
    q?: string;
    category?: string;
    area?: string;
    minRating?: number;
    sort?: "rating_desc" | "reviews_desc" | "jobs_desc" | "newest";
    page?: number;
    pageSize?: number;
    all?: boolean;
  } = {}) => {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 50,
    };
    if (params.q) query.q = params.q;
    if (params.category) query.category = params.category;
    if (params.area) query.area = params.area;
    if (params.minRating) query.minRating = params.minRating;
    if (params.sort) query.sort = params.sort;
    if (params.all) query.all = 1;
    return api<AdminProviderListResponse>("/api/providers", { query });
  },
};

// ---------- Categories ----------

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  commission_rate: number | string;
  is_active: 0 | 1 | boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export const categoriesApi = {
  list: (q: ListQuery = {}) =>
    api<ListResponse<AdminCategory>>("/api/categories", { query: listQuery(q) }),
};

// ---------- Cities ----------

export type AdminCity = {
  id: string;
  slug: string;
  name: string;
  country: string;
  launch_status: "live" | "beta" | "coming_soon" | "paused";
  is_active: 0 | 1 | boolean;
  display_order: number;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
};

export const citiesApi = {
  list: (q: ListQuery = {}) =>
    api<ListResponse<AdminCity>>("/api/cities", { query: listQuery(q) }),
};

// ---------- Areas ----------

export type AdminArea = {
  id: string;
  city_id: string;
  slug: string;
  name: string;
  is_active: 0 | 1 | boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export const areasApi = {
  list: (q: ListQuery = {}) =>
    api<ListResponse<AdminArea>>("/api/areas", { query: listQuery(q) }),
};

// ---------- Bookings ----------

export type BookingStatus = "new" | "confirmed" | "assigned" | "completed" | "cancelled";

export type AdminBooking = {
  id: string;
  customer_id: string | null;
  provider_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  category: string;
  service: string | null;
  area: string;
  address: string | null;
  preferred_date: string;
  preferred_time_slot: string;
  budget_range: string | null;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export const bookingsApi = {
  list: (q: ListQuery = {}) =>
    api<ListResponse<AdminBooking>>("/api/bookings", { query: listQuery(q) }),
};

// ---------- Contact messages ----------

export type AdminContactMessage = {
  id: string;
  customer_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  handled: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

export const contactMessagesApi = {
  list: (params: { limit?: number } = {}) =>
    api<{ data: AdminContactMessage[]; total: number; limit: number; offset: number }>(
      "/api/contact-messages",
      { query: { limit: params.limit ?? 100 } },
    ),
};

// ---------- Provider applications ----------

export type AdminProviderApplication = {
  id: string;
  customer_id: string | null;
  full_name: string;
  phone: string;
  email: string;
  applicant_type: string;
  category: string;
  experience: string;
  coverage_area: string;
  team_size: string | null;
  availability: string | null;
  about: string | null;
  status: "new" | "reviewing" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

export const providerApplicationsApi = {
  list: (params: { limit?: number } = {}) =>
    api<{ data: AdminProviderApplication[]; total: number; limit: number; offset: number }>(
      "/api/provider-applications",
      { query: { limit: params.limit ?? 100 } },
    ),
};

// ---------- Helpers ----------

export function asBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}
