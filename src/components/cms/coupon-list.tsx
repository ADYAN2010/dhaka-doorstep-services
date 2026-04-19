import { useEffect, useState } from "react";
import { Copy, Loader2, Pause, Pencil, Play, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  marketingService,
  type Coupon,
  type CouponStatus,
  type CouponType,
} from "@/services/marketing";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<CouponStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  paused: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ended: "bg-muted text-muted-foreground",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
};

function formatValue(c: Coupon) {
  if (c.type === "percent") return `${c.value}%`;
  if (c.type === "amount") return `৳${c.value}`;
  return "Free service";
}

export function CouponList() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    setItems(await marketingService.listCoupons());
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function toggle(id: string) {
    await marketingService.toggleCoupon(id);
    toast.success("Coupon updated");
    void load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await marketingService.removeCoupon(id);
    toast.success("Coupon deleted");
    void load();
  }
  function copy(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Discounts
          </div>
          <div className="text-base font-semibold">Coupons</div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> New coupon
        </Button>
      </div>
      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => {
                const pct = Math.min(100, (c.uses / Math.max(1, c.cap)) * 100);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {c.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{formatValue(c)}</div>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.appliesTo === "all"
                        ? "Anything"
                        : c.appliesTo === "first_booking"
                          ? "First booking"
                          : `${c.appliesTo}: ${c.appliesValue}`}
                      {c.minSpend && (
                        <div className="text-muted-foreground">min ৳{c.minSpend}</div>
                      )}
                    </TableCell>
                    <TableCell className="w-44">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {c.uses}/{c.cap}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.startsAt).toLocaleDateString()} –{" "}
                      {new Date(c.endsAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          STATUS_TONE[c.status],
                        )}
                      >
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => copy(c.code)}
                          aria-label="Copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {c.status !== "ended" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => toggle(c.id)}
                            aria-label="Toggle"
                          >
                            {c.status === "active" ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditing(c);
                            setOpen(true);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(c.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <CouponEditor
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={() => {
          setOpen(false);
          void load();
        }}
      />
    </div>
  );
}

function CouponEditor({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Coupon | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "percent" as CouponType,
    value: 10,
    cap: 100,
    status: "active" as CouponStatus,
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    appliesTo: "all" as Coupon["appliesTo"],
    appliesValue: "",
    minSpend: 0,
  });
  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code,
        description: editing.description,
        type: editing.type,
        value: editing.value,
        cap: editing.cap,
        status: editing.status,
        startsAt: editing.startsAt.slice(0, 10),
        endsAt: editing.endsAt.slice(0, 10),
        appliesTo: editing.appliesTo,
        appliesValue: editing.appliesValue ?? "",
        minSpend: editing.minSpend ?? 0,
      });
    } else {
      setForm({
        code: "",
        description: "",
        type: "percent",
        value: 10,
        cap: 100,
        status: "active",
        startsAt: new Date().toISOString().slice(0, 10),
        endsAt: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        appliesTo: "all",
        appliesValue: "",
        minSpend: 0,
      });
    }
  }, [editing, open]);

  async function save() {
    if (!form.code.trim() || !form.description.trim()) {
      toast.error("Code and description are required");
      return;
    }
    await marketingService.saveCoupon({
      id: editing?.id,
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value) || 0,
      cap: Number(form.cap) || 100,
      status: form.status,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      appliesTo: form.appliesTo,
      appliesValue: form.appliesValue.trim() || undefined,
      minSpend: Number(form.minSpend) || undefined,
    });
    toast.success(editing ? "Coupon updated" : "Coupon created");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Tag className="mr-1 inline h-4 w-4 text-primary" />
            {editing ? "Edit coupon" : "New coupon"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="WELCOME20"
              />
            </div>
            <div>
              <Label>Discount type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as CouponType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent off</SelectItem>
                  <SelectItem value="amount">BDT amount off</SelectItem>
                  <SelectItem value="freeService">Free service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Max uses</Label>
              <Input
                type="number"
                value={form.cap}
                onChange={(e) => setForm((f) => ({ ...f, cap: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Min spend</Label>
              <Input
                type="number"
                value={form.minSpend}
                onChange={(e) => setForm((f) => ({ ...f, minSpend: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Applies to</Label>
              <Select
                value={form.appliesTo}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, appliesTo: v as Coupon["appliesTo"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Anything</SelectItem>
                  <SelectItem value="first_booking">First booking only</SelectItem>
                  <SelectItem value="category">Specific category</SelectItem>
                  <SelectItem value="city">Specific city</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {form.appliesTo === "category"
                  ? "Category"
                  : form.appliesTo === "city"
                    ? "City"
                    : "Filter value"}
              </Label>
              <Input
                value={form.appliesValue}
                onChange={(e) => setForm((f) => ({ ...f, appliesValue: e.target.value }))}
                disabled={form.appliesTo === "all" || form.appliesTo === "first_booking"}
                placeholder={form.appliesTo === "category" ? "AC repair" : "Gulshan"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starts</Label>
              <Input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ends</Label>
              <Input
                type="date"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v as CouponStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? "Save coupon" : "Create coupon"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
