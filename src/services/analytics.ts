/**
 * Analytics service — pulls real data from Supabase where possible and
 * derives realistic metrics (retention, conversion, complaint rate, etc.)
 * from the live bookings / ledger / payments / contact_messages tables.
 *
 * Heatmap weighting and channel/funnel breakdowns are computed on the fly
 * from the same source rows so a single date range filter feeds everything.
 */

import { supabase } from "@/integrations/supabase/client";

export type RangeKey = "7d" | "30d" | "90d" | "ytd";
export const RANGE_DAYS: Record<RangeKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  ytd: Math.max(1, Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000)),
};

export type DailyPoint = { date: string; value: number; compare?: number };
export type CategoryDemand = { category: string; bookings: number; revenue: number };
export type AreaDemand = { area: string; bookings: number; revenue: number };
export type ProviderRow = {
  providerId: string;
  name: string;
  jobs: number;
  revenue: number;
  rating: number;
  cancellations: number;
  completionRate: number;
};
export type FunnelStep = { label: string; value: number };
export type RetentionSummary = {
  newCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  averageBookingsPerCustomer: number;
};

export type AnalyticsBundle = {
  range: RangeKey;
  revenueTrend: DailyPoint[];
  bookingsTrend: DailyPoint[];
  cancellationsTrend: DailyPoint[];
  conversion: FunnelStep[];
  complaintRate: DailyPoint[];
  categoryDemand: CategoryDemand[];
  areaDemand: AreaDemand[];
  providers: ProviderRow[];
  retention: RetentionSummary;
  totals: {
    revenue: number;
    revenuePrev: number;
    bookings: number;
    bookingsPrev: number;
    completion: number;
    completionPrev: number;
    avgOrderValue: number;
    avgOrderValuePrev: number;
  };
};

function toDateKey(d: string | Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function buildDailySeries(
  start: Date,
  days: number,
  rows: { created_at: string }[],
  pickValue: (r: { created_at: string }) => number = () => 1,
): DailyPoint[] {
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    buckets.set(toDateKey(d), 0);
  }
  rows.forEach((r) => {
    const k = toDateKey(r.created_at);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + pickValue(r));
  });
  return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
}

function attachCompare(curr: DailyPoint[], prev: DailyPoint[]): DailyPoint[] {
  return curr.map((p, i) => ({ ...p, compare: prev[i]?.value ?? 0 }));
}

export const analyticsService = {
  async load(range: RangeKey, compare: boolean): Promise<AnalyticsBundle> {
    const days = RANGE_DAYS[range];
    const now = new Date();
    const start = new Date(now.getTime() - days * 86400000);
    const prevStart = new Date(start.getTime() - days * 86400000);

    const [bookingsRes, ledgerRes, paymentsRes, contactsRes, reviewsRes, profilesRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, created_at, category, area, status, user_id, provider_id")
        .gte("created_at", prevStart.toISOString())
        .order("created_at", { ascending: true }),
      supabase
        .from("commission_ledger")
        .select("created_at, gross_amount, commission_amount, provider_net, category, provider_id")
        .gte("created_at", prevStart.toISOString()),
      supabase.from("payments").select("created_at, amount, status").gte("created_at", prevStart.toISOString()),
      supabase.from("contact_messages").select("created_at").gte("created_at", prevStart.toISOString()),
      supabase.from("reviews").select("provider_id, rating"),
      supabase.from("profiles").select("id, full_name"),
    ]);

    const bookings = bookingsRes.data ?? [];
    const ledger = ledgerRes.data ?? [];
    const contacts = contactsRes.data ?? [];
    const reviews = reviewsRes.data ?? [];
    const profileNames = new Map<string, string>(
      (profilesRes.data ?? []).map((p) => [p.id as string, (p.full_name as string) || "Provider"]),
    );

    const inWindow = <T extends { created_at: string }>(rows: T[], from: Date, to: Date) =>
      rows.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= from.getTime() && t < to.getTime();
      });

    const currBookings = inWindow(bookings, start, now);
    const prevBookings = inWindow(bookings, prevStart, start);
    const currLedger = inWindow(ledger, start, now);
    const prevLedger = inWindow(ledger, prevStart, start);
    const currContacts = inWindow(contacts, start, now);

    const currRevSeries = buildDailySeries(start, days, currLedger, (r) => Number((r as { gross_amount: number }).gross_amount) || 0);
    const prevRevSeries = buildDailySeries(prevStart, days, prevLedger, (r) => Number((r as { gross_amount: number }).gross_amount) || 0);
    const revenueTrend = compare ? attachCompare(currRevSeries, prevRevSeries) : currRevSeries;

    const currBookingSeries = buildDailySeries(start, days, currBookings);
    const prevBookingSeries = buildDailySeries(prevStart, days, prevBookings);
    const bookingsTrend = compare ? attachCompare(currBookingSeries, prevBookingSeries) : currBookingSeries;

    const currCancel = currBookings.filter((b) => b.status === "cancelled");
    const prevCancel = prevBookings.filter((b) => b.status === "cancelled");
    const cancellationsTrend = compare
      ? attachCompare(buildDailySeries(start, days, currCancel), buildDailySeries(prevStart, days, prevCancel))
      : buildDailySeries(start, days, currCancel);

    const complaintRate = buildDailySeries(start, days, currContacts);

    // Funnel: bookings → assigned → completed → paid
    const total = currBookings.length;
    const assigned = currBookings.filter((b) => b.status !== "new").length;
    const completed = currBookings.filter((b) => b.status === "completed").length;
    const paid = currLedger.length;
    const conversion: FunnelStep[] = [
      { label: "Created", value: total },
      { label: "Assigned", value: assigned },
      { label: "Completed", value: completed },
      { label: "Paid", value: paid },
    ];

    // Category demand
    const catMap = new Map<string, CategoryDemand>();
    currBookings.forEach((b) => {
      const k = (b.category as string) || "Other";
      const existing = catMap.get(k) ?? { category: k, bookings: 0, revenue: 0 };
      existing.bookings += 1;
      catMap.set(k, existing);
    });
    currLedger.forEach((l) => {
      const k = (l.category as string) || "Other";
      const existing = catMap.get(k) ?? { category: k, bookings: 0, revenue: 0 };
      existing.revenue += Number(l.gross_amount) || 0;
      catMap.set(k, existing);
    });
    const categoryDemand = Array.from(catMap.values()).sort((a, b) => b.bookings - a.bookings);

    // Area demand
    const areaMap = new Map<string, AreaDemand>();
    currBookings.forEach((b) => {
      const k = (b.area as string) || "Unknown";
      const existing = areaMap.get(k) ?? { area: k, bookings: 0, revenue: 0 };
      existing.bookings += 1;
      areaMap.set(k, existing);
    });
    // approximate area revenue by joining booking → ledger via provider+category proximity:
    currLedger.forEach((l) => {
      // use the matching booking's area if we can find one
      const b = currBookings.find((x) => x.provider_id === l.provider_id && x.category === l.category);
      if (!b) return;
      const k = (b.area as string) || "Unknown";
      const existing = areaMap.get(k) ?? { area: k, bookings: 0, revenue: 0 };
      existing.revenue += Number(l.gross_amount) || 0;
      areaMap.set(k, existing);
    });
    const areaDemand = Array.from(areaMap.values()).sort((a, b) => b.bookings - a.bookings);

    // Provider performance
    const provMap = new Map<string, ProviderRow>();
    currBookings.forEach((b) => {
      if (!b.provider_id) return;
      const k = b.provider_id as string;
      const row = provMap.get(k) ?? {
        providerId: k,
        name: profileNames.get(k) ?? "Provider",
        jobs: 0,
        revenue: 0,
        rating: 0,
        cancellations: 0,
        completionRate: 0,
      };
      row.jobs += 1;
      if (b.status === "cancelled") row.cancellations += 1;
      provMap.set(k, row);
    });
    currLedger.forEach((l) => {
      const k = l.provider_id as string;
      const row = provMap.get(k);
      if (!row) return;
      row.revenue += Number(l.provider_net) || 0;
    });
    const ratingByProvider = new Map<string, { sum: number; n: number }>();
    reviews.forEach((r) => {
      const k = r.provider_id as string;
      const ex = ratingByProvider.get(k) ?? { sum: 0, n: 0 };
      ex.sum += Number(r.rating) || 0;
      ex.n += 1;
      ratingByProvider.set(k, ex);
    });
    provMap.forEach((row) => {
      const r = ratingByProvider.get(row.providerId);
      row.rating = r && r.n ? Math.round((r.sum / r.n) * 10) / 10 : 0;
      row.completionRate = row.jobs ? Math.round(((row.jobs - row.cancellations) / row.jobs) * 100) : 0;
    });
    const providers = Array.from(provMap.values()).sort((a, b) => b.revenue - a.revenue);

    // Retention
    const customerCounts = new Map<string, number>();
    currBookings.forEach((b) => {
      if (!b.user_id) return;
      customerCounts.set(b.user_id as string, (customerCounts.get(b.user_id as string) ?? 0) + 1);
    });
    const repeat = Array.from(customerCounts.values()).filter((n) => n > 1).length;
    const newCustomers = customerCounts.size - repeat;
    const totalCustomers = customerCounts.size || 1;
    const totalCustomerBookings = Array.from(customerCounts.values()).reduce((a, b) => a + b, 0);
    const retention: RetentionSummary = {
      newCustomers,
      repeatCustomers: repeat,
      repeatRate: Math.round((repeat / totalCustomers) * 100),
      averageBookingsPerCustomer: Math.round((totalCustomerBookings / totalCustomers) * 10) / 10,
    };

    // Totals
    const sum = (rows: { gross_amount?: number }[]) =>
      rows.reduce((s, r) => s + (Number(r.gross_amount) || 0), 0);
    const revenue = sum(currLedger);
    const revenuePrev = sum(prevLedger);
    const completionCurr = currBookings.length
      ? Math.round((completed / currBookings.length) * 100)
      : 0;
    const prevCompleted = prevBookings.filter((b) => b.status === "completed").length;
    const completionPrev = prevBookings.length
      ? Math.round((prevCompleted / prevBookings.length) * 100)
      : 0;
    const aov = paid ? Math.round(revenue / paid) : 0;
    const aovPrev = prevLedger.length ? Math.round(revenuePrev / prevLedger.length) : 0;

    return {
      range,
      revenueTrend,
      bookingsTrend,
      cancellationsTrend,
      conversion,
      complaintRate,
      categoryDemand,
      areaDemand,
      providers,
      retention,
      totals: {
        revenue,
        revenuePrev,
        bookings: currBookings.length,
        bookingsPrev: prevBookings.length,
        completion: completionCurr,
        completionPrev,
        avgOrderValue: aov,
        avgOrderValuePrev: aovPrev,
      },
    };
  },
};
