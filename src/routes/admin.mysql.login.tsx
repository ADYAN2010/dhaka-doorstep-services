import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Database } from "lucide-react";
import { toast } from "sonner";
import { adminLogin, getCurrentAdmin } from "@/utils/admin.functions";

export const Route = createFileRoute("/admin/mysql/login")({
  component: MysqlAdminLogin,
});

function MysqlAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, bounce to dashboard.
  useEffect(() => {
    getCurrentAdmin()
      .then((res) => {
        if (res.user) navigate({ to: "/admin/mysql" });
      })
      .catch(() => {});
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await adminLogin({ data: { email, password } });
      toast.success("Welcome back");
      navigate({ to: "/admin/mysql" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
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
            <h1 className="text-xl font-bold">MySQL Admin</h1>
            <p className="text-xs text-muted-foreground">
              Sign in to the Hostinger-backed admin console.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="admin@shebabd.local"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
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
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
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
          This logs into the Hostinger MySQL backend. The Lovable Cloud admin
          login is separate.
        </p>
      </div>
    </div>
  );
}
