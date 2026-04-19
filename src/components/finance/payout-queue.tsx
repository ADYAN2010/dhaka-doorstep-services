import { useState } from "react";
import { Loader2, Send, ShieldCheck, Clock, ChevronRight } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type QueuedProvider = {
  providerId: string;
  providerName: string;
  pendingCount: number;
  pendingNet: number;
  oldestDays: number;
  ledgerIds: string[];
};

interface Props {
  rows: QueuedProvider[];
  onPaid: () => void;
  approvalsRequired?: boolean;
}

function fmt(n: number) {
  return `BDT ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function PayoutQueue({ rows, onPaid, approvalsRequired = true }: Props) {
  const [target, setTarget] = useState<QueuedProvider | null>(null);
  const [method, setMethod] = useState<string>("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  async function submit() {
    if (!target) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("admin_create_payout", {
      _provider_id: target.providerId,
      _ledger_ids: target.ledgerIds,
      _method: method as "bank_transfer" | "bkash" | "nagad" | "cash" | "other",
      _reference: reference || undefined,
      _notes: notes || undefined,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(`Payout of ${fmt(target.pendingNet)} recorded`);
    setTarget(null);
    setReference("");
    setNotes("");
    onPaid();
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">All caught up</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No providers have pending earnings awaiting payout.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-3 border-b border-border bg-muted/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
          <div>Provider</div>
          <div>Pending jobs</div>
          <div>Oldest</div>
          <div>Net owed</div>
          <div className="text-right">Action</div>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const isApproved = !approvalsRequired || approved[r.providerId];
            const urgent = r.oldestDays >= 14;
            return (
              <li
                key={r.providerId}
                className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      urgent
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {r.providerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {r.providerName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.providerId.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{r.pendingCount}</span>
                  <span className="ml-1 text-xs text-muted-foreground md:hidden">jobs</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className={cn("h-3 w-3", urgent ? "text-rose-500" : "text-muted-foreground")} />
                  <span className={cn(urgent ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                    {r.oldestDays}d
                  </span>
                </div>
                <div className="text-sm font-bold text-foreground">{fmt(r.pendingNet)}</div>
                <div className="flex items-center justify-end gap-2">
                  {approvalsRequired && (
                    <Button
                      size="sm"
                      variant={isApproved ? "secondary" : "outline"}
                      className="h-8"
                      onClick={() =>
                        setApproved((s) => ({ ...s, [r.providerId]: !s[r.providerId] }))
                      }
                    >
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                      {isApproved ? "Approved" : "Approve"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="h-8"
                    disabled={!isApproved}
                    onClick={() => setTarget(r)}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    Pay out
                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payout</DialogTitle>
            <DialogDescription>
              {target ? `${target.providerName} · ${fmt(target.pendingNet)} across ${target.pendingCount} jobs` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Method</label>
              <Select value={method} onValueChange={setMethod}>
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
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Reference (TRX ID)</label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. BKS-78421"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remark for finance log"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1 h-3.5 w-3.5" />
              )}
              Confirm payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
