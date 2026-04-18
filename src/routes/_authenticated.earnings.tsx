import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { SiteShell } from "@/components/site-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: EarningsPage,
  head: () => ({
    meta: [
      { title: "Earnings · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type LedgerRow = {
  id: string;
  booking_id: string;
  category: string;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  provider_net: number;
  currency: string;
  paid_out: boolean;
  payout_id: string | null;
  created_at: string;
};

type PayoutRow = {
  id: string;
  total_net: number;
  currency: string;
  method: string;
  reference: string | null;
  status: string;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

function fmt(n: number, cur: string = "BDT") {
  return `${cur} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function EarningsPage() {
  const { user, roles } = useAuth();
  const isProvider = roles.includes("provider");
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: l, error: le }, { data: p, error: pe }] = await Promise.all([
        supabase
          .from("commission_ledger")
          .select("id, booking_id, category, gross_amount, commission_rate, commission_amount, provider_net, currency, paid_out, payout_id, created_at")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payouts")
          .select("id, total_net, currency, method, reference, status, paid_at, period_start, period_end, created_at")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (le) toast.error(le.message);
      if (pe) toast.error(pe.message);
      setLedger((l ?? []) as LedgerRow[]);
      setPayouts((p ?? []) as PayoutRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const totals = useMemo(() => {
    let lifetimeGross = 0;
    let lifetimeNet = 0;
    let pending = 0;
    let paidOut = 0;
    ledger.forEach((r) => {
      lifetimeGross += Number(r.gross_amount);
      lifetimeNet += Number(r.provider_net);
      if (r.paid_out) paidOut += Number(r.provider_net);
      else pending += Number(r.provider_net);
    });
    return { lifetimeGross, lifetimeNet, pending, paidOut };
  }, [ledger]);

  if (!isProvider) {
    return (
      <SiteShell>
        <div className="container-page py-12 text-center">
          <p className="text-sm text-muted-foreground">Earnings are only available for providers.</p>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container-page py-6 md:py-10">
        <h1 className="mb-1 text-2xl font-bold tracking-tight md:text-3xl">Earnings</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Track jobs completed, commission deducted, and payouts received.
        </p>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Lifetime gross" value={fmt(totals.lifetimeGross)} icon={<TrendingUp className="h-4 w-4" />} />
              <Stat label="Lifetime net" value={fmt(totals.lifetimeNet)} icon={<Wallet className="h-4 w-4" />} />
              <Stat label="Pending payout" value={fmt(totals.pending)} accent />
              <Stat label="Paid out" value={fmt(totals.paidOut)} />
            </div>

            <h2 className="mb-2 text-sm font-semibold text-foreground">Commission ledger</h2>
            <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
              {ledger.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No completed jobs yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Your net</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">{r.category}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(Number(r.gross_amount), r.currency)}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            -{fmt(Number(r.commission_amount), r.currency)} ({Number(r.commission_rate)}%)
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold">
                            {fmt(Number(r.provider_net), r.currency)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                r.paid_out
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {r.paid_out ? "Paid out" : "Pending"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <h2 className="mb-2 text-sm font-semibold text-foreground">Payouts received</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {payouts.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No payouts yet. Pending earnings will be paid out by the Shebabd team.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(p.paid_at ?? p.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {p.period_start && p.period_end
                              ? `${new Date(p.period_start).toLocaleDateString()} – ${new Date(p.period_end).toLocaleDateString()}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm capitalize">{p.method.replace("_", " ")}</TableCell>
                          <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                          <TableCell className="text-right text-sm font-semibold">
                            {fmt(Number(p.total_net), p.currency)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                              {p.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}

function Stat({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-4 ${
        accent ? "border-primary/30 ring-1 ring-primary/20" : "border-border"
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-lg font-bold ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
