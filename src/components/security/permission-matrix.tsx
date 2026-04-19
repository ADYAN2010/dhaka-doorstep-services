import { Lock, ShieldAlert, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  PERMISSION_GROUPS,
  securityService,
  useSecuritySnapshot,
  type PermissionKey,
  type Role,
} from "@/services/security";

const ROLE_COLOR: Record<string, string> = {
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

export function RoleBadge({ role, size = "sm" }: { role: Role; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        ROLE_COLOR[role.color] ?? ROLE_COLOR.slate,
      )}
    >
      {role.protected && <Lock className="h-2.5 w-2.5" />}
      {role.name}
    </span>
  );
}

export function PermissionMatrix() {
  const { roles } = useSecuritySnapshot();

  function toggle(roleId: Role["id"], key: PermissionKey, granted: boolean) {
    const role = roles.find((r) => r.id === roleId);
    if (role?.protected) {
      toast.error(`${role.name} is a protected role and cannot be modified.`);
      return;
    }
    securityService.togglePermission(roleId, key, granted);
    securityService.recordEvent({
      actorId: "u_1",
      actorName: "You",
      action: granted ? "Granted permission" : "Revoked permission",
      category: "permission",
      target: `${role?.name} → ${key}`,
      targetType: "role",
      severity: granted ? "info" : "warning",
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">Role permission matrix</div>
            <div className="text-xs text-muted-foreground">
              {roles.length} roles · {PERMISSION_GROUPS.reduce((n, g) => n + g.permissions.length, 0)} permissions across{" "}
              {PERMISSION_GROUPS.length} groups
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 sm:inline-flex">
            <ShieldAlert className="h-3 w-3" /> Sensitive permissions marked
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              securityService.resetRoles();
              toast.success("Role permissions reset to defaults");
            }}
            className="h-8 text-xs"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="sticky left-0 z-10 border-b border-border bg-muted/50 px-4 py-3">
                Permission
              </th>
              {roles.map((r) => (
                <th
                  key={r.id}
                  className="border-b border-border px-3 py-3 text-center"
                  style={{ minWidth: 110 }}
                >
                  <RoleBadge role={r} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => (
              <PermissionGroupRows
                key={group.id}
                group={group}
                roles={roles}
                onToggle={toggle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionGroupRows({
  group,
  roles,
  onToggle,
}: {
  group: (typeof PERMISSION_GROUPS)[number];
  roles: Role[];
  onToggle: (roleId: Role["id"], key: PermissionKey, granted: boolean) => void;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={roles.length + 1}
          className="sticky left-0 border-b border-border bg-surface px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground"
        >
          {group.name}
          <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">
            · {group.description}
          </span>
        </td>
      </tr>
      {group.permissions.map((p) => (
        <tr key={p.key} className="group transition-colors hover:bg-muted/40">
          <td className="sticky left-0 z-[1] border-b border-border bg-card px-4 py-2 align-top group-hover:bg-muted/40">
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {p.key}
              </code>
              {p.sensitive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300">
                  <ShieldAlert className="h-2.5 w-2.5" /> sensitive
                </span>
              )}
            </div>
            <div className="mt-1 text-sm font-medium">{p.label}</div>
            <div className="text-[11px] text-muted-foreground">{p.description}</div>
          </td>
          {roles.map((r) => {
            const checked = r.permissions.includes(p.key);
            return (
              <td
                key={r.id}
                className="border-b border-border px-3 py-2 text-center align-middle"
              >
                <Checkbox
                  checked={checked}
                  disabled={r.protected}
                  onCheckedChange={(v) => onToggle(r.id, p.key, Boolean(v))}
                  className={cn(
                    "mx-auto",
                    r.protected && "opacity-60",
                    p.sensitive && checked && "border-amber-500 data-[state=checked]:bg-amber-500",
                  )}
                  aria-label={`${p.label} for ${r.name}`}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
