import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export type CategorySlice = { name: string; value: number };
export type AreaBar = { area: string; value: number };

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--accent-foreground))",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#a855f7",
  "#ef4444",
  "#3b82f6",
];

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

export function CategoryEarningsChart({ data }: { data: CategorySlice[] }) {
  const filtered = useMemo(
    () => data.filter((d) => d.value > 0).slice(0, 8),
    [data],
  );
  if (filtered.length === 0) {
    return <EmptyChart label="No category earnings yet" />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={2}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v: number) => [`৳${Number(v).toLocaleString()}`, "Earnings"]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AreaRevenueChart({ data }: { data: AreaBar[] }) {
  const filtered = useMemo(
    () => data.filter((d) => d.value > 0).slice(0, 10),
    [data],
  );
  if (filtered.length === 0) {
    return <EmptyChart label="No area revenue yet" />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={filtered} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="area"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={fmtCompact}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v: number) => [`৳${Number(v).toLocaleString()}`, "Revenue"]}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}
