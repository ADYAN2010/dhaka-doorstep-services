import { Layers } from "lucide-react";
import { PERMISSION_GROUPS, securityService, useSecuritySnapshot } from "@/services/security";
import { RoleBadge } from "./permission-matrix";
import { cn } from "@/lib/utils";

export function RoleSummary() {
  const { roles } = useSecuritySnapshot();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Layers className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Grouped access summary</div>
          <div className="text-xs text-muted-foreground">
            How each role's access stacks up across permission groups.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {roles.map((r) => {
          const counts = securityService.countPermissionsByGroup(r.id);
          return (
            <div key={r.id} className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RoleBadge role={r} size="md" />
                  <span className="text-xs text-muted-foreground">{r.description}</span>
                </div>
                <span className="text-xs font-bold tabular-nums text-foreground">
                  {r.permissions.length} / {PERMISSION_GROUPS.reduce((n, g) => n + g.permissions.length, 0)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                {PERMISSION_GROUPS.map((g) => {
                  const c = counts[g.id];
                  const pct = c.total === 0 ? 0 : Math.round((c.granted / c.total) * 100);
                  return (
                    <div key={g.id} className="rounded-md border border-border bg-card p-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        {g.name.split(" ")[0]}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold">
                        {c.granted}/{c.total}
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full",
                            pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : pct > 0 ? "bg-sky-500" : "bg-muted-foreground/30",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
