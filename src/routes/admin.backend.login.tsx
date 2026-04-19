/**
 * /admin/backend/login — frontend login page that calls POST /api/auth/login
 * via BackendAuthProvider. After success, redirects to ?redirect=<path>
 * or to /admin/backend.
 */
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Database, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { useBackendAuth } from "@/components/backend-auth-provider";
import { ApiError } from "@/lib/api-client";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/admin/backend/login")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in · Backend Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BackendLoginPage,
});

function BackendLoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin/backend/login" });
  const { user, loading, login } = useBackendAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/admin/backend";

  // Already signed in → bounce out of /login.
  useEffect(() => {
    if (!loading && user) navigate({ to: target, replace: true });
  }, [loading, user, target, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate({ to: target, replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? "Wrong email or password."
            : err.status === 403
              ? "Account is disabled."
              : err.message,
        );
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Backend Admin</h1>
            <p className="text-xs text-muted-foreground">
              Sign in to the Express API admin console.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="admin@shobsheba.local"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This logs into the Express backend (JWT). The Lovable Cloud login at{" "}
          <Link to="/login" className="underline">/login</Link> is separate.
        </p>
      </div>
    </div>
  );
}
