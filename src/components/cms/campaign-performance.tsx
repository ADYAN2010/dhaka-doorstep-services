import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Loader2,
  MousePointerClick,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  marketingService,
  type CampaignPerf,
  type UserSegment,
} from "@/services/marketing";
import { cn } from "@/lib/utils";

export function CampaignPerformanceCards() {
  const [items, setItems] = useState<CampaignPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<CampaignPerf["channel"] | "all">("all");

  async function load() {
    setLoading(true);
    setItems(await marketingService.listCampaigns());
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => (channel === "all" ? items : items.filter((c) => c.channel === channel)),
    [items, channel],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Campaigns
          </div>
          <div className="text-base font-semibold">Performance overview</div>
        </div>
        <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
            <SelectItem value="push">Push</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const ctr = c.reach ? (c.engaged / c.reach) * 100 : 0;
            const cvr = c.engaged ? (c.converted / c.engaged) * 100 : 0;
            const cac = c.converted ? Math.round(c.spend / c.converted) : 0;
            return (
              <article
                key={c.id}
                className="rounded-2xl border border-border bg-background p-4 shadow-soft transition-shadow hover:shadow-elevated"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {c.channel}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      c.status === "live"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : c.status === "paused"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : c.status === "draft"
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                            : "bg-muted text-muted-foreground",
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                <h3 className="mt-2 line-clamp-1 font-semibold">{c.name}</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat icon={Users} label="Reach" value={c.reach} />
                  <Stat icon={MousePointerClick} label="CTR" value={`${ctr.toFixed(1)}%`} />
                  <Stat icon={Activity} label="CVR" value={`${cvr.toFixed(1)}%`} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">
                    Spend: <span className="font-semibold text-foreground">৳{c.spend.toLocaleString()}</span>
                  </span>
                  <span className="text-muted-foreground">
                    CAC: <span className="font-semibold text-foreground">৳{cac.toLocaleString()}</span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-semibold",
                      c.trend > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : c.trend < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {c.trend > 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : c.trend < 0 ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : null}
                    {Math.abs(c.trend)}%
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <Icon className="mx-auto h-3 w-3 text-muted-foreground" />
      <div className="mt-1 text-sm font-bold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

/* ───────────────────────── User segment filters ──────────────────────── */

export function UserSegmentFilters() {
  const [items, setItems] = useState<UserSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [lifecycle, setLifecycle] = useState<string>("all");

  async function load() {
    setLoading(true);
    setItems(await marketingService.listSegments());
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((s) => {
        if (q && !`${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        if (lifecycle !== "all" && s.filters.lifecycle !== lifecycle) return false;
        return true;
      }),
    [items, q, lifecycle],
  );

  const totalAudience = filtered.reduce((s, x) => s + x.audience, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Audience
          </div>
          <div className="text-base font-semibold">User segments</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search segments…"
              className="h-8 w-44 pl-7 text-xs"
            />
          </div>
          <Select value={lifecycle} onValueChange={setLifecycle}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lifecycle</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="lapsed">Lapsed</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
            <TrendingUp className="-mt-0.5 mr-1 inline h-3 w-3" />
            {totalAudience.toLocaleString()} users
          </span>
        </div>
      </div>
      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Filter className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.description}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(s.filters).map(([k, v]) =>
                    v == null || v === "" ? null : (
                      <span
                        key={k}
                        className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {k}: {String(v)}
                      </span>
                    ),
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{s.audience.toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  audience
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
