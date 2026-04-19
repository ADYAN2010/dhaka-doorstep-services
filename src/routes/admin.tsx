/**
 * /admin — top-level pass-through layout.
 *
 * The legacy Supabase-backed admin dashboard that used to live here has been
 * retired in favour of the new MySQL-backed consoles at:
 *   • /admin/backend/*   — Express API admin (JWT login)
 *   • /admin/console/*   — Operations console
 *   • /admin/mysql/*     — Raw MySQL data views
 *
 * This file just renders an <Outlet /> so child routes (including their own
 * login screens) are not blocked by an auth gate at this level.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      { title: "Admin · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLayout() {
  return <Outlet />;
}
