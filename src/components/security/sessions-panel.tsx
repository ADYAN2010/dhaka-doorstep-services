import { Monitor, Smartphone, Tablet, AlertTriangle, LogOut, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { securityService, useSecuritySnapshot, timeAgo } from "@/services/security";

function deviceIcon(device: string) {
  const d = device.toLowerCase();
  if (d.includes("iphone") || d.includes("pixel") || d.includes("android")) return Smartphone;
  if (d.includes("ipad") || d.includes("tab")) return Tablet;
  return Monitor;
}

export function SessionsPanel() {
  const { sessions, admins } = useSecuritySnapshot();

  function revoke(id: string) {
    securityService.revokeSession(id);
    securityService.recordEvent({
      actorId: "u_1", actorName: "You",
      action: "Revoked session", category: "security", severity: "warning",
    });
    toast.success("Session revoked");
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">Active sessions</div>
            <div className="text-xs text-muted-foreground">
              {sessions.length} sessions · {sessions.filter((s) => s.suspicious).length} flagged as suspicious
            </div>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {sessions.map((s) => {
          const Icon = deviceIcon(s.device);
          const owner = admins.find((a) => a.id === s.adminId);
          return (
            <li
              key={s.id}
              className={cn(
                "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
                s.suspicious && "bg-amber-500/5",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl ring-2",
                    s.suspicious
                      ? "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300"
                      : "bg-muted text-foreground ring-border",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{s.device}</span>
                    {s.current && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                        This session
                      </span>
                    )}
                    {s.suspicious && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-2.5 w-2.5" /> suspicious
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {owner?.name ?? "Unknown"} · {s.browser} · {s.os}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="font-mono">{s.ip}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" /> {s.location}
                    </span>
                    <span>· started {timeAgo(s.startedAt)}</span>
                    <span>· active {timeAgo(s.lastActiveAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!s.current && (
                  <Button
                    size="sm"
                    variant={s.suspicious ? "destructive" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => revoke(s.id)}
                  >
                    <LogOut className="h-3 w-3" /> Revoke
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
