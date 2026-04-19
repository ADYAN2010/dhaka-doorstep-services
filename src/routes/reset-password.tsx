import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { api, ApiError } from "@/lib/api-client";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    buildSeo({
      title: "Reset password — Shebabd",
      description: "Reset your Shebabd account password.",
      canonical: "/reset-password",
      noindex: true,
    }),
  component: ResetPasswordPage,
});

const requestSchema = z.object({ email: z.string().trim().email() });
const resetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(72),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = requestSchema.safeParse({ email });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid email");
    setBusy(true);
    try {
      const res = await api<{ ok: true; dev_token?: string }>("/api/customer-auth/forgot-password", {
        method: "POST",
        body: parsed.data,
        skipAuth: true,
      });
      if (res.dev_token) {
        setToken(res.dev_token);
        setStage("set");
        setInfo("Dev mode: token loaded for you. Set your new password below.");
      } else {
        setInfo("If that email is registered, a reset link has been sent.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't request reset");
    } finally {
      setBusy(false);
    }
  }

  async function setNewPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = resetSchema.safeParse({ token, password });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid input");
    setBusy(true);
    try {
      await api("/api/customer-auth/reset-password", {
        method: "POST",
        body: { token: parsed.data.token, new_password: parsed.data.password },
        skipAuth: true,
      });
      setInfo("Password updated. You can now log in.");
      setTimeout(() => navigate({ to: "/login" }), 800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <section className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated">
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Reset password</h1>

          {stage === "request" ? (
            <form onSubmit={requestReset} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              {info && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                  {info}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          ) : (
            <form onSubmit={setNewPassword} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Reset token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">New password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="At least 8 characters"
                />
              </div>
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              {info && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                  {info}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Set new password
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary hover:underline">Back to login</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
