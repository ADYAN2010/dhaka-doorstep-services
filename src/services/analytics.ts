/**
 * Analytics service — returns an empty bundle for now. Will be wired
 * against Supabase aggregations in a follow-up.
 */

export type RangeKey = "7d" | "30d" | "90d" | "ytd";
export const RANGE_DAYS: Record<RangeKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  ytd: Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
        86400000,
    ),
  ),
};

export type DailyPoint = { date: string; value: number; compare?: number };
export type CategoryDemand = {
  category: string;
  bookings: number;
  revenue: number;
};
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

function emptySeries(): DailyPoint[] {
  return [];
}

export const analyticsService = {
  async load(range: RangeKey, _compare: boolean): Promise<AnalyticsBundle> {
    return {
      range,
      revenueTrend: emptySeries(),
      bookingsTrend: emptySeries(),
      cancellationsTrend: emptySeries(),
      conversion: [],
      complaintRate: emptySeries(),
      categoryDemand: [],
      areaDemand: [],
      providers: [],
      retention: {
        newCustomers: 0,
        repeatCustomers: 0,
        repeatRate: 0,
        averageBookingsPerCustomer: 0,
      },
      totals: {
        revenue: 0,
        revenuePrev: 0,
        bookings: 0,
        bookingsPrev: 0,
        completion: 0,
        completionPrev: 0,
        avgOrderValue: 0,
        avgOrderValuePrev: 0,
      },
    };
  },
};
