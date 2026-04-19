import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ProtectedScreen = {
  key: string;
  name: string;
  permission: string;
  description: string;
  defaultLocked: boolean;
};

const SCREENS: ProtectedScreen[] = [
  { key: "finance",   name: "Finance & payouts",     permission: "finance.payout", description: "Issue payouts, view ledger, export financial reports", defaultLocked: true },
  { key: "refunds",   name: "Refund processing",     permission: "finance.refund", description: "Approve and issue refunds against bookings", defaultLocked: true },
  { key: "admins",    name: "Admin management",      permission: "security.manage_admins", description: "Add, remove or modify admin accounts", defaultLocked: true },
  { key: "audit",     name: "Audit log export",      permission: "security.audit", description: "Download full audit history", defaultLocked: false },
  { key: "settings",  name: "Branding & settings",   permission: "settings.edit", description: "Modify identity, theme, and operational settings", defaultLocked: true },
  { key: "suspend",   name: "Account restrictions",  permission: "security.restrict", description: "Suspend, lock, or rate-limit any account", defaultLocked: true },
];

export function ProtectedScreens() {
  const [stepUp, setStepUp] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SCREENS.map((s) => [s.key, s.defaultLocked])),
  );

  function toggle(k: string, v: boolean) {
    setStepUp((s) => ({ ...s, [k]: v }));
    toast.success(v ? "Step-up auth enforced for this screen" : "Step-up auth removed");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Lock className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Protected settings screens</div>
          <div className="text-xs text-muted-foreground">
            Require step-up authentication (re-enter password + 2FA code) before accessing sensitive surfaces.
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {SCREENS.map((s) => (
          <li
            key={s.key}
            className={cn(
              "flex items-start justify-between gap-4 rounded-xl border bg-background p-4 transition-colors",
              stepUp[s.key] ? "border-primary/30 bg-primary/5" : "border-border",
            )}
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg",
                  stepUp[s.key] ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {stepUp[s.key] ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{s.name}</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {s.permission}
                  </code>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{s.description}</p>
              </div>
            </div>
            <Switch
              checked={stepUp[s.key]}
              onCheckedChange={(v) => toggle(s.key, v)}
              aria-label={`Toggle step-up auth for ${s.name}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
