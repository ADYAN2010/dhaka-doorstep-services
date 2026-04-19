import { History, ShieldAlert, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSecuritySnapshot, timeAgo, type AuditEvent } from "@/services/security";

const ICON: Record<AuditEvent["severity"], { Icon: typeof CheckCircle2; cls: string }> = {
  info: { Icon: CheckCircle2, cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30" },
  warning: { Icon: AlertTriangle, cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30" },
  critical: { Icon: ShieldAlert, cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30" },
};

export function ActivityTimeline({ limit = 12 }: { limit?: number }) {
  const { audit } = useSecuritySnapshot();
  const items = audit.slice(0, limit);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <History className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Admin activity timeline</div>
          <div className="text-xs text-muted-foreground">Latest privileged actions across the platform</div>
        </div>
      </div>

      <ol className="relative space-y-4 pl-6">
        <span className="absolute left-[14px] top-1 bottom-1 w-px bg-border" aria-hidden />
        {items.map((e) => {
          const { Icon, cls } = ICON[e.severity];
          return (
            <li key={e.id} className="relative">
              <span
                className={cn(
                  "absolute -left-6 top-0.5 grid h-7 w-7 place-items-center rounded-full ring-2",
                  cls,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium">{e.actorName}</span>
                <span className="text-sm text-muted-foreground">{e.action.toLowerCase()}</span>
                {e.target && <span className="text-sm font-medium">· {e.target}</span>}
                {e.suspicious && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-2.5 w-2.5" /> suspicious
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{timeAgo(e.at)}</span>
                {e.ip && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-mono">{e.ip}</span>
                  </>
                )}
                {e.location && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" /> {e.location}
                    </span>
                  </>
                )}
              </div>
              {e.details && (
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{e.details}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
