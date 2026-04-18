import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Shebabd" },
      { name: "description", content: "Reset your Shebabd account password." },
    ],
  }),
  component: ResetPasswordPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const pwSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function ResetPasswordPage() {
  const navigate = useNavigate();
  // Detect if we're in the "set a new password" step (Supabase puts type=recovery in the URL hash).
  const [mode, setMode] = useState<"request" | "update">("request");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  // ── Request reset email
  const [email, setEmail] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqSent, setReqSent] = useState(false);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setReqError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setReqError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setReqBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setReqBusy(false);
    if (error) {
      setReqError(error.message);
      return;
    }
    setReqSent(true);
  }

  // ── Set new password (after clicking email link)
  const [newPw, setNewPw] = useState("");
  const [updBusy, setUpdBusy] = useState(false);
  const [updError, setUpdError] = useState<string | null>(null);

  async function updatePassword(e: FormEvent) {
    e.preventDefault();
    setUpdError(null);
    const parsed = pwSchema.safeParse(newPw);
    if (!parsed.success) {
      setUpdError(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    setUpdBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setUpdBusy(false);
    if (error) {
      setUpdError(error.message);
      return;
    }
    navigate({ to: "/" });
  }

  return (
    <SiteShell>
      <section className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated">
          {mode === "request" ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Reset your password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll email you a secure link to set a new password.
              </p>

              {reqSent ? (
                <div className="mt-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
                  ✓ If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox.
                </div>
              ) : (
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
                  {reqError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {reqError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={reqBusy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
                  >
                    {reqBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send reset link
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">Back to log in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose something secure you'll remember.</p>

              <form onSubmit={updatePassword} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="At least 6 characters"
                  />
                </div>
                {updError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {updError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={updBusy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
                >
                  {updBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
