import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Database, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";

export const Route = createFileRoute("/admin/console/system-status")({
  component: SystemStatusPage,
});

type Check = { name: string; ok: boolean; detail: string };

function SystemStatusPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const results: Check[] = [];
      try {
        const t0 = performance.now();
        const { error } = await supabase.from("categories").select("id", { head: true, count: "exact" });
        const ms = Math.round(performance.now() - t0);
        results.push({ name: "Database (categories)", ok: !error, detail: error ? error.message : `${ms} ms` });
      } catch (e) {
        results.push({ name: "Database (categories)", ok: false, detail: e instanceof Error ? e.message : "unknown" });
      }
      try {
        const { data, error } = await supabase.auth.getSession();
        results.push({ name: "Auth session", ok: !error, detail: data.session ? "Active session" : "No session" });
      } catch (e) {
        results.push({ name: "Auth session", ok: false, detail: e instanceof Error ? e.message : "unknown" });
      }
      try {
        const { data, error } = await supabase.storage.listBuckets();
        results.push({ name: "Storage", ok: !error, detail: error ? error.message : `${(data ?? []).length} bucket(s)` });
      } catch (e) {
        results.push({ name: "Storage", ok: false, detail: e instanceof Error ? e.message : "unknown" });
      }
      setChecks(results);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <AdminPageHeader
        eyebrow="System"
        title="System status"
        description="Live health checks for the backend services this console depends on."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "System status" }]}
      />
      <SectionCard icon={Activity} title="Backend services">
        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <ul className="space-y-2">
            {checks.map((c) => (
              <li key={c.name} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${c.ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                    {c.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.detail}</div>
                  </div>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${c.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {c.ok ? "ok" : "down"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        Powered by Supabase project · live RLS-checked queries
      </div>
    </div>
  );
}
