import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Method = "cash" | "card" | "bkash" | "nagad" | "bank_transfer" | "other";
type Gateway = "none" | "stripe" | "bkash" | "nagad" | "manual";

const METHOD_TO_GATEWAY: Record<Method, Gateway> = {
  cash: "manual",
  card: "manual",
  bkash: "manual",
  nagad: "manual",
  bank_transfer: "manual",
  other: "manual",
};

type Props = {
  bookingId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRecorded?: () => void;
  alsoCompleteBooking?: boolean;
};

export function RecordPaymentDialog({
  bookingId,
  open,
  onOpenChange,
  onRecorded,
  alsoCompleteBooking = false,
}: Props) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("cash");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      if (alsoCompleteBooking) {
        const { error: completeErr } = await supabase.rpc("mark_booking_completed", {
          _booking_id: bookingId,
        });
        if (completeErr) throw completeErr;
      }
      const { error } = await supabase.rpc("record_booking_payment", {
        _booking_id: bookingId,
        _amount: value,
        _method: method,
        _gateway: METHOD_TO_GATEWAY[method],
        _gateway_ref: ref || undefined,
        _status: "paid",
        _notes: notes || undefined,
      });
      if (error) throw error;
      toast.success("Payment recorded");
      setAmount("");
      setRef("");
      setNotes("");
      onOpenChange(false);
      onRecorded?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {alsoCompleteBooking ? "Complete booking & record payment" : "Record payment"}
          </DialogTitle>
          <DialogDescription>
            {alsoCompleteBooking
              ? "Mark this booking as completed and log how the customer paid. Commission will be calculated automatically."
              : "Log a payment received on this booking."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (BDT)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
            />
          </div>

          <div className="grid gap-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="nagad">Nagad</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ref">Reference (optional)</Label>
            <Input
              id="ref"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="bKash TrxID, bank ref, etc."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {alsoCompleteBooking ? "Complete & record" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
