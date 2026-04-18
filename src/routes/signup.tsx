import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { z } from "zod";
import { Loader2, User, Briefcase } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { areas } from "@/data/areas";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/signup")({
  head: () =>
    buildSeo({
      title: "Sign up — Shebabd",
      description: "Create your Shebabd account to book or offer services in Dhaka.",
      canonical: "/signup",
      noindex: true,
    }),
  component: SignupPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .min(11, "Phone must be at least 11 digits")
    .max(20)
    .regex(/^[+0-9\s-]+$/, "Use digits, spaces, + or -"),
  area: z.string().min(1, "Please pick your area"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  role: z.enum(["customer", "provider"]),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = schema.safeParse({ fullName, phone, area, email, password, role });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          area: parsed.data.area,
          role: parsed.data.role,
        },
      },
    });
    setBusy(false);
    if (error) {
      setError(
        error.message.includes("already registered") || error.message.includes("already been")
          ? "An account with this email already exists. Try logging in."
          : error.message,
      );
      return;
    }
    if (data.session) {
      navigate({ to: "/" });
    } else {
      setInfo("Check your inbox to confirm your email, then log in.");
    }
  }

  return (
    <SiteShell>
      <section className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-elevated">
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join Shebabd in under a minute.</p>

          {/* Role toggle */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            {([
              { val: "customer", label: "I'm a customer", icon: User },
              { val: "provider", label: "I'm a provider", icon: Briefcase },
            ] as const).map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setRole(opt.val)}
                className={[
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                  role === opt.val
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
          {role === "provider" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Provider accounts go through admin approval before appearing publicly.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Rahim Ahmed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="+8801XXXXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Area in Dhaka</label>
              <select
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select your area</option>
                {areas.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.name}</option>
                ))}
              </select>
            </div>

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
            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="At least 6 characters"
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
              Create account
            </button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
