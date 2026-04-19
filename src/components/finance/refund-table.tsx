import { useState } from "react";
import { Check, X, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RefundRequest } from "./types";

// Mock seed — replace with backend query when refunds table exists.
const seed: RefundRequest[] = [
  {
    id: "rf_001",
    bookingId: "BKG-1042",
    customer: "Tahsin Ahmed",
    amount: 1800,
    currency: "BDT",
    reason: "Provider arrived 2hrs late, job incomplete",
    status: "pending",
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "rf_002",
    bookingId: "BKG-1031",
    customer: "Nusrat Jahan",
    amount: 950,
    currency: "BDT",
    reason: "Wrong service category booked",
    status: "pending",
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
  {
    id: "rf_003",
    bookingId: "BKG-1019",
    customer: "Rakib Hossain",
    amount: 3200,
    currency: "BDT",
    reason: "Damaged equipment during AC repair",
    status: "approved",
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "rf_004",
    bookingId: "BKG-1008",
    customer: "Sadia Khan",
    amount: 600,
    currency: "BDT",
    reason: "Duplicate booking",
    status: "rejected",
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
  },
];

function fmt(n: number, cur: string) {
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function RefundRequestsTable() {
  const [rows, setRows] = useState<RefundRequest[]>(seed);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [q, setQ] = useState("");

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (q) {
      const t = q.toLowerCase();
      return (
        r.customer.toLowerCase().includes(t) ||
        r.bookingId.toLowerCase().includes(t) ||
        r.reason.toLowerCase().includes(t)
      );
    }
    return true;
  });

  function decide(id: string, status: "approved" | "rejected") {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, decidedAt: new Date().toISOString() } : r,
      ),
    );
    toast.success(`Refund ${status}`);
  }

  function reopen(id: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "pending", decidedAt: null } : r)),
    );
    toast.message("Refund reopened");
  }

  const counts = {
    all: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <h3 className="mr-auto text-sm font-semibold text-foreground">Refund requests</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search booking or customer"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-8 w-[200px] pl-7 text-xs"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                filter === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s} <span className="text-[10px] opacity-60">({counts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No refund requests match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.bookingId}</TableCell>
                  <TableCell className="text-sm">{r.customer}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground" title={r.reason}>
                    {r.reason}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.requestedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    {fmt(r.amount, r.currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        r.status === "approved" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                        r.status === "rejected" && "bg-rose-500/15 text-rose-700 dark:text-rose-400",
                        r.status === "pending" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => decide(r.id, "approved")}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-rose-600 hover:text-rose-700"
                          onClick={() => decide(r.id, "rejected")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => reopen(r.id)}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Reopen
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
