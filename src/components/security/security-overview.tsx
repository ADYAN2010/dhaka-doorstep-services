import { ShieldCheck, Users, AlertTriangle, KeyRound, ShieldAlert, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSecuritySnapshot, PERMISSION_GROUPS } from "@/services/security";

export function SecurityOverview() {
  const { admins, sessions, restrictions, audit, roles } = useSecuritySnapshot();
  const flagged = audit.filter((e) => e.suspicious || e.severity === "critical").length;
  const without2fa = admins.filter((a) => !a.twoFactor && a.status === "active").length;
  const totalPerms = PERMISSION_GROUPS.reduce((n, g) => n + g.permissions.length, 0);
  const sensitive = PERMISSION_GROUPS.flatMap((g) => g.permissions).filter((p) => p.sensitive).length;

  const items = [
    {
      label: "Active admins", value: admins.filter((a) => a.status === "active").length,
      hint: `${admins.length} total accounts`, Icon: Users, tone: "sky",
    },
    {
      label: "Active sessions", value: sessions.length,
      hint: `${sessions.filter((s) => s.suspicious).length} suspicious`,
      Icon: Activity, tone: sessions.some((s) => s.suspicious) ? "amber" : "emerald",
    },
    {
      label: "Suspicious events (7d)", value: flagged,
      hint: `${audit.length} total audited`, Icon: AlertTriangle,
      tone: flagged > 0 ? "amber" : "emerald",
    },
    {
      label: "Active restrictions", value: restrictions.filter((r) => r.active).length,
      hint: `${restrictions.length} all-time`, Icon: ShieldAlert,
      tone: restrictions.filter((r) => r.active).length > 3 ? "rose" : "slate",
    },
    {
      label: "Admins without 2FA", value: without2fa,
      hint: without2fa > 0 ? "Action recommended" : "All protected",
      Icon: KeyRound, tone: without2fa > 0 ? "amber" : "emerald",
    },
    {
      label: "Permissions tracked", value: totalPerms,
      hint: `${sensitive} sensitive · ${roles.length} roles`,
      Icon: ShieldCheck, tone: "indigo",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((it) => (
        <Card key={it.label} {...it} />
      ))}
    </div>
  );
}

const TONE: Record<string, string> = {
  sky: "from-sky-500/10 text-sky-700 dark:text-sky-300",
  emerald: "from-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber: "from-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "from-rose-500/10 text-rose-700 dark:text-rose-300",
  slate: "from-slate-500/10 text-slate-700 dark:text-slate-300",
  indigo: "from-indigo-500/10 text-indigo-700 dark:text-indigo-300",
};

function Card({
  label, value, hint, Icon, tone,
}: { label: string; value: number; hint: string; Icon: typeof ShieldCheck; tone: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br to-card p-4 shadow-soft", TONE[tone])}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-background/60">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
