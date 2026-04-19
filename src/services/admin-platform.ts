/**
 * Admin Platform Service — typed mock data layer for the admin operating system.
 *
 * Each domain (popups, navigation, KYC, customer tags, ops rules, integrations…)
 * gets a strongly typed model + an in-memory store seeded with realistic data,
 * with optional localStorage persistence for write operations. When real DB
 * tables ship, only this file changes — no UI rewrites required.
 */

const isBrowser = typeof window !== "undefined";

const id = () => Math.random().toString(36).slice(2, 11);
const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400_000).toISOString();

function persisted<T>(key: string, seed: T[]): T[] {
  if (!isBrowser) return [...seed];
  try {
    const raw = window.localStorage.getItem(`adm:${key}`);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    /* ignore */
  }
  return [...seed];
}
function save<T>(key: string, items: T[]): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(`adm:${key}`, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}
function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

/* ═══════════════════════════════════════════════════════════
 * SITE CONFIG (announcement bar, maintenance, coming-soon)
 * ═══════════════════════════════════════════════════════ */

export type SiteFlags = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  comingSoonMode: boolean;
  comingSoonMessage: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  announcementVariant: "info" | "promo" | "warning";
};

let siteFlags: SiteFlags = {
  maintenanceMode: false,
  maintenanceMessage: "We'll be back shortly. Thanks for your patience.",
  comingSoonMode: false,
  comingSoonMessage: "Launching soon in your city — sign up to be notified.",
  announcementEnabled: true,
  announcementText: "🎉 Eid special — 20% off cleaning bookings this week!",
  announcementLink: "/services/cleaning",
  announcementVariant: "promo",
};
if (isBrowser) {
  try {
    const raw = window.localStorage.getItem("adm:siteFlags");
    if (raw) siteFlags = { ...siteFlags, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export const siteFlagsService = {
  async get(): Promise<SiteFlags> {
    return delay(siteFlags);
  },
  async update(patch: Partial<SiteFlags>): Promise<SiteFlags> {
    siteFlags = { ...siteFlags, ...patch };
    if (isBrowser) window.localStorage.setItem("adm:siteFlags", JSON.stringify(siteFlags));
    return delay(siteFlags);
  },
};

/* ═══════════════════════════════════════════════════════════
 * NAVIGATION & FOOTER
 * ═══════════════════════════════════════════════════════ */

export type NavLink = { id: string; label: string; href: string; order: number };

const navSeed: NavLink[] = [
  { id: id(), label: "Services", href: "/services", order: 0 },
  { id: id(), label: "How it works", href: "/how-it-works", order: 1 },
  { id: id(), label: "Pricing", href: "/pricing", order: 2 },
  { id: id(), label: "Become a provider", href: "/become-provider", order: 3 },
  { id: id(), label: "Blog", href: "/blog", order: 4 },
  { id: id(), label: "About", href: "/about", order: 5 },
];
const footerSeed: NavLink[] = [
  { id: id(), label: "About", href: "/about", order: 0 },
  { id: id(), label: "Contact", href: "/contact", order: 1 },
  { id: id(), label: "FAQ", href: "/faq", order: 2 },
  { id: id(), label: "Privacy", href: "/privacy", order: 3 },
  { id: id(), label: "Terms", href: "/terms", order: 4 },
  { id: id(), label: "Trust & safety", href: "/trust-safety", order: 5 },
];

let headerNav = persisted("headerNav", navSeed);
let footerNav = persisted("footerNav", footerSeed);

export const navigationService = {
  async listHeader() {
    return delay([...headerNav].sort((a, b) => a.order - b.order));
  },
  async listFooter() {
    return delay([...footerNav].sort((a, b) => a.order - b.order));
  },
  async upsertHeader(items: NavLink[]) {
    headerNav = items;
    save("headerNav", headerNav);
    return delay(items);
  },
  async upsertFooter(items: NavLink[]) {
    footerNav = items;
    save("footerNav", footerNav);
    return delay(items);
  },
};

/* ═══════════════════════════════════════════════════════════
 * POPUPS
 * ═══════════════════════════════════════════════════════ */

export type Popup = {
  id: string;
  name: string;
  triggerType: "page_load" | "exit_intent" | "scroll_50" | "time_15s";
  targetPage: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  showOncePerSession: boolean;
  views: number;
  conversions: number;
  createdAt: string;
};

const popupSeed: Popup[] = [
  {
    id: id(),
    name: "First booking discount",
    triggerType: "exit_intent",
    targetPage: "/",
    headline: "Wait — get 20% off your first booking",
    body: "Use code WELCOME20 at checkout. Limited time offer.",
    ctaLabel: "Claim discount",
    ctaHref: "/services",
    isActive: true,
    showOncePerSession: true,
    views: 8420,
    conversions: 312,
    createdAt: daysAgo(45),
  },
  {
    id: id(),
    name: "Provider recruitment",
    triggerType: "scroll_50",
    targetPage: "/become-provider",
    headline: "Earn Tk 30,000+ per month",
    body: "Join 850+ verified providers across Dhaka.",
    ctaLabel: "Apply now",
    ctaHref: "/become-provider",
    isActive: true,
    showOncePerSession: true,
    views: 1420,
    conversions: 84,
    createdAt: daysAgo(20),
  },
  {
    id: id(),
    name: "Newsletter signup",
    triggerType: "time_15s",
    targetPage: "/blog",
    headline: "Weekly home-care tips",
    body: "Subscribe for seasonal advice and exclusive deals.",
    ctaLabel: "Subscribe",
    ctaHref: "#",
    isActive: false,
    showOncePerSession: true,
    views: 0,
    conversions: 0,
    createdAt: daysAgo(8),
  },
];
let popups = persisted("popups", popupSeed);

export const popupsService = {
  async list() {
    return delay([...popups].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  },
  async create(input: Omit<Popup, "id" | "createdAt" | "views" | "conversions">) {
    const item: Popup = { ...input, id: id(), createdAt: now(), views: 0, conversions: 0 };
    popups = [item, ...popups];
    save("popups", popups);
    return delay(item);
  },
  async update(itemId: string, patch: Partial<Popup>) {
    popups = popups.map((p) => (p.id === itemId ? { ...p, ...patch } : p));
    save("popups", popups);
    return delay(popups.find((p) => p.id === itemId)!);
  },
  async remove(itemId: string) {
    popups = popups.filter((p) => p.id !== itemId);
    save("popups", popups);
    return delay(true);
  },
};

/* ═══════════════════════════════════════════════════════════
 * KYC / Provider verification queue
 * ═══════════════════════════════════════════════════════ */

export type KycStatus = "pending" | "in_review" | "approved" | "rejected";
export type KycRecord = {
  id: string;
  providerId: string;
  providerName: string;
  category: string;
  documentType: "nid" | "trade_license" | "passport" | "utility_bill";
  documentNumber: string;
  documentUrl: string;
  status: KycStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
};

const kycSeed: KycRecord[] = [
  { id: id(), providerId: "p-1001", providerName: "Rahim Hossain", category: "Cleaning", documentType: "nid", documentNumber: "1990 5234 8765 4321", documentUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400", status: "pending", submittedAt: daysAgo(2) },
  { id: id(), providerId: "p-1002", providerName: "Karim Electric Co.", category: "Electrical", documentType: "trade_license", documentNumber: "TL-DHK-2024-08821", documentUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400", status: "in_review", submittedAt: daysAgo(4) },
  { id: id(), providerId: "p-1003", providerName: "Salma Begum", category: "Beauty", documentType: "nid", documentNumber: "1985 6234 1100 9876", documentUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400", status: "approved", submittedAt: daysAgo(15), reviewedAt: daysAgo(13), reviewerNote: "Verified against govt registry." },
  { id: id(), providerId: "p-1004", providerName: "Faisal Plumbing", category: "Plumbing", documentType: "trade_license", documentNumber: "TL-DHK-2023-17264", documentUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400", status: "rejected", submittedAt: daysAgo(20), reviewedAt: daysAgo(18), reviewerNote: "License expired — please re-submit." },
  { id: id(), providerId: "p-1005", providerName: "Nasir AC Service", category: "AC Service", documentType: "trade_license", documentNumber: "TL-DHK-2024-09988", documentUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400", status: "pending", submittedAt: daysAgo(1) },
];
let kyc = persisted("kyc", kycSeed);

export const kycService = {
  async list(filter?: KycStatus) {
    const items = filter ? kyc.filter((k) => k.status === filter) : kyc;
    return delay([...items].sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt)));
  },
  async setStatus(itemId: string, status: KycStatus, reviewerNote?: string) {
    kyc = kyc.map((k) =>
      k.id === itemId ? { ...k, status, reviewedAt: now(), reviewerNote: reviewerNote ?? k.reviewerNote } : k,
    );
    save("kyc", kyc);
    return delay(kyc.find((k) => k.id === itemId)!);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Provider quality, contracts, subscription plans, blacklist
 * ═══════════════════════════════════════════════════════ */

export type SubscriptionPlan = "free" | "basic" | "pro" | "enterprise";
export type ContractStatus = "draft" | "signed" | "expired" | "terminated";
export type ProviderProfileExt = {
  providerId: string;
  providerName: string;
  category: string;
  qualityScore: number; // 0-100
  warnings: number;
  blacklisted: boolean;
  blacklistReason?: string;
  subscription: SubscriptionPlan;
  contractStatus: ContractStatus;
  contractExpiresAt?: string;
  leadPriority: "low" | "normal" | "high";
};

const provExtSeed: ProviderProfileExt[] = [
  { providerId: "p-1001", providerName: "Rahim Hossain", category: "Cleaning", qualityScore: 92, warnings: 0, blacklisted: false, subscription: "pro", contractStatus: "signed", contractExpiresAt: daysAhead(180), leadPriority: "high" },
  { providerId: "p-1002", providerName: "Karim Electric Co.", category: "Electrical", qualityScore: 78, warnings: 1, blacklisted: false, subscription: "basic", contractStatus: "signed", contractExpiresAt: daysAhead(60), leadPriority: "normal" },
  { providerId: "p-1003", providerName: "Salma Begum", category: "Beauty", qualityScore: 88, warnings: 0, blacklisted: false, subscription: "free", contractStatus: "signed", contractExpiresAt: daysAhead(300), leadPriority: "normal" },
  { providerId: "p-1004", providerName: "Faisal Plumbing", category: "Plumbing", qualityScore: 42, warnings: 3, blacklisted: true, blacklistReason: "Multiple no-shows and customer complaints", subscription: "free", contractStatus: "terminated", leadPriority: "low" },
  { providerId: "p-1005", providerName: "Nasir AC Service", category: "AC Service", qualityScore: 95, warnings: 0, blacklisted: false, subscription: "enterprise", contractStatus: "signed", contractExpiresAt: daysAhead(365), leadPriority: "high" },
];
let provExt = persisted("provExt", provExtSeed);

export const providerExtService = {
  async list() {
    return delay([...provExt].sort((a, b) => b.qualityScore - a.qualityScore));
  },
  async update(providerId: string, patch: Partial<ProviderProfileExt>) {
    provExt = provExt.map((p) => (p.providerId === providerId ? { ...p, ...patch } : p));
    save("provExt", provExt);
    return delay(provExt.find((p) => p.providerId === providerId)!);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Customer tags, segments, risk
 * ═══════════════════════════════════════════════════════ */

export type CustomerTag = "vip" | "new" | "returning" | "at_risk" | "blocked" | "loyalty_gold" | "loyalty_silver";
export type CustomerProfileExt = {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  tags: CustomerTag[];
  marketingConsent: boolean;
  loyaltyPoints: number;
  walletBalance: number;
  referrals: number;
  riskFlag: "none" | "review" | "blocked";
  totalBookings: number;
  totalSpend: number;
  lastBookingAt?: string;
};

const custExtSeed: CustomerProfileExt[] = [
  { customerId: "c-2001", customerName: "Ayesha Rahman", email: "ayesha@example.com", phone: "+8801712345678", tags: ["vip", "loyalty_gold"], marketingConsent: true, loyaltyPoints: 1240, walletBalance: 350, referrals: 8, riskFlag: "none", totalBookings: 24, totalSpend: 48500, lastBookingAt: daysAgo(3) },
  { customerId: "c-2002", customerName: "Mohammad Ali", email: "ali@example.com", phone: "+8801812345679", tags: ["returning", "loyalty_silver"], marketingConsent: true, loyaltyPoints: 480, walletBalance: 0, referrals: 2, riskFlag: "none", totalBookings: 9, totalSpend: 14200, lastBookingAt: daysAgo(12) },
  { customerId: "c-2003", customerName: "Sumi Akter", email: "sumi@example.com", phone: "+8801912345680", tags: ["new"], marketingConsent: false, loyaltyPoints: 50, walletBalance: 100, referrals: 0, riskFlag: "none", totalBookings: 1, totalSpend: 1200, lastBookingAt: daysAgo(2) },
  { customerId: "c-2004", customerName: "Tanvir Hasan", email: "tanvir@example.com", phone: "+8801612345681", tags: ["at_risk"], marketingConsent: true, loyaltyPoints: 120, walletBalance: 0, referrals: 0, riskFlag: "review", totalBookings: 4, totalSpend: 6800, lastBookingAt: daysAgo(95) },
  { customerId: "c-2005", customerName: "Riyad Khan", email: "riyad@example.com", phone: "+8801512345682", tags: ["blocked"], marketingConsent: false, loyaltyPoints: 0, walletBalance: 0, referrals: 0, riskFlag: "blocked", totalBookings: 2, totalSpend: 1500, lastBookingAt: daysAgo(180) },
];
let custExt = persisted("custExt", custExtSeed);

export const customerExtService = {
  async list() {
    return delay([...custExt].sort((a, b) => b.totalSpend - a.totalSpend));
  },
  async update(customerId: string, patch: Partial<CustomerProfileExt>) {
    custExt = custExt.map((c) => (c.customerId === customerId ? { ...c, ...patch } : c));
    save("custExt", custExt);
    return delay(custExt.find((c) => c.customerId === customerId)!);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Operations rules (booking, cancellation, refund, SLA)
 * ═══════════════════════════════════════════════════════ */

export type OpsRules = {
  autoAssign: boolean;
  autoAssignRadiusKm: number;
  autoAssignTimeoutMin: number;
  reassignOnRefuse: boolean;
  cancellationFreeWindowHours: number;
  cancellationFeePercent: number;
  refundPolicy: "full" | "partial" | "none";
  partialRefundPercent: number;
  emergencyBookingsEnabled: boolean;
  emergencySurchargePercent: number;
  defaultSlaHours: number;
  noShowGracePeriodMin: number;
  internalOpsNotesEnabled: boolean;
};

let opsRules: OpsRules = {
  autoAssign: true,
  autoAssignRadiusKm: 5,
  autoAssignTimeoutMin: 15,
  reassignOnRefuse: true,
  cancellationFreeWindowHours: 24,
  cancellationFeePercent: 10,
  refundPolicy: "partial",
  partialRefundPercent: 50,
  emergencyBookingsEnabled: true,
  emergencySurchargePercent: 25,
  defaultSlaHours: 4,
  noShowGracePeriodMin: 15,
  internalOpsNotesEnabled: true,
};
if (isBrowser) {
  try {
    const raw = window.localStorage.getItem("adm:opsRules");
    if (raw) opsRules = { ...opsRules, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export const opsRulesService = {
  async get() {
    return delay(opsRules);
  },
  async update(patch: Partial<OpsRules>) {
    opsRules = { ...opsRules, ...patch };
    if (isBrowser) window.localStorage.setItem("adm:opsRules", JSON.stringify(opsRules));
    return delay(opsRules);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Finance rules
 * ═══════════════════════════════════════════════════════ */

export type FinanceRules = {
  defaultCommissionPercent: number;
  convenienceFeeAmount: number;
  emergencyFeeAmount: number;
  taxRatePercent: number;
  taxLabel: string;
  invoicePrefix: string;
  invoiceFooterNote: string;
  payoutFrequency: "daily" | "weekly" | "biweekly" | "monthly";
  payoutMinAmount: number;
  payoutAutoApprove: boolean;
  walletEnabled: boolean;
  referralRewardAmount: number;
  referralRewardType: "fixed" | "percent";
};

let financeRules: FinanceRules = {
  defaultCommissionPercent: 15,
  convenienceFeeAmount: 30,
  emergencyFeeAmount: 200,
  taxRatePercent: 5,
  taxLabel: "VAT",
  invoicePrefix: "INV-",
  invoiceFooterNote: "Thank you for choosing ServiceHub. For queries, contact billing@servicehub.bd",
  payoutFrequency: "weekly",
  payoutMinAmount: 500,
  payoutAutoApprove: false,
  walletEnabled: true,
  referralRewardAmount: 200,
  referralRewardType: "fixed",
};
if (isBrowser) {
  try {
    const raw = window.localStorage.getItem("adm:financeRules");
    if (raw) financeRules = { ...financeRules, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export const financeRulesService = {
  async get() {
    return delay(financeRules);
  },
  async update(patch: Partial<FinanceRules>) {
    financeRules = { ...financeRules, ...patch };
    if (isBrowser) window.localStorage.setItem("adm:financeRules", JSON.stringify(financeRules));
    return delay(financeRules);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Disputes & abuse reports
 * ═══════════════════════════════════════════════════════ */

export type DisputeStatus = "open" | "investigating" | "resolved" | "rejected";
export type Dispute = {
  id: string;
  bookingId: string;
  customerName: string;
  providerName: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  amount: number;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
};

const disputeSeed: Dispute[] = [
  { id: id(), bookingId: "BK-8421", customerName: "Ayesha Rahman", providerName: "Rahim Hossain", reason: "Service not completed", description: "Provider left after 30min citing equipment issue. Job not finished.", status: "investigating", amount: 1500, createdAt: daysAgo(2) },
  { id: id(), bookingId: "BK-8398", customerName: "Mohammad Ali", providerName: "Karim Electric Co.", reason: "Overcharged", description: "Quoted 800, charged 1500 with no explanation.", status: "open", amount: 700, createdAt: daysAgo(1) },
  { id: id(), bookingId: "BK-8201", customerName: "Sumi Akter", providerName: "Faisal Plumbing", reason: "No-show", description: "Provider never arrived. Calls unanswered.", status: "resolved", amount: 1200, createdAt: daysAgo(8), resolvedAt: daysAgo(6), resolution: "Full refund issued. Provider warned." },
];
let disputes = persisted("disputes", disputeSeed);

export const disputesService = {
  async list(filter?: DisputeStatus) {
    const items = filter ? disputes.filter((d) => d.status === filter) : disputes;
    return delay([...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  },
  async setStatus(itemId: string, status: DisputeStatus, resolution?: string) {
    disputes = disputes.map((d) =>
      d.id === itemId
        ? {
            ...d,
            status,
            resolution: resolution ?? d.resolution,
            resolvedAt: status === "resolved" || status === "rejected" ? now() : d.resolvedAt,
          }
        : d,
    );
    save("disputes", disputes);
    return delay(disputes.find((d) => d.id === itemId)!);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Trust & Safety: badges, restricted services
 * ═══════════════════════════════════════════════════════ */

export type TrustBadge = {
  id: string;
  label: string;
  description: string;
  iconKey: "verified" | "topRated" | "background" | "insured" | "ecoFriendly" | "fastResponse";
  isActive: boolean;
};

const trustBadgeSeed: TrustBadge[] = [
  { id: id(), label: "Verified", description: "NID and trade license verified", iconKey: "verified", isActive: true },
  { id: id(), label: "Top Rated", description: "4.5+ rating with 50+ reviews", iconKey: "topRated", isActive: true },
  { id: id(), label: "Background Checked", description: "Criminal background screening passed", iconKey: "background", isActive: true },
  { id: id(), label: "Insured", description: "Carries professional liability insurance", iconKey: "insured", isActive: false },
  { id: id(), label: "Eco Friendly", description: "Uses environmentally safe products", iconKey: "ecoFriendly", isActive: true },
  { id: id(), label: "Fast Response", description: "Replies within 15 minutes", iconKey: "fastResponse", isActive: true },
];
let trustBadges = persisted("trustBadges", trustBadgeSeed);

export const trustBadgesService = {
  async list() {
    return delay(trustBadges);
  },
  async update(itemId: string, patch: Partial<TrustBadge>) {
    trustBadges = trustBadges.map((b) => (b.id === itemId ? { ...b, ...patch } : b));
    save("trustBadges", trustBadges);
    return delay(trustBadges.find((b) => b.id === itemId)!);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Lead capture forms
 * ═══════════════════════════════════════════════════════ */

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type Lead = {
  id: string;
  source: "homepage" | "blog" | "campaign" | "referral";
  name: string;
  phone: string;
  email?: string;
  interest: string;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
};

const leadSeed: Lead[] = [
  { id: id(), source: "homepage", name: "Imran Chowdhury", phone: "+8801711222333", email: "imran@example.com", interest: "Office cleaning", status: "new", createdAt: daysAgo(0) },
  { id: id(), source: "campaign", name: "Nadia Karim", phone: "+8801711222334", interest: "AC servicing for restaurant", status: "contacted", notes: "Wants visit Friday afternoon", createdAt: daysAgo(1) },
  { id: id(), source: "blog", name: "Sohel Rana", phone: "+8801711222335", email: "sohel@example.com", interest: "Pest control quarterly contract", status: "qualified", notes: "Decision maker. Budget approved.", createdAt: daysAgo(3) },
  { id: id(), source: "referral", name: "Tasnim Hossain", phone: "+8801711222336", interest: "Deep cleaning before Eid", status: "converted", createdAt: daysAgo(7) },
  { id: id(), source: "homepage", name: "Joynal Abedin", phone: "+8801711222337", interest: "Plumbing repair", status: "lost", notes: "Went with neighborhood plumber", createdAt: daysAgo(12) },
];
let leads = persisted("leads", leadSeed);

export const leadsService = {
  async list(filter?: LeadStatus) {
    const items = filter ? leads.filter((l) => l.status === filter) : leads;
    return delay([...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  },
  async update(itemId: string, patch: Partial<Lead>) {
    leads = leads.map((l) => (l.id === itemId ? { ...l, ...patch } : l));
    save("leads", leads);
    return delay(leads.find((l) => l.id === itemId)!);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Integrations
 * ═══════════════════════════════════════════════════════ */

export type IntegrationCategory = "payment" | "sms" | "email" | "analytics" | "tracking" | "other";
export type Integration = {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  iconKey: string;
  connected: boolean;
  isComingSoon?: boolean;
};

const integrationSeed: Integration[] = [
  { id: "stripe", name: "Stripe", category: "payment", description: "Cards, wallets, recurring payments", iconKey: "credit-card", connected: false },
  { id: "bkash", name: "bKash", category: "payment", description: "Bangladesh's #1 mobile financial service", iconKey: "wallet", connected: true },
  { id: "nagad", name: "Nagad", category: "payment", description: "Mobile payments for Bangladesh", iconKey: "wallet", connected: true },
  { id: "sslcommerz", name: "SSLCommerz", category: "payment", description: "Local cards and bank transfers", iconKey: "credit-card", connected: false, isComingSoon: true },
  { id: "twilio", name: "Twilio", category: "sms", description: "Programmable SMS worldwide", iconKey: "message-square", connected: false },
  { id: "alpha", name: "Alpha SMS", category: "sms", description: "Local Bangladesh SMS gateway", iconKey: "message-square", connected: true },
  { id: "sendgrid", name: "SendGrid", category: "email", description: "Transactional email at scale", iconKey: "mail", connected: true },
  { id: "resend", name: "Resend", category: "email", description: "Modern email API for developers", iconKey: "mail", connected: false },
  { id: "ga4", name: "Google Analytics 4", category: "analytics", description: "Website analytics and conversions", iconKey: "bar-chart-3", connected: true },
  { id: "fbpixel", name: "Meta Pixel", category: "tracking", description: "Facebook & Instagram ad tracking", iconKey: "activity", connected: true },
  { id: "hotjar", name: "Hotjar", category: "analytics", description: "Heatmaps and session recordings", iconKey: "eye", connected: false },
  { id: "intercom", name: "Intercom", category: "other", description: "In-app chat and support", iconKey: "message-circle", connected: false, isComingSoon: true },
];
let integrations = persisted("integrations", integrationSeed);

export const integrationsService = {
  async list() {
    return delay(integrations);
  },
  async toggle(itemId: string) {
    integrations = integrations.map((i) =>
      i.id === itemId && !i.isComingSoon ? { ...i, connected: !i.connected } : i,
    );
    save("integrations", integrations);
    return delay(integrations);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Webhooks & API keys
 * ═══════════════════════════════════════════════════════ */

export type Webhook = {
  id: string;
  url: string;
  event: string;
  secret: string;
  isActive: boolean;
  lastFiredAt?: string;
  successCount: number;
  failureCount: number;
};

const webhookSeed: Webhook[] = [
  { id: id(), url: "https://hooks.example.com/booking-created", event: "booking.created", secret: "whsec_••••8h2j", isActive: true, lastFiredAt: daysAgo(0), successCount: 8420, failureCount: 12 },
  { id: id(), url: "https://crm.example.com/lead-new", event: "lead.created", secret: "whsec_••••3k9m", isActive: true, lastFiredAt: daysAgo(1), successCount: 1240, failureCount: 3 },
  { id: id(), url: "https://erp.example.com/payment-paid", event: "payment.paid", secret: "whsec_••••a8x2", isActive: false, successCount: 0, failureCount: 0 },
];
let webhooks = persisted("webhooks", webhookSeed);

export const webhooksService = {
  async list() {
    return delay(webhooks);
  },
  async create(input: Omit<Webhook, "id" | "successCount" | "failureCount">) {
    const item: Webhook = { ...input, id: id(), successCount: 0, failureCount: 0 };
    webhooks = [item, ...webhooks];
    save("webhooks", webhooks);
    return delay(item);
  },
  async remove(itemId: string) {
    webhooks = webhooks.filter((w) => w.id !== itemId);
    save("webhooks", webhooks);
    return delay(true);
  },
  async toggle(itemId: string) {
    webhooks = webhooks.map((w) => (w.id === itemId ? { ...w, isActive: !w.isActive } : w));
    save("webhooks", webhooks);
    return delay(webhooks.find((w) => w.id === itemId)!);
  },
};

export type ApiKey = { id: string; name: string; key: string; lastUsedAt?: string; createdAt: string };
const apiKeySeed: ApiKey[] = [
  { id: id(), name: "Mobile app — production", key: "sk_live_••••••a8h2", lastUsedAt: daysAgo(0), createdAt: daysAgo(120) },
  { id: id(), name: "Reporting dashboard", key: "sk_live_••••••3k9p", lastUsedAt: daysAgo(2), createdAt: daysAgo(60) },
  { id: id(), name: "CI/CD test key", key: "sk_test_••••••x9b1", lastUsedAt: daysAgo(14), createdAt: daysAgo(30) },
];
let apiKeys = persisted("apiKeys", apiKeySeed);

export const apiKeysService = {
  async list() {
    return delay(apiKeys);
  },
  async create(name: string) {
    const item: ApiKey = {
      id: id(),
      name,
      key: `sk_live_${Math.random().toString(36).slice(2, 10)}••••${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now(),
    };
    apiKeys = [item, ...apiKeys];
    save("apiKeys", apiKeys);
    return delay(item);
  },
  async remove(itemId: string) {
    apiKeys = apiKeys.filter((k) => k.id !== itemId);
    save("apiKeys", apiKeys);
    return delay(true);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Security & compliance
 * ═══════════════════════════════════════════════════════ */

export type SecurityPolicy = {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  twoFactorRequired: boolean;
  ipAllowlist: string[];
  loginNotifyOnNewDevice: boolean;
};

let securityPolicy: SecurityPolicy = {
  passwordMinLength: 10,
  passwordRequireUppercase: true,
  passwordRequireNumber: true,
  passwordRequireSymbol: false,
  passwordExpiryDays: 90,
  sessionTimeoutMinutes: 60,
  twoFactorRequired: false,
  ipAllowlist: [],
  loginNotifyOnNewDevice: true,
};
if (isBrowser) {
  try {
    const raw = window.localStorage.getItem("adm:securityPolicy");
    if (raw) securityPolicy = { ...securityPolicy, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export const securityPolicyService = {
  async get() {
    return delay(securityPolicy);
  },
  async update(patch: Partial<SecurityPolicy>) {
    securityPolicy = { ...securityPolicy, ...patch };
    if (isBrowser) window.localStorage.setItem("adm:securityPolicy", JSON.stringify(securityPolicy));
    return delay(securityPolicy);
  },
};

export type LoginAuditEntry = {
  id: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  success: boolean;
  suspicious: boolean;
  createdAt: string;
};

const loginAuditSeed: LoginAuditEntry[] = [
  { id: id(), userEmail: "admin@servicehub.bd", ipAddress: "103.108.231.12", userAgent: "Chrome 130 / macOS", location: "Dhaka, BD", success: true, suspicious: false, createdAt: daysAgo(0) },
  { id: id(), userEmail: "ops@servicehub.bd", ipAddress: "103.108.231.45", userAgent: "Safari 18 / iOS", location: "Dhaka, BD", success: true, suspicious: false, createdAt: daysAgo(0) },
  { id: id(), userEmail: "admin@servicehub.bd", ipAddress: "185.220.101.42", userAgent: "Firefox 128 / Linux", location: "Frankfurt, DE", success: false, suspicious: true, createdAt: daysAgo(1) },
  { id: id(), userEmail: "finance@servicehub.bd", ipAddress: "103.108.231.88", userAgent: "Chrome 130 / Windows", location: "Dhaka, BD", success: true, suspicious: false, createdAt: daysAgo(1) },
  { id: id(), userEmail: "admin@servicehub.bd", ipAddress: "45.142.212.61", userAgent: "Unknown", location: "Unknown", success: false, suspicious: true, createdAt: daysAgo(2) },
  { id: id(), userEmail: "ops@servicehub.bd", ipAddress: "103.108.231.45", userAgent: "Safari 18 / iOS", location: "Dhaka, BD", success: true, suspicious: false, createdAt: daysAgo(3) },
];

export const loginAuditService = {
  async list() {
    return delay([...loginAuditSeed].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  },
};

export type DataRequest = {
  id: string;
  customerEmail: string;
  type: "export" | "delete";
  status: "pending" | "processing" | "completed" | "rejected";
  requestedAt: string;
  completedAt?: string;
};

const dataReqSeed: DataRequest[] = [
  { id: id(), customerEmail: "user1@example.com", type: "export", status: "pending", requestedAt: daysAgo(1) },
  { id: id(), customerEmail: "user2@example.com", type: "delete", status: "processing", requestedAt: daysAgo(3) },
  { id: id(), customerEmail: "user3@example.com", type: "export", status: "completed", requestedAt: daysAgo(15), completedAt: daysAgo(13) },
];
let dataRequests = persisted("dataRequests", dataReqSeed);

export const dataRequestsService = {
  async list() {
    return delay([...dataRequests].sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt)));
  },
  async setStatus(itemId: string, status: DataRequest["status"]) {
    dataRequests = dataRequests.map((d) =>
      d.id === itemId
        ? { ...d, status, completedAt: status === "completed" ? now() : d.completedAt }
        : d,
    );
    save("dataRequests", dataRequests);
    return delay(dataRequests.find((d) => d.id === itemId)!);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Team & roles
 * ═══════════════════════════════════════════════════════ */

export type AdminPermission =
  | "bookings.read" | "bookings.write"
  | "providers.read" | "providers.write"
  | "customers.read" | "customers.write"
  | "finance.read" | "finance.write"
  | "marketing.read" | "marketing.write"
  | "content.read" | "content.write"
  | "settings.read" | "settings.write"
  | "team.read" | "team.write"
  | "audit.read";

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: AdminPermission[];
};

const allPerms: AdminPermission[] = [
  "bookings.read", "bookings.write", "providers.read", "providers.write",
  "customers.read", "customers.write", "finance.read", "finance.write",
  "marketing.read", "marketing.write", "content.read", "content.write",
  "settings.read", "settings.write", "team.read", "team.write", "audit.read",
];

const roleSeed: AdminRole[] = [
  { id: id(), name: "Super Admin", description: "Full access to everything", isSystem: true, permissions: allPerms },
  { id: id(), name: "Operations Manager", description: "Manage bookings, providers, support", isSystem: false, permissions: ["bookings.read","bookings.write","providers.read","providers.write","customers.read","content.read"] },
  { id: id(), name: "Finance Officer", description: "Manage payouts, invoices, commissions", isSystem: false, permissions: ["finance.read","finance.write","bookings.read","providers.read","audit.read"] },
  { id: id(), name: "Marketing Lead", description: "Run campaigns, coupons, content", isSystem: false, permissions: ["marketing.read","marketing.write","content.read","content.write","customers.read"] },
  { id: id(), name: "Support Agent", description: "Read-only across the board, plus support inbox", isSystem: false, permissions: ["bookings.read","customers.read","providers.read","content.read"] },
];
let adminRoles = persisted("adminRoles", roleSeed);

export const ALL_PERMISSIONS = allPerms;

export const adminRolesService = {
  async list() {
    return delay(adminRoles);
  },
  async update(itemId: string, patch: Partial<AdminRole>) {
    adminRoles = adminRoles.map((r) => (r.id === itemId ? { ...r, ...patch } : r));
    save("adminRoles", adminRoles);
    return delay(adminRoles.find((r) => r.id === itemId)!);
  },
  async create(input: Omit<AdminRole, "id" | "isSystem">) {
    const item: AdminRole = { ...input, id: id(), isSystem: false };
    adminRoles = [...adminRoles, item];
    save("adminRoles", adminRoles);
    return delay(item);
  },
  async remove(itemId: string) {
    adminRoles = adminRoles.filter((r) => r.id !== itemId || r.isSystem);
    save("adminRoles", adminRoles);
    return delay(true);
  },
};

export type AdminMember = {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  department: "Operations" | "Finance" | "Marketing" | "Support" | "Engineering" | "Leadership";
  status: "active" | "invited" | "suspended";
  lastActiveAt?: string;
  notes?: string;
};

const memberSeed: AdminMember[] = [
  { id: id(), fullName: "Tareq Aziz", email: "tareq@servicehub.bd", roleId: adminRoles[0].id, department: "Leadership", status: "active", lastActiveAt: daysAgo(0), notes: "Founder. Owns root access." },
  { id: id(), fullName: "Mahbuba Karim", email: "mahbuba@servicehub.bd", roleId: adminRoles[1].id, department: "Operations", status: "active", lastActiveAt: daysAgo(0) },
  { id: id(), fullName: "Sajid Hasan", email: "sajid@servicehub.bd", roleId: adminRoles[2].id, department: "Finance", status: "active", lastActiveAt: daysAgo(1) },
  { id: id(), fullName: "Tonima Akter", email: "tonima@servicehub.bd", roleId: adminRoles[3].id, department: "Marketing", status: "active", lastActiveAt: daysAgo(0) },
  { id: id(), fullName: "Rifat Bhuiyan", email: "rifat@servicehub.bd", roleId: adminRoles[4].id, department: "Support", status: "active", lastActiveAt: daysAgo(0) },
  { id: id(), fullName: "Asif Ahmed", email: "asif@servicehub.bd", roleId: adminRoles[4].id, department: "Support", status: "invited" },
];
let adminMembers = persisted("adminMembers", memberSeed);

export const adminMembersService = {
  async list() {
    return delay(adminMembers);
  },
  async update(itemId: string, patch: Partial<AdminMember>) {
    adminMembers = adminMembers.map((m) => (m.id === itemId ? { ...m, ...patch } : m));
    save("adminMembers", adminMembers);
    return delay(adminMembers.find((m) => m.id === itemId)!);
  },
  async create(input: Omit<AdminMember, "id">) {
    const item: AdminMember = { ...input, id: id() };
    adminMembers = [...adminMembers, item];
    save("adminMembers", adminMembers);
    return delay(item);
  },
  async remove(itemId: string) {
    adminMembers = adminMembers.filter((m) => m.id !== itemId);
    save("adminMembers", adminMembers);
    return delay(true);
  },
};

/* ═══════════════════════════════════════════════════════════
 * Activity timeline (admin actions)
 * ═══════════════════════════════════════════════════════ */

export type ActivityEntry = {
  id: string;
  actor: string;
  action: string;
  target?: string;
  category: "auth" | "booking" | "provider" | "customer" | "finance" | "settings" | "content";
  createdAt: string;
};

const activitySeed: ActivityEntry[] = [
  { id: id(), actor: "Tareq Aziz", action: "Approved provider application", target: "Karim Electric Co.", category: "provider", createdAt: daysAgo(0) },
  { id: id(), actor: "Mahbuba Karim", action: "Reassigned booking", target: "BK-8421 → Rahim Hossain", category: "booking", createdAt: daysAgo(0) },
  { id: id(), actor: "Sajid Hasan", action: "Created payout", target: "Rahim Hossain · Tk 12,400", category: "finance", createdAt: daysAgo(0) },
  { id: id(), actor: "Tonima Akter", action: "Launched campaign", target: "Eid Cleaning Push", category: "content", createdAt: daysAgo(1) },
  { id: id(), actor: "Tareq Aziz", action: "Updated commission rate", target: "Cleaning · 12% → 15%", category: "settings", createdAt: daysAgo(1) },
  { id: id(), actor: "Mahbuba Karim", action: "Resolved dispute", target: "BK-8201", category: "booking", createdAt: daysAgo(2) },
  { id: id(), actor: "System", action: "Failed login from suspicious IP", target: "185.220.101.42", category: "auth", createdAt: daysAgo(2) },
  { id: id(), actor: "Sajid Hasan", action: "Issued refund", target: "BK-8398 · Tk 700", category: "finance", createdAt: daysAgo(3) },
  { id: id(), actor: "Rifat Bhuiyan", action: "Added customer note", target: "Ayesha Rahman", category: "customer", createdAt: daysAgo(3) },
  { id: id(), actor: "Tareq Aziz", action: "Invited team member", target: "asif@servicehub.bd", category: "settings", createdAt: daysAgo(4) },
];

export const activityService = {
  async list(limit = 50) {
    return delay(activitySeed.slice(0, limit));
  },
};
