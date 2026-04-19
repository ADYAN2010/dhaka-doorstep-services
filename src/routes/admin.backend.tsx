/**
 * /admin/backend — guarded layout for the Express-API admin section.
 *
 * Reads auth state from <BackendAuthProvider>. While the initial /me check
 * is in flight we render a spinner; if the user is not signed in we redirect
 * to /admin/backend/login (preserving where they came from in `?redirect=`);
 * otherwise we render the nested routes inside a small admin shell.
 */
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, LogOut, Database, ShieldCheck, KeyRound } from "lucide-react";
import { useBackendAuth } from "@/components/backend-auth-provider";

export const Route = createFileRoute("/admin/backend")({
  head: () => ({
    meta: [
      { title: "Backend Admin · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BackendAdminLayout,
});

function BackendAdminLayout() {
  const { loading, user, logout } = useBackendAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If we're already on the login page, just render it — don't redirect.
  const onLoginPage = location.pathname === "/admin/backend/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !onLoginPage) {
      navigate({
        to: "/admin/backend/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }
  }, [loading, user, onLoginPage, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Login page renders standalone — no shell.
  if (onLoginPage || !user) return <Outlet />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <Link to="/admin/backend" className="flex items-center gap-2 font-semibold">
            <Database className="h-5 w-5 text-primary" />
            <span>Shebabd · Backend Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">
              {user.full_name || user.email} ·{" "}
              <span className="capitalize">{user.role}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1 text-sm">
          <Link
            to="/admin/backend"
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
            activeOptions={{ exact: true }}
          >
            <ShieldCheck className="h-4 w-4" /> Overview
          </Link>
          <Link
            to="/admin/api-check"
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <KeyRound className="h-4 w-4" /> API check
          </Link>
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
