import { useMemo, useState } from "react";
import {
  Search, Download, Activity, AlertTriangle, ShieldAlert, MapPin,
  Filter, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  useSecuritySnapshot, timeAgo, type AuditEvent,
} from "@/services/security";

const SEVERITY_STYLE: Record<AuditEvent["severity"], string> = {
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  critical: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const CATEGORY_LABEL: Record<AuditEvent["category"], string> = {
  auth: "Authentication",
  permission: "Permissions",
  booking: "Bookings",
  finance: "Finance",
  provider: "Providers",
  settings: "Settings",
  security: "Security",
  support: "Support",
};

export function AuditLog() {
  const { audit } = useSecuritySnapshot();
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState<"all" | AuditEvent["severity"]>("all");
  const [category, setCategory] = useState<"all" | AuditEvent["category"]>("all");
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return audit.filter((e) => {
      if (severity !== "all" && e.severity !== severity) return false;
      if (category !== "all" && e.category !== category) return false;
      if (onlyFlagged && !e.suspicious && e.severity !== "critical") return false;
      if (ql && !`${e.action} ${e.actorName} ${e.target ?? ""} ${e.ip ?? ""}`.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [audit, q, severity, category, onlyFlagged]);

  function exportCsv() {
    const rows = [
      ["Time", "Actor", "Action", "Category", "Target", "IP", "Location", "Severity", "Suspicious"],
      ...filtered.map((e) => [
        new Date(e.at).toISOString(), e.actorName, e.action, e.category,
        e.target ?? "", e.ip ?? "", e.location ?? "", e.severity, e.suspicious ? "yes" : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">Audit log</div>
            <div className="text-xs text-muted-foreground">
              Every privileged action across the platform · {filtered.length} of {audit.length} entries
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actor, action, IP…" className="h-8 w-56 pl-8 text-xs" />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severity</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={onlyFlagged ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setOnlyFlagged((v) => !v)}
          >
            <Filter className="h-3 w-3" /> Flagged only
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportCsv}>
            <Download className="h-3 w-3" /> Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP / Location</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <AuditRow key={e.id} event={e} />
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No events match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AuditRow({ event: e }: { event: AuditEvent }) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(e.details);
  return (
    <>
      <TableRow className={cn(e.suspicious && "bg-amber-500/5", e.severity === "critical" && "bg-rose-500/5")}>
        <TableCell>
          {hasDetail ? (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          ) : (
            <span className="block w-6" />
          )}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          <div>{timeAgo(e.at)}</div>
          <div className="font-mono text-[10px]">{new Date(e.at).toLocaleString()}</div>
        </TableCell>
        <TableCell>
          <div className="text-sm font-medium">{e.actorName}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{CATEGORY_LABEL[e.category]}</div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 text-sm">
            {e.action}
            {e.suspicious && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-2.5 w-2.5" /> suspicious
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-xs">{e.target ?? "—"}</TableCell>
        <TableCell className="text-xs">
          {e.ip ? (
            <>
              <div className="font-mono">{e.ip}</div>
              {e.location && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  {e.location}
                </div>
              )}
            </>
          ) : "—"}
        </TableCell>
        <TableCell>
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            SEVERITY_STYLE[e.severity],
          )}>
            {e.severity === "critical" && <ShieldAlert className="h-2.5 w-2.5" />}
            {e.severity}
          </span>
        </TableCell>
      </TableRow>
      {hasDetail && open && (
        <TableRow className="bg-muted/30">
          <TableCell />
          <TableCell colSpan={6} className="py-3 text-xs text-muted-foreground">
            <div className="rounded-md border border-border bg-background p-3">
              {e.details}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
