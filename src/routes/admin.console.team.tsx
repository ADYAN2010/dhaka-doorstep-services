import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Loader2, UserPlus, UserMinus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/team")({
  component: TeamPage,
});

type Role = "customer" | "provider" | "admin";
type RoleEntry = { user_id: string; full_name: string | null; email: string | null; roles: Role[] };

function TeamPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const [rolesRes, profilesRes] = await Promise.all([
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("profiles").select("id, full_name"),
    ]);
    if (rolesRes.error) { toast.error(rolesRes.error.message); setLoading(false); return; }
    const nameById = new Map<string, string>();
    (profilesRes.data ?? []).forEach((p) => nameById.set(p.id, p.full_name));
    const map = new Map<string, RoleEntry>();
    (rolesRes.data ?? []).forEach((r) => {
      const cur = map.get(r.user_id) ?? { user_id: r.user_id, full_name: nameById.get(r.user_id) ?? null, email: null, roles: [] };
      cur.roles.push(r.role as Role);
      map.set(r.user_id, cur);
    });
    setRows(Array.from(map.values()).sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? "")));
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function grant(uid: string, role: Role) {
    setBusy(uid);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    void load();
  }

  async function revoke(uid: string, role: Role) {
    if (role === "admin" && user?.id === uid) return toast.error("You can't revoke your own admin role.");
    setBusy(uid);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Revoked ${role}`);
    void load();
  }

  const filtered = useMemo(() => {
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) => [r.full_name, r.user_id].some((v) => v?.toLowerCase().includes(t)));
  }, [rows, q]);

  const counts = {
    admin: rows.filter((r) => r.roles.includes("admin")).length,
    provider: rows.filter((r) => r.roles.includes("provider")).length,
    customer: rows.filter((r) => r.roles.includes("customer")).length,
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Team & Roles"
        title="Access control"
        description="Grant and revoke admin, provider, and customer roles. Only admins can change roles."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Admins" value={counts.admin} accent />
        <Stat label="Providers" value={counts.provider} />
        <Stat label="Customers" value={counts.customer} />
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or user id…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell>
                      <div className="font-medium">{r.full_name || "Unnamed"}{r.user_id === user?.id && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">You</span>}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{r.user_id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.roles.map((role) => (
                          <span key={role} className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            role === "admin" ? "bg-primary/15 text-primary" :
                            role === "provider" ? "bg-violet-500/15 text-violet-700 dark:text-violet-300" :
                            "bg-muted text-muted-foreground"
                          }`}>{role}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {(["admin", "provider", "customer"] as const).map((role) => (
                          r.roles.includes(role) ? (
                            <Button key={role} size="sm" variant="outline" onClick={() => revoke(r.user_id, role)} disabled={busy === r.user_id}>
                              <UserMinus className="h-3 w-3" /> {role}
                            </Button>
                          ) : (
                            <Button key={role} size="sm" variant="ghost" onClick={() => grant(r.user_id, role)} disabled={busy === r.user_id}>
                              <UserPlus className="h-3 w-3" /> {role}
                            </Button>
                          )
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">No users.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-soft ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
