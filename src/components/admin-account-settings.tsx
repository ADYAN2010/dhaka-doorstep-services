/**
 * Legacy admin account settings — being migrated.
 * Admin password change now lives in /admin/backend (MySQL JWT flow).
 */
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export function AdminAccountSettings() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-semibold text-card-foreground">Admin account settings</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin auth has moved to the new MySQL backend. Sign in to the new admin console
            to change your password and manage admin users.
          </p>
          <Link
            to="/admin/backend"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Open admin console
          </Link>
        </div>
      </div>
    </div>
  );
}
