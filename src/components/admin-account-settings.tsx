import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    next: z.string().min(8, "Use at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

/**
 * Admin account settings: change password + must-change banner.
 * Reads `must_change_password` from auth user_metadata and clears it after a successful update.
 */
export function AdminAccountSettings() {
  const { user } = useAuth();
  const mustChange = Boolean(user?.user_metadata?.must_change_password);

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ next, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.next,
      data: { must_change_password: false },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. Use the new password next time you sign in.");
    setNext("");
    setConfirm("");
  }

  return (
    <section
      id="admin-account"
      className={`mt-8 rounded-3xl border bg-card p-6 shadow-soft ${
        mustChange ? "border-destructive/40 ring-1 ring-destructive/20" : "border-border"
      }`}
    >
      {mustChange ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-semibold text-destructive">Change your default password</p>
            <p className="mt-0.5 text-muted-foreground">
              You&apos;re signed in with the default development password. Set a strong one before doing
              anything else.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Your password is set. You can change it any time.
        </div>
      )}

      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h2 className="text-xl font-semibold">Account & password</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user?.email}</span>
      </p>

      <form onSubmit={onSubmit} className="mt-5 grid max-w-md gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">New password</span>
          <input
            type="password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">Confirm new password</span>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter the new password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            autoComplete="new-password"
          />
        </label>
        <Button type="submit" disabled={busy} className="w-fit">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </section>
  );
}
