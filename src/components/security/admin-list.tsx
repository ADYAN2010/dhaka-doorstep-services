import { useMemo, useState } from "react";
import {
  Search, MoreVertical, ShieldCheck, ShieldOff, KeyRound, UserPlus, Mail, Lock, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  securityService, useSecuritySnapshot, timeAgo, type AdminUser, type RoleId,
} from "@/services/security";
import { RoleBadge } from "./permission-matrix";

const STATUS_STYLE: Record<AdminUser["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  invited: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  suspended: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  locked: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export function AdminList() {
  const { admins, roles } = useSecuritySnapshot();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | AdminUser["status"]>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | RoleId>("all");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return admins.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (roleFilter !== "all" && a.roleId !== roleFilter) return false;
      if (ql && !`${a.name} ${a.email}`.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [admins, q, status, roleFilter]);

  function changeRole(id: string, roleId: RoleId) {
    securityService.setAdminRole(id, roleId);
    securityService.recordEvent({
      actorId: "u_1", actorName: "You",
      action: "Changed admin role", category: "security",
      target: `${admins.find((a) => a.id === id)?.name} → ${roles.find((r) => r.id === roleId)?.name}`,
      targetType: "admin", severity: "warning",
    });
    toast.success("Role updated");
  }

  function changeStatus(id: string, st: AdminUser["status"]) {
    securityService.setAdminStatus(id, st);
    securityService.recordEvent({
      actorId: "u_1", actorName: "You",
      action: st === "suspended" ? "Suspended admin" : st === "locked" ? "Locked admin" : "Reactivated admin",
      category: "security", target: admins.find((a) => a.id === id)?.name, targetType: "admin",
      severity: st === "active" ? "info" : "critical",
    });
    toast.success(`Admin ${st}`);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">Admin team</div>
            <div className="text-xs text-muted-foreground">
              {admins.length} accounts · {admins.filter((a) => a.status === "active").length} active ·{" "}
              {admins.filter((a) => a.twoFactor).length} on 2FA
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search admins…"
              className="h-8 w-44 pl-8 text-xs"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roles.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs" onClick={() => toast.success("Invite link copied to clipboard (mock)") }>
            <UserPlus className="h-3.5 w-3.5" /> Invite admin
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead>Last IP</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => {
              const role = roles.find((r) => r.id === a.roleId)!;
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={a.avatarUrl} />
                        <AvatarFallback>{a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={a.roleId} onValueChange={(v) => changeRole(a.id, v as RoleId)}>
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <RoleBadge role={role} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center gap-2">
                              <RoleBadge role={r} />
                              {r.protected && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      STATUS_STYLE[a.status],
                    )}>
                      {a.status === "active" && <CheckCircle2 className="h-2.5 w-2.5" />}
                      {a.status}
                    </span>
                    {a.restrictionReason && (
                      <div className="mt-1 max-w-[220px] text-[10px] leading-snug text-muted-foreground">
                        {a.restrictionReason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.twoFactor ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="h-3 w-3" /> Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                        <ShieldOff className="h-3 w-3" /> Off
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{timeAgo(a.lastActive)}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-mono">{a.ip ?? "—"}</div>
                    <div className="text-[10px] text-muted-foreground">{a.location ?? ""}</div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                          Account actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { securityService.toggle2FA(a.id); toast.success(a.twoFactor ? "2FA disabled" : "2FA enforced"); }}>
                          <KeyRound className="h-3.5 w-3.5" />
                          {a.twoFactor ? "Disable 2FA" : "Enforce 2FA"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success(`Password reset email sent to ${a.email}`)}>
                          <Mail className="h-3.5 w-3.5" /> Send reset link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { securityService.revokeAllSessionsFor(a.id, false); toast.success("All sessions revoked"); }}>
                          <Lock className="h-3.5 w-3.5" /> Revoke all sessions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {a.status !== "active" ? (
                          <DropdownMenuItem onClick={() => changeStatus(a.id, "active")}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate account
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => changeStatus(a.id, "suspended")}>
                              <ShieldOff className="h-3.5 w-3.5" /> Suspend account
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => changeStatus(a.id, "locked")}>
                              <Lock className="h-3.5 w-3.5" /> Lock account
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No admins match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
