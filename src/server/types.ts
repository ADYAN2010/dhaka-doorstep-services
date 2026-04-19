/**
 * Domain types returned by the Hostinger bridge.
 * These mirror the column names in `hostinger/schema.sql` (snake_case)
 * and can be safely imported by both server and client code.
 */

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: "superadmin" | "admin" | "staff";
};

export type DashboardStats = {
  customers: number;
  providers: number;
  pendingProviders: number;
  bookings: number;
  newBookings: number;
  completedBookings: number;
  reviews: number;
  openTickets: number;
  categories: number;
  cities: number;
};

export type CustomerRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  area: string | null;
  is_active: number;
  created_at: string;
};

export type ProviderRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  primary_area: string | null;
  primary_category: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  rating: string;
  review_count: number;
  created_at: string;
};

export type BookingRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  category: string;
  service: string | null;
  area: string;
  address: string | null;
  preferred_date: string;
  preferred_time_slot: string;
  status: "new" | "confirmed" | "assigned" | "completed" | "cancelled";
  customer_id: string | null;
  provider_id: string | null;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  commission_rate: string;
  is_active: number;
  created_at: string;
};

export type ServiceRow = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  base_price: string | null;
  is_active: number;
  is_featured: number;
  is_seasonal: number;
  is_trending: number;
  display_order: number;
};

export type CityRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  launch_status: "coming_soon" | "beta" | "live" | "paused";
  is_active: number;
  display_order: number;
  launched_at: string | null;
};

export type AreaRow = {
  id: string;
  city_id: string;
  slug: string;
  name: string;
  is_active: number;
  display_order: number;
};

export type ReviewRow = {
  id: string;
  booking_id: string;
  customer_id: string | null;
  provider_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type TicketRow = {
  id: string;
  subject: string;
  requester_name: string;
  requester_email: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "pending" | "solved" | "closed";
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
};
