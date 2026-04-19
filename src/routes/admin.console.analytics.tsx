import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaDemandChart,
  CancellationTrendChart,
  CategoryDemandHeatmap,
  ChartCard,
  ComplaintRateChart,
  ConversionFunnelChart,
  KpiCard,
  ProviderPerformanceTable,
  RetentionSummaryCards,
  RevenueTrendChart,
  downloadCsv,
} from "@/components/analytics";
import {
  analyticsService,
  RANGE_DAYS,
  type AnalyticsBundle,
  type RangeKey,
} from "@/services/analytics";

export const Route = createFileRoute("/admin/console/analytics")({
  component: AnalyticsPage,
});

function pctDelta(curr: number, prev: number) {
  if (!prev) return curr ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [compare, setCompare] = useState(true);
  const [city, setCity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await analyticsService.load(range, compare);
      setBundle(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, compare]);

  const cityOptions = useMemo(() => {
    if (!bundle) return ["all"];
    return ["all", ...bundle.areaDemand.map((a) => a.area)];
  }, [bundle]);

  const categoryOptions = useMemo(() => {
    if (!bundle) return ["all"];
    return ["all", ...bundle.categoryDemand.map((c) => c.category)];
  }, [bundle]);

  const filteredCategoryDemand = useMemo(() => {
    if (!bundle) return [];
    if (category === "all") return bundle.categoryDemand;
    return bundle.categoryDemand.filter((c) => c.category === category);
  }, [bundle, category]);

  const filteredAreaDemand = useMemo(() => {
    if (!bundle) return [];
    if (city === "all") return bundle.areaDemand;
    return bundle.areaDemand.filter((a) => a.area === city);
  }, [bundle, city]);

  const filteredProviders = useMemo(() => bundle?.providers ?? [], [bundle]);

  function exportOverview() {
    if (!bundle) return;
    downloadCsv(`analytics-overview-${range}.csv`, [
      { metric: "Revenue (BDT)", value: bundle.totals.revenue, previous: bundle.totals.revenuePrev },
      { metric: "Bookings", value: bundle.totals.bookings, previous: bundle.totals.bookingsPrev },
      { metric: "Completion %", value: bundle.totals.completion, previous: bundle.totals.completionPrev },
      { metric: "Avg order value (BDT)", value: bundle.totals.avgOrderValue, previous: bundle.totals.avgOrderValuePrev },
      { metric: "New customers", value: bundle.retention.newCustomers, previous: "" },
      { metric: "Repeat customers", value: bundle.retention.repeatCustomers, previous: "" },
      { metric: "Repeat rate %", value: bundle.retention.repeatRate, previous: "" },
    ]);
    toast.success("Overview exported");
  }

  function exportProviders() {
    if (!bundle) return;
    downloadCsv(
      `provider-performance-${range}.csv`,
      bundle.providers.map((p) => ({
        provider: p.name,
        jobs: p.jobs,
        revenue_bdt: p.revenue,
        rating: p.rating,
        cancellations: p.cancellations,
        completion_pct: p.completionRate,
      })),
    );
    toast.success("Provider report exported");
  }

  function exportDemand() {
    if (!bundle) return;
    downloadCsv(
      `demand-${range}.csv`,
      [
        ...bundle.categoryDemand.map((c) => ({
          dimension: "category",
          name: c.category,
          bookings: c.bookings,
          revenue_bdt: Math.round(c.revenue),
        })),
        ...bundle.areaDemand.map((a) => ({
          dimension: "area",
          name: a.area,
          bookings: a.bookings,
          revenue_bdt: Math.round(a.revenue),
        })),
      ],
    );
    toast.success("Demand report exported");
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Insights"
        title="Analytics & reporting"
        description={`Last ${RANGE_DAYS[range]} days · ${compare ? "with period comparison" : "single period"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs">
              Compare
              <Switch checked={compare} onCheckedChange={setCompare} />
            </label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All cities" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button size="sm" onClick={exportOverview}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        }
      />

      {loading || !bundle ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="demand">Demand</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard
                label="Revenue"
                value={bundle.totals.revenue}
                delta={pctDelta(bundle.totals.revenue, bundle.totals.revenuePrev)}
                format="bdt"
              />
              <KpiCard
                label="Bookings"
                value={bundle.totals.bookings}
                delta={pctDelta(bundle.totals.bookings, bundle.totals.bookingsPrev)}
              />
              <KpiCard
                label="Completion"
                value={bundle.totals.completion}
                delta={pctDelta(bundle.totals.completion, bundle.totals.completionPrev)}
                format="percent"
              />
              <KpiCard
                label="Avg order value"
                value={bundle.totals.avgOrderValue}
                delta={pctDelta(bundle.totals.avgOrderValue, bundle.totals.avgOrderValuePrev)}
                format="bdt"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
              <ChartCard
                title="Revenue trend"
                subtitle={compare ? "Current vs previous period" : "Daily gross revenue"}
              >
                <RevenueTrendChart data={bundle.revenueTrend} />
              </ChartCard>
              <ChartCard
                title="Booking conversion"
                subtitle="From created → assigned → completed → paid"
              >
                <ConversionFunnelChart data={bundle.conversion} />
              </ChartCard>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ChartCard title="Cancellation trend" subtitle="Daily cancelled bookings">
                <CancellationTrendChart data={bundle.cancellationsTrend} />
              </ChartCard>
              <ChartCard title="Complaint rate" subtitle="New support contacts / day">
                <ComplaintRateChart data={bundle.complaintRate} />
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="demand" className="mt-5 space-y-5">
            <div className="flex items-center justify-end">
              <Button size="sm" variant="outline" onClick={exportDemand}>
                <Download className="h-3.5 w-3.5" /> Export demand
              </Button>
            </div>
            <ChartCard
              title="Category demand"
              subtitle="Heatmap weighted by bookings · revenue underneath"
              className="h-auto"
            >
              <CategoryDemandHeatmap data={filteredCategoryDemand} />
            </ChartCard>
            <ChartCard title="Area demand" subtitle="Top areas by bookings (filtered by city)">
              <AreaDemandChart data={filteredAreaDemand} />
            </ChartCard>
          </TabsContent>

          <TabsContent value="providers" className="mt-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing top {Math.min(10, filteredProviders.length)} providers by net revenue.
              </div>
              <Button size="sm" variant="outline" onClick={exportProviders}>
                <Download className="h-3.5 w-3.5" /> Export providers
              </Button>
            </div>
            <ChartCard title="Provider performance" subtitle="Jobs · revenue · rating · completion">
              <ProviderPerformanceTable rows={filteredProviders} />
            </ChartCard>
          </TabsContent>

          <TabsContent value="quality" className="mt-5 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <ChartCard title="Cancellation trend" subtitle="Look for sudden spikes">
                <CancellationTrendChart data={bundle.cancellationsTrend} />
              </ChartCard>
              <ChartCard title="Complaint rate" subtitle="Daily new support tickets">
                <ComplaintRateChart data={bundle.complaintRate} />
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="retention" className="mt-5 space-y-5">
            <RetentionSummaryCards retention={bundle.retention} />
            <ChartCard title="Booking conversion" subtitle="Current period funnel">
              <ConversionFunnelChart data={bundle.conversion} />
            </ChartCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
