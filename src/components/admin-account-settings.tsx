/**
 * Admin account settings entry point — links to the dedicated admin console.
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
            Manage your password and admin users from the admin console.
          </p>
          <Link
            to="/admin/console"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Open admin console
          </Link>
        </div>
      </div>
    </div>
  );
}
