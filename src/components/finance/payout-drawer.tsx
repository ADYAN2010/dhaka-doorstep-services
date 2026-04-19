import { useEffect, useState } from "react";
import { Loader2, Receipt, Wallet, CalendarRange, Hash, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PayoutLite } from "./types";

type LedgerLine = {
  id: string;
  category: string;
  provider_net: number;
  gross_amount: number;
  commission_amount: number;
  created_at: string;
};

interface Props {
  payout: PayoutLite | null;
  providerName?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function fmt(n: number, cur = "BDT") {
  return `${cur} ${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PayoutDetailsDrawer({ payout, providerName, open, onOpenChange }: Props) {
  const [lines, setLines] = useState<LedgerLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !payout) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: items } = await supabase
        .from("payout_items")
        .select("ledger_id")
        .eq("payout_id", payout.id);
      const ids = (items ?? []).map((i) => i.ledger_id);
      if (ids.length === 0) {
        if (!cancelled) {
          setLines([]);
          setLoading(false);
        }
        return;
      }
      const { data: ledger } = await supabase
        .from("commission_ledger")
        .select("id, category, provider_net, gross_amount, commission_amount, created_at")
        .in("id", ids);
      if (cancelled) return;
      setLines((ledger ?? []) as LedgerLine[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, payout]);

  if (!payout) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Payout details
          </SheetTitle>
          <SheetDescription>
            {providerName ? `For ${providerName}` : "Provider payout summary"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Total paid out
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {fmt(Number(payout.total), payout.currency)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={payout.status} />
              <Badge variant="secondary" className="text-[10px] uppercase">
                {payout.method.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Meta icon={CalendarRange} label="Period">
              {payout.periodStart && payout.periodEnd
                ? `${new Date(payout.periodStart).toLocaleDateString()} – ${new Date(payout.periodEnd).toLocaleDateString()}`
                : "Single payout"}
            </Meta>
            <Meta icon={Hash} label="Reference">
              <span className="font-mono text-xs">{payout.reference ?? "—"}</span>
            </Meta>
            <Meta icon={Receipt} label="Created">
              {new Date(payout.createdAt).toLocaleString()}
            </Meta>
            <Meta icon={Wallet} label="Paid at">
              {payout.paidAt ? new Date(payout.paidAt).toLocaleString() : "—"}
            </Meta>
          </div>

          {payout.notes && (
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3 w-3" /> Notes
              </div>
              <p className="text-sm text-foreground">{payout.notes}</p>
            </div>
          )}

          <div>
            <div className="mb-2 text-sm font-semibold text-foreground">
              Included jobs ({lines.length})
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : lines.length === 0 ? (
                <div className="px-6 py-8 text-center text-xs text-muted-foreground">
                  No ledger entries linked to this payout.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-right text-xs">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(l.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">{l.category}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">
                          {fmt(Number(l.provider_net), payout.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: PayoutLite["status"] }) {
  const cls =
    status === "paid"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : status === "failed"
        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
        : "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", cls)}>
      {status}
    </span>
  );
}
