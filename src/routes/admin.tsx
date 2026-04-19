/**
 * /admin — entry gate for the admin console.
 *
 * If the signed-in user has the `admin` role, redirect to /admin/console.
 * Otherwise, show a small landing screen that lets the very first user
 * claim admin via the `claim_first_admin()` RPC. Anyone else just sees a
 * "request access" message.
 */
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/admin")({
  component: AdminEntry,
  head: () => ({
    meta: [
      { title: "Admin · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminEntry() {
  const { user, roles, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);
  const [hasAnyAdmin, setHasAnyAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (roles.includes("admin")) {
      navigate({ to: "/admin/console/overview" });
    }
  }, [loading, user, roles, navigate]);

  // Cheap check: does any admin exist?
  useEffect(() => {
    if (!user || roles.includes("admin")) return;
    (async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (!error) setHasAnyAdmin((count ?? 0) > 0);
    })();
  }, [user, roles]);

  async function handleClaim() {
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      if (data === true) {
        toast.success("You are now the admin");
        await refresh();
        navigate({ to: "/admin/console/overview" });
      } else {
        toast.error("Admin already exists");
        setHasAnyAdmin(true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not claim admin";
      toast.error(msg);
    } finally {
      setClaiming(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roles.includes("admin")) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SiteShell>
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">Admin access</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {hasAnyAdmin === false
            ? "No admin has been set up yet. As the first signed-in user you can claim the admin role."
            : "Your account does not have admin access. Please contact an existing admin."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {hasAnyAdmin === false && (
            <Button onClick={handleClaim} disabled={claiming}>
              {claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Claim admin role
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
