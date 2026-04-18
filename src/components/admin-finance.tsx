import { useEffect, useMemo, useState } from "react";
import { Loader2, Wallet, Receipt, TrendingUp, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Category = {
  id: string;
  slug: string;
  name: string;
  commission_rate: number;
  is_active: boolean;
};

type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  method: string;
  gateway: string;
  status: string;
  created_at: string;
  notes: string | null;
};

type Ledger = {
  id: string;
  provider_id: string;
  category: string;
  gross_amount: number;
  commission_amount: number;
  provider_net: number;
  paid_out: boolean;
  created_at: string;
};

type Profile = { id: string; full_name: string };

type Payout = {
  id: string;
  provider_id: string;
  total_net: number;
  method: string;
  reference: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

function fmt(n: number, cur: string = "BDT") {
  return `${cur} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminFinance() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creatingPayoutFor, setCreatingPayoutFor] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<string>("bank_transfer");
  const [payoutRef, setPayoutRef] = useState("");

  async function load() {
    setLoading(true);
    const [c, p, l, po] = await Promise.all([
      supabase.from("categories").select("id, slug, name, commission_rate, is_active").order("name"),
      supabase
        .from("payments")
        .select("id, booking_id, amount, currency, method, gateway, status, created_at, notes")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("commission_ledger")
        .select("id, provider_id, category, gross_amount, commission_amount, provider_net, paid_out, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("payouts")
        .select("id, provider_id, total_net, method, reference, status, paid_at, created_at")
        .order("created_at", { ascending: false }),
    ]);
    setCategories((c.data ?? []) as Category[]);
    setPayments((p.data ?? []) as Payment[]);
    setLedger((l.data ?? []) as Ledger[]);
    setPayouts((po.data ?? []) as Payout[]);

    const ids = Array.from(
      new Set([
        ...(l.data ?? []).map((r) => r.provider_id),
        ...(po.data ?? []).map((r) => r.provider_id),
      ]),
    );
    if (ids.length > 0) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      const m: Record<string, Profile> = {};
      (prof ?? []).forEach((p) => (m[p.id] = p as Profile));
      setProfiles(m);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    let gross = 0;
    let commission = 0;
    let net = 0;
    let pendingPayout = 0;
    let paidOut = 0;
    ledger.forEach((r) => {
      gross += Number(r.gross_amount);
      commission += Number(r.commission_amount);
      net += Number(r.provider_net);
      if (r.paid_out) paidOut += Number(r.provider_net);
      else pendingPayout += Number(r.provider_net);
    });
    const collected = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { gross, commission, net, pendingPayout, paidOut, collected };
  }, [ledger, payments]);

  const pendingByProvider = useMemo(() => {
    const map: Record<string, Ledger[]> = {};
    ledger
      .filter((r) => !r.paid_out)
      .forEach((r) => {
        const arr = map[r.provider_id] ?? [];
        arr.push(r);
        map[r.provider_id] = arr;
      });
    return map;
  }, [ledger]);

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

  async function createPayout(providerId: string) {
    const rows = pendingByProvider[providerId] ?? [];
    if (rows.length === 0) return;
    setCreatingPayoutFor(providerId);
    const { error } = await supabase.rpc("admin_create_payout", {
      _provider_id: providerId,
      _ledger_ids: rows.map((r) => r.id),
      _method: payoutMethod as "bank_transfer" | "bkash" | "nagad" | "cash" | "other",
      _reference: payoutRef || undefined,
    });
    setCreatingPayoutFor(null);
    if (error) return toast.error(error.message);
    toast.success("Payout recorded");
    setPayoutRef("");
    void load();
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ledger">Commission ledger</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="categories">Category rates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {loading ? (
            <Loader2 className="mx-auto my-12 h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Total collected" value={fmt(totals.collected)} icon={<Wallet className="h-4 w-4" />} />
              <Stat label="Gross (completed)" value={fmt(totals.gross)} icon={<TrendingUp className="h-4 w-4" />} />
              <Stat label="Platform commission" value={fmt(totals.commission)} accent />
              <Stat label="Owed to providers" value={fmt(totals.pendingPayout)} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {loading ? (
              <Loader2 className="mx-auto my-12 h-5 w-5 animate-spin text-muted-foreground" />
            ) : payments.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No payments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.booking_id.slice(0, 8)}…
                        </TableCell>
                        <TableCell className="text-sm capitalize">{p.method.replace("_", " ")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.gateway}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {fmt(Number(p.amount), p.currency)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              p.status === "paid"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : p.status === "refunded"
                                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            }`}
                          >
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
        </TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {loading ? (
              <Loader2 className="mx-auto my-12 h-5 w-5 animate-spin text-muted-foreground" />
            ) : ledger.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No commissions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Net to provider</TableHead>
                      <TableHead>Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">{profiles[r.provider_id]?.full_name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{r.category}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(Number(r.gross_amount))}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {fmt(Number(r.commission_amount))}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {fmt(Number(r.provider_net))}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              r.paid_out
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {r.paid_out ? "Paid" : "Pending"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="mt-4 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Create payout</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Select payout method and reference, then click "Pay out" next to a provider with pending earnings.
            </p>
            <div className="grid gap-3 md:grid-cols-[200px_1fr]">
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Reference (transaction ID, slip number, etc.)"
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
              />
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              {Object.keys(pendingByProvider).length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No providers with pending earnings.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Pending jobs</TableHead>
                      <TableHead className="text-right">Pending net</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(pendingByProvider).map(([providerId, rows]) => {
                      const total = rows.reduce((s, r) => s + Number(r.provider_net), 0);
                      return (
                        <TableRow key={providerId}>
                          <TableCell className="text-sm">
                            {profiles[providerId]?.full_name ?? providerId.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-right text-sm">{rows.length}</TableCell>
                          <TableCell className="text-right text-sm font-semibold">
                            {fmt(total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => createPayout(providerId)}
                              disabled={creatingPayoutFor === providerId}
                            >
                              {creatingPayoutFor === providerId ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-3.5 w-3.5" />
                              )}
                              Pay out
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Payout history</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No payouts yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.paid_at ?? p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">{profiles[p.provider_id]?.full_name ?? "—"}</TableCell>
                        <TableCell className="text-sm capitalize">{p.method.replace("_", " ")}</TableCell>
                        <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{fmt(Number(p.total_net))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {loading ? (
              <Loader2 className="mx-auto my-12 h-5 w-5 animate-spin text-muted-foreground" />
            ) : categories.length === 0 ? (
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
    </div>
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
          {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
          Save
        </Button>
      </TableCell>
    </TableRow>
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
    <div className={`rounded-2xl border bg-card p-4 ${accent ? "border-primary/30 ring-1 ring-primary/20" : "border-border"}`}>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon ?? <Receipt className="h-4 w-4" />}
        {label}
      </div>
      <div className={`text-lg font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
