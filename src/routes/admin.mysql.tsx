import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Database, LayoutDashboard, Users, Briefcase, CalendarCheck, Tag, MapPin } from "lucide-react";
import { toast } from "sonner";
import { adminLogout, getCurrentAdmin } from "@/utils/admin.functions";
import type { AdminUser } from "@/server/types";

export const Route = createFileRoute("/admin/mysql")({
  component: MysqlAdminLayout,
  head: () => ({
    meta: [
      { title: "Admin (MySQL) · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function MysqlAdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getCurrentAdmin()
      .then((res) => {
        if (cancelled) return;
        setUser(res.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogout() {
    await adminLogout();
    toast.success("Signed out");
    navigate({ to: "/admin/mysql/login" });
  }

  if (user === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in → render only the outlet (login page handles itself).
  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <Link to="/admin/mysql" className="flex items-center gap-2 font-semibold">
            <Database className="h-5 w-5 text-primary" />
            <span>Shebabd · MySQL Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">
              {user.full_name} · <span className="capitalize">{user.role}</span>
            </span>
            <button
              type="button"
              onClick={onLogout}
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
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{
                className: "bg-primary/10 text-primary font-medium",
              }}
              activeOptions={{ exact: item.to === "/admin/mysql" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const NAV = [
  { to: "/admin/mysql", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/mysql/customers", label: "Customers", icon: Users },
  { to: "/admin/mysql/providers", label: "Providers", icon: Briefcase },
  { to: "/admin/mysql/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/mysql/services", label: "Services", icon: Tag },
  { to: "/admin/mysql/locations", label: "Locations", icon: MapPin },
] as const;
