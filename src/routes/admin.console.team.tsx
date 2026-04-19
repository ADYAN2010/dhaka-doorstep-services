import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Loader2, Trash2, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/console/team")({
  component: TeamPage,
});

type RoleRow = {
  id: string;
  user_id: string;
  role: "customer" | "provider" | "admin";
};
type Member = {
  user_id: string;
  full_name: string;
  roles: RoleRow["role"][];
  roleIds: { id: string; role: RoleRow["role"] }[];
};

function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailQuery, setEmailQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    // Pull all admins + moderators (non-customer/provider). We surface admin team here.
    const { data: roles, error: rerr } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .eq("role", "admin");
    if (rerr) {
      setError(rerr.message);
      setLoading(false);
      return;
    }
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as { id: string; full_name: string }[] };

    const byUser = new Map<string, Member>();
    (roles as RoleRow[]).forEach((r) => {
      const existing = byUser.get(r.user_id);
      const profileName = profiles?.find((p) => p.id === r.user_id)?.full_name ?? "—";
      if (existing) {
        existing.roles.push(r.role);
        existing.roleIds.push({ id: r.id, role: r.role });
      } else {
        byUser.set(r.user_id, {
          user_id: r.user_id,
          full_name: profileName,
          roles: [r.role],
          roleIds: [{ id: r.id, role: r.role }],
        });
      }
    });
    setMembers(Array.from(byUser.values()));
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function revokeAdmin(userId: string) {
    const me = (await supabase.auth.getUser()).data.user;
    if (me?.id === userId) return toast.error("You can't revoke your own admin role here.");
    if (!confirm("Revoke admin from this user?")) return;
    setBusy(userId);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Admin revoked");
    void load();
  }

  async function grantAdmin() {
    if (!emailQuery.trim()) return toast.error("Enter an email or user ID");
    // Look up by exact id first; fall back to a profile name search if it looks like a name.
    const term = emailQuery.trim();
    const isUuid = /^[0-9a-f-]{36}$/i.test(term);
    let userId: string | null = null;
    if (isUuid) userId = term;
    else {
      const { data: p } = await supabase.from("profiles").select("id, full_name").ilike("full_name", `%${term}%`).limit(2);
      if (!p || p.length === 0) return toast.error("No matching user. Paste their user id instead.");
      if (p.length > 1) return toast.error("Multiple matches — paste the exact user id.");
      userId = p[0].id;
    }
    setBusy(userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    setBusy(null);
    if (error) return toast.error(error.message);
    setEmailQuery("");
    toast.success("Admin granted");
    void load();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Security"
        title="Team & roles"
        description="The administrators who can access this console."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Team" }]}
      />

      <SectionCard title="Grant admin access" icon={ShieldCheck} description="Paste a user id or search by full name.">
        <div className="flex gap-2">
          <Input placeholder="user-id or full name" value={emailQuery} onChange={(e) => setEmailQuery(e.target.value)} />
          <Button onClick={grantAdmin} disabled={!!busy}>Grant admin</Button>
        </div>
      </SectionCard>

      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : members.length === 0 ? (
          <div className="p-5"><EmptyState icon={Users} title="No administrators" description="Grant admin access above to start building your team." /></div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium">{m.full_name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{m.user_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {m.roles.map((r) => <StatusPill key={r} label={r} tone="primary" />)}
                  <Button size="sm" variant="ghost" disabled={busy === m.user_id} onClick={() => revokeAdmin(m.user_id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
