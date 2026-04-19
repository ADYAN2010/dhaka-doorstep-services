import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Lock, ShieldCheck, KeyRound, Smartphone, Monitor, AlertTriangle,
  CheckCircle2, Activity, Save, LogOut, Trash2, Search,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/console/security")({
  component: SecurityPage,
});

type AuditEntry = {
  id: string; action: string; actor: string; target: string; ip: string;
  severity: "info" | "warning" | "critical"; at: string;
};
type Session = {
  id: string; device: string; browser: string; ip: string; location: string; lastActive: string; current?: boolean;
};

const SEED_AUDIT: AuditEntry[] = [
  { id: "a1", action: "Approved provider application", actor: "admin@servicehub.bd", target: "Riad H. (electrician)", ip: "103.16.71.42", severity: "info", at: new Date(Date.now() - 5 * 60_000).toISOString() },
  { id: "a2", action: "Granted admin role", actor: "admin@servicehub.bd", target: "ops@servicehub.bd", ip: "103.16.71.42", severity: "warning", at: new Date(Date.now() - 27 * 60_000).toISOString() },
  { id: "a3", action: "Failed login (5 attempts)", actor: "unknown", target: "admin@servicehub.bd", ip: "45.155.205.99", severity: "critical", at: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { id: "a4", action: "Updated commission rate", actor: "admin@servicehub.bd", target: "Cleaning · 12% → 15%", ip: "103.16.71.42", severity: "info", at: new Date(Date.now() - 4 * 3600_000).toISOString() },
  { id: "a5", action: "Created payout", actor: "admin@servicehub.bd", target: "৳28,400 → bKash 017xxxx", ip: "103.16.71.42", severity: "info", at: new Date(Date.now() - 6 * 3600_000).toISOString() },
  { id: "a6", action: "Deleted review", actor: "admin@servicehub.bd", target: "Review #84a2 (abusive)", ip: "103.16.71.42", severity: "warning", at: new Date(Date.now() - 10 * 3600_000).toISOString() },
  { id: "a7", action: "Password changed", actor: "admin@servicehub.bd", target: "Self", ip: "103.16.71.42", severity: "info", at: new Date(Date.now() - 26 * 3600_000).toISOString() },
  { id: "a8", action: "Bulk export — customers.csv", actor: "admin@servicehub.bd", target: "1,284 rows", ip: "103.16.71.42", severity: "warning", at: new Date(Date.now() - 2 * 86400_000).toISOString() },
];

const SEED_SESSIONS: Session[] = [
  { id: "s1", device: "MacBook Pro", browser: "Chrome 130", ip: "103.16.71.42", location: "Dhaka, BD", lastActive: "Just now", current: true },
  { id: "s2", device: "iPhone 15", browser: "Safari Mobile", ip: "103.16.72.18", location: "Dhaka, BD", lastActive: "2h ago" },
  { id: "s3", device: "Windows PC", browser: "Edge 129", ip: "103.16.50.7", location: "Chittagong, BD", lastActive: "Yesterday" },
];

function SecurityPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Security"
        title="Security & audit"
        description="Monitor admin activity, manage sessions, and configure platform-wide security policies."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" /> All systems secure
          </span>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PostureCard icon={CheckCircle2} label="2FA enabled" value="3/4 admins" tone="ok" />
        <PostureCard icon={AlertTriangle} label="Failed logins (24h)" value="12" tone="warn" />
        <PostureCard icon={Activity} label="Admin actions (24h)" value="48" tone="info" />
        <PostureCard icon={ShieldCheck} label="Last security scan" value="2h ago" tone="ok" />
      </div>

      <Tabs defaultValue="audit">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="audit"><Activity className="h-3.5 w-3.5" /> Audit log</TabsTrigger>
          <TabsTrigger value="sessions"><Monitor className="h-3.5 w-3.5" /> Active sessions</TabsTrigger>
          <TabsTrigger value="policy"><Lock className="h-3.5 w-3.5" /> Password policy</TabsTrigger>
          <TabsTrigger value="2fa"><Smartphone className="h-3.5 w-3.5" /> Two-factor</TabsTrigger>
        </TabsList>

        <TabsContent value="audit"><AuditTab /></TabsContent>
        <TabsContent value="sessions"><SessionsTab /></TabsContent>
        <TabsContent value="policy"><PolicyTab /></TabsContent>
        <TabsContent value="2fa"><TwoFactorTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PostureCard({ icon: Icon, label, value, tone }: { icon: typeof ShieldCheck; label: string; value: string; tone: "ok" | "warn" | "info" }) {
  const styles =
    tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" :
    tone === "warn" ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400" :
    "border-primary/30 bg-primary/5 text-primary";
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${styles}`}>
      <div className="flex items-center gap-2 text-xs"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function AuditTab() {
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState<"all" | "info" | "warning" | "critical">("all");
  const filtered = SEED_AUDIT.filter((e) => {
    if (severity !== "all" && e.severity !== severity) return false;
    if (q && ![e.action, e.actor, e.target, e.ip].some((v) => v.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions, actors, IPs…" className="pl-9" />
        </div>
        <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => toast.success("Audit log exported")}>Export</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.action}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.actor}</TableCell>
                <TableCell className="text-sm">{e.target}</TableCell>
                <TableCell className="font-mono text-xs">{e.ip}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    e.severity === "critical" ? "bg-destructive/15 text-destructive" :
                    e.severity === "warning" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                    "bg-muted text-muted-foreground"
                  }`}>{e.severity}</span>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No audit entries match.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SessionsTab() {
  const [sessions, setSessions] = useState(SEED_SESSIONS);
  function revoke(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session revoked");
  }
  function revokeAll() {
    setSessions((prev) => prev.filter((s) => s.current));
    toast.success("All other sessions revoked");
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={revokeAll}><LogOut className="h-3.5 w-3.5" /> Sign out all other sessions</Button>
      </div>
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
            <Monitor className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{s.device} · {s.browser}</span>
              {s.current && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">This device</span>}
            </div>
            <div className="text-xs text-muted-foreground">{s.location} · {s.ip} · {s.lastActive}</div>
          </div>
          {!s.current && (
            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => revoke(s.id)}>
              <Trash2 className="h-3.5 w-3.5" /> Revoke
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function PolicyTab() {
  const [minLength, setMinLength] = useState("12");
  const [requireUpper, setRequireUpper] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSymbol, setRequireSymbol] = useState(true);
  const [rotateDays, setRotateDays] = useState("90");
  const [maxAttempts, setMaxAttempts] = useState("5");
  const [hibp, setHibp] = useState(true);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><KeyRound className="h-4 w-4" /></span>
        <div>
          <div className="text-sm font-semibold">Password & login policy</div>
          <div className="text-xs text-muted-foreground">Applies to all admin and provider accounts.</div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label>Min length</Label><Input type="number" value={minLength} onChange={(e) => setMinLength(e.target.value)} /></div>
        <div><Label>Rotate after (days)</Label><Input type="number" value={rotateDays} onChange={(e) => setRotateDays(e.target.value)} /></div>
        <div><Label>Lockout after (failed)</Label><Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} /></div>
      </div>
      <div className="mt-4 space-y-3">
        <ToggleRow label="Require uppercase" description="At least one A-Z character" value={requireUpper} onChange={setRequireUpper} />
        <ToggleRow label="Require number" description="At least one 0-9 character" value={requireNumber} onChange={setRequireNumber} />
        <ToggleRow label="Require symbol" description="At least one special character" value={requireSymbol} onChange={setRequireSymbol} />
        <ToggleRow label="Block leaked passwords (HIBP)" description="Reject passwords found in known breach databases" value={hibp} onChange={setHibp} />
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => toast.success("Policy updated")}><Save className="h-3.5 w-3.5" /> Save policy</Button>
      </div>
    </div>
  );
}

function TwoFactorTab() {
  const [enforceAdmin, setEnforceAdmin] = useState(true);
  const [enforceProvider, setEnforceProvider] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [appEnabled, setAppEnabled] = useState(true);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Smartphone className="h-4 w-4" /></span>
        <div>
          <div className="text-sm font-semibold">Two-factor authentication</div>
          <div className="text-xs text-muted-foreground">Extra verification on sensitive accounts.</div>
        </div>
      </div>
      <div className="space-y-3">
        <ToggleRow label="Enforce 2FA for admins" description="Required on every login" value={enforceAdmin} onChange={setEnforceAdmin} />
        <ToggleRow label="Enforce 2FA for providers" description="Required for provider role" value={enforceProvider} onChange={setEnforceProvider} />
        <ToggleRow label="Allow SMS code" description="One-time code sent to verified phone" value={smsEnabled} onChange={setSmsEnabled} />
        <ToggleRow label="Allow authenticator app" description="TOTP apps like Google Authenticator, 1Password, Authy" value={appEnabled} onChange={setAppEnabled} />
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => toast.success("2FA settings saved")}><Save className="h-3.5 w-3.5" /> Save</Button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/60 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  );
}
