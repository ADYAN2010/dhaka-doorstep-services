import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/console")({
  component: ConsoleLayout,
  head: () => ({
    meta: [
      { title: "Admin console · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ConsoleLayout() {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">Loading admin console…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    throw redirect({ to: "/login" });
  }

  if (!roles.includes("admin")) {
    throw redirect({ to: "/admin" });
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
