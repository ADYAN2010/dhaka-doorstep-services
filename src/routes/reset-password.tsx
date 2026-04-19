import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
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
const setSchema = z.object({ password: z.string().min(8).max(72) });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Supabase puts a `recovery` access_token in the URL hash on the redirect
  // back from the reset email. If we detect one, jump straight to the "set
  // new password" stage — supabase-js will already have created a session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    if (hash.includes("type=recovery")) {
      setStage("set");
      setInfo("Set your new password below.");
    }
  }, []);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = requestSchema.safeParse({ email });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid email");
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setInfo("If that email is registered, a reset link has been sent. Check your inbox.");
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Couldn't request reset");
    } finally {
      setBusy(false);
    }
  }

  async function setNewPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = setSchema.safeParse({ password });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid input");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw error;
      setInfo("Password updated. Redirecting to log in…");
      setTimeout(() => navigate({ to: "/login" }), 800);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Couldn't reset password");
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
