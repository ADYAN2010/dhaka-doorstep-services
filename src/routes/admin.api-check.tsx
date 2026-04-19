/**
 * /admin/api-check
 *
 * End-to-end verification page for the protected backend API:
 *   1. POST /api/auth/login     → store JWT via setAuthToken()
 *   2. GET  /api/auth/me        → confirm token works
 *   3. POST /api/categories     → create a category (requires Bearer)
 *   4. GET  /api/categories     → list categories
 *
 * This page is dev-facing only — it never reveals DB credentials. The JWT is
 * stored in localStorage by `src/lib/api-client.ts` and auto-attached to
 * every subsequent request.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, XCircle, Loader2, KeyRound, LogOut } from "lucide-react";
import { api, ApiError, setAuthToken, getAuthToken } from "@/lib/api-client";

export const Route = createFileRoute("/admin/api-check")({
  component: ApiCheckPage,
});

type LoginResponse = {
  token: string;
  expires_in: string;
  user: { id: string; email: string; full_name: string; role: string };
};
type MeResponse = { user: { id: string; email: string; role: string } };
type Category = {
  id: string;
  slug: string;
  name: string;
  commission_rate: number;
  is_active: number | boolean;
};
type Step = { label: string; status: "idle" | "running" | "ok" | "fail"; detail?: string };

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function StepRow({ step }: { step: Step }) {
  const Icon =
    step.status === "ok" ? CheckCircle2 : step.status === "fail" ? XCircle : Loader2;
  const color =
    step.status === "ok"
      ? "text-emerald-500"
      : step.status === "fail"
        ? "text-destructive"
        : step.status === "running"
          ? "text-primary animate-spin"
          : "text-muted-foreground";
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-background/40 px-3 py-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{step.label}</div>
        {step.detail && (
          <div className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
            {step.detail}
          </div>
        )}
      </div>
    </li>
  );
}

function ApiCheckPage() {
  const [email, setEmail] = useState("admin@shobsheba.local");
  const [password, setPassword] = useState("ChangeMe!2025");
  const [catName, setCatName] = useState(`Test Category ${Math.floor(Math.random() * 1000)}`);
  const [catRate, setCatRate] = useState("12.5");

  const [hasToken, setHasToken] = useState<boolean>(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    setHasToken(Boolean(getAuthToken()));
  }, []);

  function update(idx: number, patch: Partial<Step>) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  async function runFlow(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setCategories(null);

    const initial: Step[] = [
      { label: "1. POST /api/auth/login", status: "idle" },
      { label: "2. GET /api/auth/me (with Bearer)", status: "idle" },
      { label: `3. POST /api/categories  →  "${catName}"`, status: "idle" },
      { label: "4. GET /api/categories", status: "idle" },
    ];
    setSteps(initial);

    // ---- 1. Login ----
    update(0, { status: "running" });
    let token: string;
    try {
      const res = await api<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });
      token = res.token;
      setAuthToken(token);
      setHasToken(true);
      update(0, {
        status: "ok",
        detail: `200 OK · user=${res.user.email} · role=${res.user.role} · token len=${token.length}`,
      });
    } catch (err) {
      update(0, { status: "fail", detail: errMsg(err) });
      setBusy(false);
      return;
    }

    // ---- 2. Me ----
    update(1, { status: "running" });
    try {
      const me = await api<MeResponse>("/api/auth/me");
      update(1, { status: "ok", detail: `200 OK · ${me.user.email} (${me.user.role})` });
    } catch (err) {
      update(1, { status: "fail", detail: errMsg(err) });
      setBusy(false);
      return;
    }

    // ---- 3. Create category (PROTECTED WRITE) ----
    update(2, { status: "running" });
    let createdId = "";
    try {
      const created = await api<Category | { id: string }>("/api/categories", {
        method: "POST",
        body: {
          slug: slug(catName) + "-" + Date.now().toString(36),
          name: catName,
          commission_rate: Number(catRate) || 0,
          is_active: 1,
          display_order: 100,
        },
      });
      createdId = (created as Category).id ?? (created as { id: string }).id;
      update(2, {
        status: "ok",
        detail: `201 Created · id=${createdId}`,
      });
    } catch (err) {
      update(2, { status: "fail", detail: errMsg(err) });
      setBusy(false);
      return;
    }

    // ---- 4. List categories (public GET) ----
    update(3, { status: "running" });
    try {
      const list = await api<{ data: Category[] } | Category[]>("/api/categories");
      const rows = Array.isArray(list) ? list : (list.data ?? []);
      setCategories(rows);
      update(3, { status: "ok", detail: `200 OK · ${rows.length} row(s)` });
    } catch (err) {
      update(3, { status: "fail", detail: errMsg(err) });
    }
    setBusy(false);
  }

  function logout() {
    setAuthToken(null);
    setHasToken(false);
    setSteps([]);
    setCategories(null);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <KeyRound className="h-3.5 w-3.5" /> Backend API end-to-end check
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Verify protected API</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Logs into the Express backend, stores the JWT in <code>localStorage</code>, and creates a
          category through the protected <code>POST /api/categories</code> route.
        </p>
      </header>

      <form
        onSubmit={runFlow}
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Admin email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
            />
          </Field>
          <Field label="Admin password">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </Field>
          <Field label="New category name">
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Commission %">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={catRate}
              onChange={(e) => setCatRate(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Run end-to-end check
          </button>

          {hasToken && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Clear stored token
            </button>
          )}

          <span className="text-xs text-muted-foreground">
            Token stored in browser:{" "}
            <span className={hasToken ? "text-emerald-500" : "text-muted-foreground"}>
              {hasToken ? "yes" : "no"}
            </span>
          </span>
        </div>
      </form>

      {steps.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">Results</h2>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <StepRow key={i} step={s} />
            ))}
          </ol>
        </section>
      )}

      {categories && categories.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">
            Categories now in DB ({categories.length})
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2 text-right">Commission %</th>
                </tr>
              </thead>
              <tbody>
                {categories.slice(0, 10).map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.slug}</td>
                    <td className="px-3 py-2 text-right">{Number(c.commission_rate).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <style>{`
        .input {
          margin-top: 0.25rem;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary)/0.2); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function errMsg(err: unknown): string {
  if (err instanceof ApiError) return `${err.status} ${err.code} · ${err.message}`;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
