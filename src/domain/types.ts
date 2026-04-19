/**
 * Domain types — the canonical, UI-agnostic shape of every major entity.
 *
 * These types are the contract between the UI layer and the data/service
 * layer. Whether data comes from mocks, Supabase, or any other backend,
 * the UI only ever sees these shapes.
 *
 * Conventions
 *  - All ids are string (UUID-friendly).
 *  - All timestamps are ISO 8601 strings (`new Date().toISOString()`).
 *  - All money amounts are integers in BDT (smallest sensible unit = 1 taka).
 *  - All enums mirror the Supabase enums in `src/integrations/supabase/types.ts`
 *    so a future swap is a 1:1 mapping, not a refactor.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ──────────────────────────────────────────────────────────────────────────────

export type ID = string;
export type ISODateString = string;
export type CurrencyCode = "BDT";

export type Money = {
  amount: number;
  currency: CurrencyCode;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// ──────────────────────────────────────────────────────────────────────────────
// Roles & users
// ──────────────────────────────────────────────────────────────────────────────

export type AppRole = "customer" | "provider" | "admin";

export type ProviderApprovalStatus =
  | "not_applicable"
  | "pending"
  | "approved"
  | "rejected";

/** A row in the auth/profiles fusion. Always tied to an auth user. */
export type User = {
  id: ID;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  area: string | null;
  roles: AppRole[];
  providerStatus: ProviderApprovalStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

/** Customer = a User that has booked or can book. */
export type Customer = User & {
  totalBookings?: number;
  totalSpent?: Money;
  lastBookingAt?: ISODateString | null;
};

// ──────────────────────────────────────────────────────────────────────────────
// Catalog: categories → subcategories → services
// ──────────────────────────────────────────────────────────────────────────────

export type Category = {
  id: ID;
  slug: string;
  name: string;
  tagline: string;
  /** Lucide icon name (kept as string so this type stays UI-agnostic). */
  iconName: string;
  /** Tailwind utility class for icon tint background. */
  accentClass: string;
  /** Default platform commission rate (0–100 percent). */
  commissionRate: number;
  popular: boolean;
  isActive: boolean;
};

export type Subcategory = {
  id: ID;
  categorySlug: string;
  slug: string;
  name: string;
};

export type Service = {
  id: ID;
  categorySlug: string;
  subcategorySlug: string;
  slug: string;
  name: string;
  short: string;
  /** Starting price in BDT (integer). */
  startingPrice: number;
  /** "from", "per AC", "per hour", … */
  unit?: string;
  /** Human-readable duration estimate. */
  duration?: string;
};

// ──────────────────────────────────────────────────────────────────────────────
// Locations: city → area
// ──────────────────────────────────────────────────────────────────────────────

export type City = {
  id: ID;
  slug: string;
  name: string;
  country: string;
  /** True = booking enabled, false = waitlist. */
  isLive: boolean;
  tagline: string;
};

export type Area = {
  id: ID;
  citySlug: string;
  slug: string;
  name: string;
  zone: string;
  postal: string;
  blurb: string;
};

// ──────────────────────────────────────────────────────────────────────────────
// Providers
// ──────────────────────────────────────────────────────────────────────────────

export type ProviderType = "individual" | "agency";

export type ProviderAvailabilityWindow = {
  /** 0 = Sunday … 6 = Saturday (matches JS Date.getDay()). */
  weekday: number;
  /** "HH:MM" 24-hour. */
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type RatingBreakdown = {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
};

export type Provider = {
  id: ID;
  slug: string;
  /** Person/team name. */
  name: string;
  /** Optional brand name. */
  businessName?: string;
  type: ProviderType;
  initials: string;
  /** Primary category — providers may serve more than one. */
  categorySlug: string;
  categoryName: string;
  rating: number;
  reviews: number;
  jobsCompleted: number;
  responseTime: string;
  yearsExperience: number;
  /** Areas (slugs) the provider covers. */
  areas: string[];
  verified: boolean;
  topRated: boolean;
  bio: string;
  /** Display-only pricing label (e.g. "From ৳999 / AC"). */
  pricing: string;
  services: string[];
  gallery: string[];
  availability: ProviderAvailabilityWindow[];
  languages: string[];
  ratingBreakdown: RatingBreakdown[];
  approvalStatus: ProviderApprovalStatus;
};

export type ProviderApplication = {
  id: ID;
  userId: ID | null;
  fullName: string;
  email: string;
  phone: string;
  applicantType: ProviderType;
  category: string;
  experience: string;
  coverageArea: string;
  teamSize: string | null;
  availability: string | null;
  about: string | null;
  status: "new" | "reviewing" | "approved" | "rejected";
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

// ──────────────────────────────────────────────────────────────────────────────
// Bookings
// ──────────────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "new"
  | "confirmed"
  | "assigned"
  | "completed"
  | "cancelled";

export type Booking = {
  id: ID;
  userId: ID | null;
  providerId: ID | null;
  fullName: string;
  email: string | null;
  phone: string;
  category: string;
  service: string | null;
  area: string;
  address: string | null;
  preferredDate: ISODateString;
  preferredTimeSlot: string;
  budgetRange: string | null;
  notes: string | null;
  status: BookingStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

// ──────────────────────────────────────────────────────────────────────────────
// Payments, payouts, invoices
// ──────────────────────────────────────────────────────────────────────────────

export type PaymentMethod =
  | "cash"
  | "card"
  | "bkash"
  | "nagad"
  | "bank_transfer"
  | "other";

export type PaymentGateway =
  | "none"
  | "stripe"
  | "bkash"
  | "nagad"
  | "manual";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Payment = {
  id: ID;
  bookingId: ID;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  gateway: PaymentGateway;
  gatewayRef: string | null;
  status: PaymentStatus;
  notes: string | null;
  recordedBy: ID | null;
  createdAt: ISODateString;
};

export type InvoiceStatus = "draft" | "issued" | "paid" | "void";

export type Invoice = {
  id: ID;
  bookingId: ID;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: CurrencyCode;
  status: InvoiceStatus;
  pdfUrl: string | null;
  issuedAt: ISODateString | null;
  paidAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type PayoutMethod =
  | "bank_transfer"
  | "bkash"
  | "nagad"
  | "cash"
  | "other";

export type PayoutStatus = "pending" | "paid" | "failed";

export type Payout = {
  id: ID;
  providerId: ID;
  periodStart: ISODateString | null;
  periodEnd: ISODateString | null;
  totalNet: number;
  currency: CurrencyCode;
  method: PayoutMethod;
  reference: string | null;
  status: PayoutStatus;
  notes: string | null;
  paidAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type CommissionLedgerEntry = {
  id: ID;
  bookingId: ID;
  providerId: ID;
  customerId: ID | null;
  category: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  providerNet: number;
  currency: CurrencyCode;
  paidOut: boolean;
  payoutId: ID | null;
  createdAt: ISODateString;
};

// ──────────────────────────────────────────────────────────────────────────────
// Reviews
// ──────────────────────────────────────────────────────────────────────────────

export type Review = {
  id: ID;
  bookingId: ID;
  providerId: ID;
  userId: ID;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

// ──────────────────────────────────────────────────────────────────────────────
// Support tickets (admin support module — UI-only today)
// ──────────────────────────────────────────────────────────────────────────────

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportTicket = {
  id: ID;
  /** Public reference, e.g. "TKT-001284". */
  reference: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerName: string;
  customerEmail: string;
  /** Optional related booking. */
  bookingId: ID | null;
  /** Admin user assigned to the ticket. */
  assigneeId: ID | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

// ──────────────────────────────────────────────────────────────────────────────
// Notifications (UI-only today)
// ──────────────────────────────────────────────────────────────────────────────

export type NotificationKind =
  | "booking_update"
  | "message"
  | "payment"
  | "payout"
  | "system";

export type Notification = {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Internal route to navigate to when clicked. */
  href: string | null;
  readAt: ISODateString | null;
  createdAt: ISODateString;
};

// ──────────────────────────────────────────────────────────────────────────────
// Messaging
// ──────────────────────────────────────────────────────────────────────────────

export type MessageThread = {
  id: ID;
  bookingId: ID;
  customerId: ID;
  providerId: ID;
  customerUnreadCount: number;
  providerUnreadCount: number;
  lastMessageAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Message = {
  id: ID;
  threadId: ID;
  senderId: ID;
  body: string | null;
  imageUrl: string | null;
  readAt: ISODateString | null;
  createdAt: ISODateString;
};
