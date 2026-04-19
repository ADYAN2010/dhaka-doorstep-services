import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AreaDemand,
  CategoryDemand,
  DailyPoint,
  FunnelStep,
  ProviderRow,
  RetentionSummary,
} from "@/services/analytics";

/* ──────────────────────── Generic chart frame ─────────────────────── */

export function ChartCard({
  title,
  subtitle,
  children,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-soft",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="h-64 w-full">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

const fmtBDT = (n: number) => `৳${Number(n).toLocaleString()}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/* ─────────────────────────── Trend charts ─────────────────────────── */

export function RevenueTrendChart({ data }: { data: DailyPoint[] }) {
  const hasCompare = data.some((d) => d.compare !== undefined);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          width={42}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(l) => fmtDate(String(l))}
          formatter={(v: number, name) => [fmtBDT(v), name === "compare" ? "Previous" : "Current"]}
        />
        {hasCompare && (
          <Area
            type="monotone"
            dataKey="compare"
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            fill="transparent"
            isAnimationActive={false}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#revFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CancellationTrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={32} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => fmtDate(String(l))} />
        <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
        {data.some((d) => d.compare !== undefined) && (
          <Line type="monotone" dataKey="compare" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ComplaintRateChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={32} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => fmtDate(String(l))} />
        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─────────────────────── Conversion funnel ────────────────────────── */

export function ConversionFunnelChart({ data }: { data: FunnelStep[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-2">
      {data.map((step, i) => {
        const pct = (step.value / max) * 100;
        const dropoff =
          i > 0 && data[i - 1].value > 0
            ? Math.round((step.value / data[i - 1].value) * 100)
            : 100;
        return (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{step.label}</span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{step.value.toLocaleString()}</span>
                {i > 0 && <span className="ml-2">{dropoff}%</span>}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────── Category / area heatmap ────────────────────── */

export function CategoryDemandHeatmap({ data }: { data: CategoryDemand[] }) {
  const max = Math.max(1, ...data.map((d) => d.bookings));
  if (data.length === 0) return <EmptyState label="No category demand yet" />;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {data.slice(0, 12).map((c) => {
        const intensity = c.bookings / max;
        return (
          <div
            key={c.category}
            className="rounded-xl border border-border p-3 transition-shadow hover:shadow-sm"
            style={{
              background: `color-mix(in oklab, hsl(var(--primary)) ${Math.round(intensity * 65)}%, hsl(var(--card)))`,
            }}
          >
            <div className="line-clamp-1 text-xs font-medium text-foreground">
              {c.category}
            </div>
            <div className="mt-1 text-lg font-bold leading-tight">{c.bookings}</div>
            <div className="text-[11px] text-muted-foreground">
              {fmtBDT(Math.round(c.revenue))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AreaDemandChart({ data }: { data: AreaDemand[] }) {
  const filtered = useMemo(() => data.slice(0, 10), [data]);
  if (filtered.length === 0) return <EmptyState label="No area data yet" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={filtered} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis
          dataKey="area"
          type="category"
          width={88}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [n === "revenue" ? fmtBDT(v) : v, n]} />
        <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]}>
          {filtered.map((_, i) => (
            <Cell key={i} fillOpacity={0.6 + (i < 3 ? 0.4 : 0.2)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ────────────────────── Provider performance ──────────────────────── */

export function ProviderPerformanceTable({ rows }: { rows: ProviderRow[] }) {
  if (rows.length === 0) return <EmptyState label="No provider activity in this period" />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead className="text-right">Jobs</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Rating</TableHead>
            <TableHead className="text-right">Cancels</TableHead>
            <TableHead className="text-right">Completion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 10).map((p) => (
            <TableRow key={p.providerId}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="text-right">{p.jobs}</TableCell>
              <TableCell className="text-right">{fmtBDT(p.revenue)}</TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  {p.rating || "—"}
                </span>
              </TableCell>
              <TableCell className="text-right">{p.cancellations}</TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold",
                    p.completionRate >= 90
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : p.completionRate >= 70
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                  )}
                >
                  {p.completionRate}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─────────────────────── Retention summary ────────────────────────── */

export function RetentionSummaryCards({ retention }: { retention: RetentionSummary }) {
  const items = [
    {
      label: "New customers",
      value: retention.newCustomers.toLocaleString(),
      tone: "primary" as const,
    },
    {
      label: "Repeat customers",
      value: retention.repeatCustomers.toLocaleString(),
      tone: "success" as const,
    },
    {
      label: "Repeat rate",
      value: `${retention.repeatRate}%`,
      tone: "primary" as const,
    },
    {
      label: "Avg bookings / customer",
      value: retention.averageBookingsPerCustomer.toFixed(1),
      tone: "neutral" as const,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((i) => (
        <div
          key={i.label}
          className={cn(
            "rounded-2xl border bg-card p-4",
            i.tone === "primary" && "border-primary/30 ring-1 ring-primary/15",
            i.tone === "success" && "border-emerald-500/30 ring-1 ring-emerald-500/10",
            i.tone === "neutral" && "border-border",
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {i.label}
          </div>
          <div className="mt-1 text-xl font-bold">{i.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── KPI cards ────────────────────────────── */

export function KpiCard({
  label,
  value,
  delta,
  format = "number",
}: {
  label: string;
  value: number;
  delta?: number;
  format?: "number" | "bdt" | "percent";
}) {
  const positive = (delta ?? 0) >= 0;
  const display =
    format === "bdt" ? fmtBDT(value) : format === "percent" ? `${value}%` : value.toLocaleString();
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{display}</div>
      {typeof delta === "number" && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            positive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}% vs prev
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}

/* ────────────────────────── CSV exporter ──────────────────────────── */

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[\",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(",")]
    .concat(rows.map((r) => headers.map((h) => escape(r[h])).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
