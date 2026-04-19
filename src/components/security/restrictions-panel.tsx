import { useState } from "react";
import { Ban, ShieldOff, Plus, Clock, User, Building2, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  securityService, useSecuritySnapshot, timeAgo, type Restriction,
} from "@/services/security";

const TYPE_LABEL: Record<Restriction["type"], { label: string; tone: string; Icon: typeof Ban }> = {
  suspend:    { label: "Suspended",  tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300", Icon: ShieldOff },
  lock:       { label: "Locked",     tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300", Icon: ShieldOff },
  ip_ban:     { label: "IP banned",  tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300", Icon: Ban },
  rate_limit: { label: "Rate-limited", tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300", Icon: Clock },
};

const TARGET_ICON: Record<Restriction["targetType"], typeof User> = {
  admin: User, customer: User, provider: Building2,
};

export function RestrictionsPanel() {
  const { restrictions } = useSecuritySnapshot();
  const active = restrictions.filter((r) => r.active);
  const lifted = restrictions.filter((r) => !r.active);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Ban className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">Account restrictions</div>
            <div className="text-xs text-muted-foreground">
              {active.length} active · {lifted.length} lifted in history
            </div>
          </div>
        </div>
        <NewRestrictionDialog />
      </div>

      <ul className="divide-y divide-border">
        {active.map((r) => (<RestrictionRow key={r.id} r={r} />))}
        {active.length === 0 && (
          <li className="p-8 text-center text-sm text-muted-foreground">No active restrictions.</li>
        )}
        {lifted.length > 0 && (
          <li className="bg-muted/30 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Recently lifted
          </li>
        )}
        {lifted.slice(0, 4).map((r) => (<RestrictionRow key={r.id} r={r} />))}
      </ul>
    </div>
  );
}

function RestrictionRow({ r }: { r: Restriction }) {
  const t = TYPE_LABEL[r.type];
  const TIcon = TARGET_ICON[r.targetType];
  return (
    <li className={cn("flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between", !r.active && "opacity-60")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", t.tone)}>
          <t.Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{r.targetName}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", t.tone)}>
              {t.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
              <TIcon className="h-2.5 w-2.5" /> {r.targetType}
            </span>
            {!r.active && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                Lifted
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{r.reason}</p>
          <div className="mt-1 text-[11px] text-muted-foreground">
            By <span className="font-medium text-foreground">{r.createdBy}</span> · {timeAgo(r.createdAt)}
          </div>
        </div>
      </div>
      {r.active && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => {
            securityService.liftRestriction(r.id);
            securityService.recordEvent({
              actorId: "u_1", actorName: "You",
              action: "Lifted restriction", category: "security",
              target: `${r.targetName} (${TYPE_LABEL[r.type].label})`,
              severity: "warning",
            });
            toast.success("Restriction lifted");
          }}
        >
          Lift restriction
        </Button>
      )}
    </li>
  );
}

function NewRestrictionDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    targetType: Restriction["targetType"];
    targetName: string;
    type: Restriction["type"];
    reason: string;
  }>({ targetType: "customer", targetName: "", type: "suspend", reason: "" });

  function submit() {
    if (!form.targetName.trim() || !form.reason.trim()) {
      toast.error("Target and reason are required");
      return;
    }
    securityService.addRestriction({
      targetType: form.targetType,
      targetName: form.targetName.trim(),
      targetId: form.targetName.trim().toLowerCase().replace(/\s+/g, "_"),
      type: form.type,
      reason: form.reason.trim(),
      createdBy: "You",
    });
    securityService.recordEvent({
      actorId: "u_1", actorName: "You",
      action: `Applied ${TYPE_LABEL[form.type].label.toLowerCase()} restriction`,
      category: "security", target: form.targetName, severity: "critical",
    });
    toast.success("Restriction created");
    setOpen(false);
    setForm({ targetType: "customer", targetName: "", type: "suspend", reason: "" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs"><Plus className="h-3 w-3" /> New restriction</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply account restriction</DialogTitle>
          <DialogDescription>This action is logged in the audit trail and notifies the account owner.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target type</Label>
              <Select value={form.targetType} onValueChange={(v) => setForm({ ...form, targetType: v as Restriction["targetType"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="provider">Provider</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Restriction type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Restriction["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspend">Suspend</SelectItem>
                  <SelectItem value="lock">Lock</SelectItem>
                  <SelectItem value="ip_ban">IP ban</SelectItem>
                  <SelectItem value="rate_limit">Rate-limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Target name / identifier</Label>
            <Input value={form.targetName} onChange={(e) => setForm({ ...form, targetName: e.target.value })} placeholder="e.g. Hasan M. or 45.67.12.88" />
          </div>
          <div>
            <Label>Reason (visible in audit log)</Label>
            <Textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe the reason for the restriction" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Apply restriction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export for layout convenience
export { Globe };
