import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Wallet,
  TrendingUp,
  Send,
  Save,
  Receipt,
  PieChart as PieIcon,
  Building2,
  Coins,
  AlertCircle,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FinanceFiltersBar,
  SummaryCardsRow,
  ChartCard,
  CategoryEarningsChart,
  AreaRevenueChart,
  PayoutQueue,
  PayoutDetailsDrawer,
  RefundRequestsTable,
  type QueuedProvider,
  type FinanceFilters,
  type PayoutLite,
  type FinanceTransaction,
  type CategorySlice,
  type AreaBar,
} from "@/components/finance";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  slug: string;
  name: string;
  commission_rate: number;
  is_active: boolean;
};

type PaymentRow = {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  method: string;
  gateway: string;
  gateway_ref: string | null;
  status: string;
  created_at: string;
};

type Ledger = {
  id: string;
  provider_id: string;
  category: string;
  gross_amount: number;
  commission_amount: number;
  provider_net: number;
  paid_out: boolean;
  payout_id: string | null;
  created_at: string;
};

type Booking = {
  id: string;
  full_name: string;
  area: string;
  category: string;
  provider_id: string | null;
};

type Profile = { id: string; full_name: string };

type PayoutRow = {
  id: string;
  provider_id: string;
  total_net: number;
  currency: string;
  method: string;
  reference: string | null;
  status: "pending" | "paid" | "failed";
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  notes: string | null;
};

type Invoice = {
  id: string;
  booking_id: string;
  invoice_number: string;
  total: number;
  currency: string;
  status: string;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
};

function fmt(n: number, cur: string = "BDT") {
  return `${cur} ${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function inRange(iso: string, f: FinanceFilters) {
  if (f.from && new Date(iso) < new Date(f.from)) return false;
  if (f.to && new Date(iso) > new Date(f.to)) return false;
  return true;
}

export function AdminFinance() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FinanceFilters>({});
  const [drawerPayout, setDrawerPayout] = useState<PayoutLite | null>(null);

  async function load() {
    setLoading(true);
    const [c, p, l, po, inv] = await Promise.all([
      supabase.from("categories").select("id, slug, name, commission_rate, is_active").order("name"),
      supabase
        .from("payments")
        .select("id, booking_id, amount, currency, method, gateway, gateway_ref, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("commission_ledger")
        .select(
          "id, provider_id, category, gross_amount, commission_amount, provider_net, paid_out, payout_id, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("payouts")
        .select(
          "id, provider_id, total_net, currency, method, reference, status, paid_at, period_start, period_end, created_at, notes",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("id, booking_id, invoice_number, total, currency, status, issued_at, paid_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setCategories((c.data ?? []) as Category[]);
    setPayments((p.data ?? []) as PaymentRow[]);
    setLedger((l.data ?? []) as Ledger[]);
    setPayouts((po.data ?? []) as PayoutRow[]);
    setInvoices((inv.data ?? []) as Invoice[]);

    const bookingIds = Array.from(
      new Set([
        ...(p.data ?? []).map((r) => r.booking_id),
        ...(inv.data ?? []).map((r) => r.booking_id),
      ]),
    );
    if (bookingIds.length > 0) {
      const { data: bs } = await supabase
        .from("bookings")
        .select("id, full_name, area, category, provider_id")
        .in("id", bookingIds);
      const m: Record<string, Booking> = {};
      (bs ?? []).forEach((b) => (m[b.id] = b as Booking));
      setBookings(m);
    }

    const providerIds = Array.from(
      new Set([
        ...(l.data ?? []).map((r) => r.provider_id),
        ...(po.data ?? []).map((r) => r.provider_id),
      ]),
    );
    if (providerIds.length > 0) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", providerIds);
      const m: Record<string, Profile> = {};
      (prof ?? []).forEach((pr) => (m[pr.id] = pr as Profile));
      setProfiles(m);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  // ---- Derived data with filters applied ---------------------------------

  const filteredLedger = useMemo(() => {
    return ledger.filter((r) => {
      if (!inRange(r.created_at, filters)) return false;
      if (filters.providerId && r.provider_id !== filters.providerId) return false;
      if (filters.category && r.category !== filters.category) return false;
      return true;
    });
  }, [ledger, filters]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!inRange(p.created_at, filters)) return false;
      if (filters.status && p.status !== filters.status) return false;
      const b = bookings[p.booking_id];
      if (filters.providerId && b?.provider_id !== filters.providerId) return false;
      if (filters.category && b?.category !== filters.category) return false;
      return true;
    });
  }, [payments, bookings, filters]);

  const transactions: FinanceTransaction[] = useMemo(
    () =>
      filteredPayments.map((p) => {
        const b = bookings[p.booking_id];
        return {
          id: p.id,
          bookingId: p.booking_id,
          date: p.created_at,
          customer: b?.full_name ?? null,
          provider: b?.provider_id ? profiles[b.provider_id]?.full_name ?? null : null,
          category: b?.category ?? null,
          area: b?.area ?? null,
          method: p.method,
          gateway: p.gateway,
          status: p.status as FinanceTransaction["status"],
          amount: Number(p.amount),
          currency: p.currency,
          reference: p.gateway_ref,
        };
      }),
    [filteredPayments, bookings, profiles],
  );

  const totals = useMemo(() => {
    let gross = 0;
    let commission = 0;
    let net = 0;
    let pendingPayout = 0;
    let paidOut = 0;
    filteredLedger.forEach((r) => {
      gross += Number(r.gross_amount);
      commission += Number(r.commission_amount);
      net += Number(r.provider_net);
      if (r.paid_out) paidOut += Number(r.provider_net);
      else pendingPayout += Number(r.provider_net);
    });
    const collected = filteredPayments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.amount), 0);
    const refunded = filteredPayments
      .filter((p) => p.status === "refunded")
      .reduce((s, p) => s + Number(p.amount), 0);
    return { gross, commission, net, pendingPayout, paidOut, collected, refunded };
  }, [filteredLedger, filteredPayments]);

  const categorySeries: CategorySlice[] = useMemo(() => {
    const m = new Map<string, number>();
    filteredLedger.forEach((r) => {
      m.set(r.category, (m.get(r.category) ?? 0) + Number(r.gross_amount));
    });
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLedger]);

  const areaSeries: AreaBar[] = useMemo(() => {
    const m = new Map<string, number>();
    filteredPayments
      .filter((p) => p.status === "paid")
      .forEach((p) => {
        const b = bookings[p.booking_id];
        const area = b?.area ?? "Unknown";
        m.set(area, (m.get(area) ?? 0) + Number(p.amount));
      });
    return Array.from(m.entries())
      .map(([area, value]) => ({ area, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPayments, bookings]);

  const queue: QueuedProvider[] = useMemo(() => {
    const map = new Map<string, Ledger[]>();
    filteredLedger
      .filter((r) => !r.paid_out)
      .forEach((r) => {
        const arr = map.get(r.provider_id) ?? [];
        arr.push(r);
        map.set(r.provider_id, arr);
      });
    return Array.from(map.entries())
      .map(([providerId, rows]) => {
        const oldest = rows.reduce(
          (acc, r) => Math.min(acc, new Date(r.created_at).getTime()),
          Date.now(),
        );
        return {
          providerId,
          providerName: profiles[providerId]?.full_name ?? providerId.slice(0, 8),
          pendingCount: rows.length,
          pendingNet: rows.reduce((s, r) => s + Number(r.provider_net), 0),
          oldestDays: Math.max(0, Math.floor((Date.now() - oldest) / 86_400_000)),
          ledgerIds: rows.map((r) => r.id),
        };
      })
      .sort((a, b) => b.pendingNet - a.pendingNet);
  }, [filteredLedger, profiles]);

  const filteredPayouts = useMemo(
    () =>
      payouts.filter((p) => {
        if (!inRange(p.created_at, filters)) return false;
        if (filters.providerId && p.provider_id !== filters.providerId) return false;
        if (filters.status && p.status !== filters.status) return false;
        return true;
      }),
    [payouts, filters],
  );

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((i) => {
        if (!inRange(i.created_at, filters)) return false;
        if (filters.status && i.status !== filters.status) return false;
        const b = bookings[i.booking_id];
        if (filters.providerId && b?.provider_id !== filters.providerId) return false;
        if (filters.category && b?.category !== filters.category) return false;
        return true;
      }),
    [invoices, bookings, filters],
  );

  const providerOptions = useMemo(
    () =>
      Object.values(profiles)
        .map((p) => ({ value: p.id, label: p.full_name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [profiles],
  );

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.name, label: c.name })),
    [categories],
  );

  async function saveRate(cat: Category, value: string) {
    const rate = Number(value);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error("Rate must be 0–100");
      return;
    }
    setSavingId(cat.id);
    const { error } = await supabase
      .from("categories")
      .update({ commission_rate: rate })
      .eq("id", cat.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success(`${cat.name}: ${rate}%`);
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, commission_rate: rate } : c)));
  }

  function openPayoutDrawer(p: PayoutRow) {
    setDrawerPayout({
      id: p.id,
      providerId: p.provider_id,
      total: Number(p.total_net),
      currency: p.currency,
      method: p.method,
      reference: p.reference,
      status: p.status,
      paidAt: p.paid_at,
      periodStart: p.period_start,
      periodEnd: p.period_end,
      createdAt: p.created_at,
      notes: p.notes,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FinanceFiltersBar
        value={filters}
        onChange={setFilters}
        providers={providerOptions}
        categories={categoryOptions}
        statuses={[
          { value: "paid", label: "Paid" },
          { value: "pending", label: "Pending" },
          { value: "failed", label: "Failed" },
          { value: "refunded", label: "Refunded" },
        ]}
      />

      <SummaryCardsRow
        cards={[
          {
            label: "Collected",
            value: fmt(totals.collected),
            icon: Wallet,
            accent: "primary",
            hint: `${filteredPayments.filter((p) => p.status === "paid").length} payments`,
          },
          {
            label: "Gross GMV",
            value: fmt(totals.gross),
            icon: TrendingUp,
            accent: "neutral",
            hint: `${filteredLedger.length} jobs`,
          },
          {
            label: "Commission",
            value: fmt(totals.commission),
            icon: Coins,
            accent: "success",
            hint:
              totals.gross > 0
                ? `${((totals.commission / totals.gross) * 100).toFixed(1)}% effective`
                : "—",
          },
          {
            label: "Owed to providers",
            value: fmt(totals.pendingPayout),
            icon: Send,
            accent: totals.pendingPayout > 0 ? "warning" : "neutral",
            hint: `${queue.length} providers waiting`,
          },
        ]}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">
            <PieIcon className="mr-1.5 h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Receipt className="mr-1.5 h-3.5 w-3.5" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="payouts">
            <Send className="mr-1.5 h-3.5 w-3.5" /> Payouts
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="mr-1.5 h-3.5 w-3.5" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="refunds">
            <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Refunds
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Building2 className="mr-1.5 h-3.5 w-3.5" /> Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Earnings by category"
              subtitle="Gross volume per service category"
            >
              <CategoryEarningsChart data={categorySeries} />
            </ChartCard>
            <ChartCard title="Revenue by area" subtitle="Top areas by collected payments">
              <AreaRevenueChart data={areaSeries} />
            </ChartCard>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Top providers by net earnings
            </h3>
            <TopProvidersTable ledger={filteredLedger} profiles={profiles} />
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <TransactionsList rows={transactions} />
        </TabsContent>

        <TabsContent value="payouts" className="mt-4 space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Payout queue
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Approve, then record payment
                </span>
              </h3>
            </div>
            <PayoutQueue rows={queue} onPaid={() => void load()} />
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border p-3">
              <h3 className="text-sm font-semibold text-foreground">Payout history</h3>
            </div>
            <div className="overflow-x-auto">
              {filteredPayouts.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No payouts in this filter range.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.paid_at ?? p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {profiles[p.provider_id]?.full_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {p.method.replace("_", " ")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {fmt(Number(p.total_net), p.currency)}
                        </TableCell>
                        <TableCell>
                          <PayoutStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7"
                            onClick={() => openPayoutDrawer(p)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesAdminList rows={filteredInvoices} bookings={bookings} />
        </TabsContent>

        <TabsContent value="refunds" className="mt-4">
          <RefundRequestsTable />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {categories.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No categories yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Commission rate (%)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <CategoryRow
                      key={c.id}
                      cat={c}
                      saving={savingId === c.id}
                      onSave={(v) => saveRate(c, v)}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <PayoutDetailsDrawer
        payout={drawerPayout}
        providerName={
          drawerPayout ? profiles[drawerPayout.providerId]?.full_name : undefined
        }
        open={!!drawerPayout}
        onOpenChange={(o) => !o && setDrawerPayout(null)}
      />
    </div>
  );
}

function TransactionsList({ rows }: { rows: FinanceTransaction[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        No transactions match your filters.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">{t.customer ?? "—"}</TableCell>
                <TableCell className="text-sm">{t.provider ?? "—"}</TableCell>
                <TableCell className="text-xs">{t.category ?? "—"}</TableCell>
                <TableCell className="text-sm capitalize">
                  {t.method.replace("_", " ")}
                </TableCell>
                <TableCell className="font-mono text-xs">{t.reference ?? "—"}</TableCell>
                <TableCell className="text-right text-sm font-semibold">
                  {fmt(t.amount, t.currency)}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={t.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function InvoicesAdminList({
  rows,
  bookings,
}: {
  rows: Invoice[];
  bookings: Record<string, Booking>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        No invoices in this filter range.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((i) => {
              const b = bookings[i.booking_id];
              return (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                  <TableCell className="text-sm">{b?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{b?.category ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(i.issued_at ?? i.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {fmt(Number(i.total), i.currency)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={i.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TopProvidersTable({
  ledger,
  profiles,
}: {
  ledger: Ledger[];
  profiles: Record<string, Profile>;
}) {
  const rows = useMemo(() => {
    const m = new Map<string, { net: number; jobs: number }>();
    ledger.forEach((r) => {
      const cur = m.get(r.provider_id) ?? { net: 0, jobs: 0 };
      cur.net += Number(r.provider_net);
      cur.jobs += 1;
      m.set(r.provider_id, cur);
    });
    return Array.from(m.entries())
      .map(([id, s]) => ({ id, name: profiles[id]?.full_name ?? id.slice(0, 8), ...s }))
      .sort((a, b) => b.net - a.net)
      .slice(0, 8);
  }, [ledger, profiles]);

  if (rows.length === 0) {
    return (
      <div className="px-2 py-6 text-center text-xs text-muted-foreground">
        No earnings data yet.
      </div>
    );
  }

  const max = rows[0].net || 1;

  return (
    <ul className="space-y-2">
      {rows.map((r, idx) => (
        <li key={r.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">{idx + 1}.</span>
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">{r.name}</span>
              <span className="text-xs text-muted-foreground">{r.jobs} jobs</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(r.net / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">
            {fmt(r.net)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CategoryRow({
  cat,
  saving,
  onSave,
}: {
  cat: Category;
  saving: boolean;
  onSave: (v: string) => void;
}) {
  const [val, setVal] = useState(String(cat.commission_rate));
  return (
    <TableRow>
      <TableCell className="text-sm">{cat.name}</TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          step="0.5"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="ml-auto w-24 text-right"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSave(val)}
          disabled={saving || val === String(cat.commission_rate)}
        >
          {saving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1 h-3.5 w-3.5" />
          )}
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        status === "paid" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        status === "refunded" && "bg-rose-500/15 text-rose-700 dark:text-rose-400",
        status === "failed" && "bg-rose-500/15 text-rose-700 dark:text-rose-400",
        status === "pending" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      )}
    >
      {status}
    </span>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        status === "paid" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        status === "failed" && "bg-rose-500/15 text-rose-700 dark:text-rose-400",
        status === "pending" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      )}
    >
      {status}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        status === "paid" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        status === "issued" && "bg-blue-500/15 text-blue-700 dark:text-blue-400",
        status === "void" && "bg-muted text-muted-foreground",
        status === "draft" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      )}
    >
      {status}
    </span>
  );
}
