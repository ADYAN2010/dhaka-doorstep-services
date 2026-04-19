import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Wallet } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: EarningsPage,
});

type LedgerRow = {
  id: string;
  category: string;
  gross_amount: number;
  commission_amount: number;
  provider_net: number;
  paid_out: boolean;
  created_at: string;
};

function EarningsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("commission_ledger")
        .select("id, category, gross_amount, commission_amount, provider_net, paid_out, created_at")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as LedgerRow[]);
      setLoading(false);
    })();
  }, [user]);

  const totalGross = rows.reduce((s, r) => s + Number(r.gross_amount), 0);
  const totalNet = rows.reduce((s, r) => s + Number(r.provider_net), 0);
  const pending = rows.filter((r) => !r.paid_out).reduce((s, r) => s + Number(r.provider_net), 0);

  return (
    <SiteShell>
      <section className="container-page py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Earnings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your commission ledger and pending payouts.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Stat label="Gross billed" value={`৳${totalGross.toFixed(0)}`} />
          <Stat label="Your net" value={`৳${totalNet.toFixed(0)}`} />
          <Stat label="Pending payout" value={`৳${pending.toFixed(0)}`} highlight />
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-semibold">Ledger</div>
          </div>
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">No earnings yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-right">Gross</th>
                    <th className="px-3 py-2 text-right">Commission</th>
                    <th className="px-3 py-2 text-right">Net</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2 capitalize">{r.category}</td>
                      <td className="px-3 py-2 text-right">৳{Number(r.gross_amount).toFixed(0)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">−৳{Number(r.commission_amount).toFixed(0)}</td>
                      <td className="px-3 py-2 text-right font-semibold">৳{Number(r.provider_net).toFixed(0)}</td>
                      <td className="px-3 py-2"><span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${r.paid_out ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}`}>{r.paid_out ? "paid" : "pending"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-5 shadow-soft ${highlight ? "border-primary/40" : "border-border"}`}>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
