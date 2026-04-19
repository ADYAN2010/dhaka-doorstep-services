import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, CalendarCheck, Wallet, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/provider-dashboard")({
  component: ProviderDashboardPage,
});

type Lead = {
  id: string;
  full_name: string;
  category: string;
  service: string | null;
  area: string;
  preferred_date: string;
  preferred_time_slot: string;
  status: string;
};

function ProviderDashboardPage() {
  const { user, roles } = useAuth();
  const [providerStatus, setProviderStatus] = useState<string | null>(null);
  const [openLeads, setOpenLeads] = useState<Lead[]>([]);
  const [myJobs, setMyJobs] = useState<Lead[]>([]);
  const [pendingNet, setPendingNet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [profile, leads, jobs, ledger] = await Promise.all([
      supabase.from("profiles").select("provider_status").eq("id", user.id).maybeSingle(),
      supabase
        .from("bookings")
        .select("id, full_name, category, service, area, preferred_date, preferred_time_slot, status")
        .is("provider_id", null)
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("bookings")
        .select("id, full_name, category, service, area, preferred_date, preferred_time_slot, status")
        .eq("provider_id", user.id)
        .order("preferred_date", { ascending: true }),
      supabase
        .from("commission_ledger")
        .select("provider_net")
        .eq("provider_id", user.id)
        .eq("paid_out", false),
    ]);
    setProviderStatus(profile.data?.provider_status ?? null);
    setOpenLeads((leads.data ?? []) as Lead[]);
    setMyJobs((jobs.data ?? []) as Lead[]);
    setPendingNet((ledger.data ?? []).reduce((s, r) => s + Number(r.provider_net ?? 0), 0));
    setLoading(false);
  }
  useEffect(() => { void load(); }, [user]);

  async function accept(id: string) {
    setBusyId(id);
    const { error } = await supabase.rpc("accept_lead", { _booking_id: id });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Lead accepted");
    void load();
  }

  async function complete(id: string) {
    setBusyId(id);
    const { error } = await supabase.rpc("mark_booking_completed", { _booking_id: id });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Marked completed");
    void load();
  }

  if (!roles.includes("provider")) {
    return (
      <SiteShell>
        <section className="container-page py-16 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Provider workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your account doesn't have the provider role yet.</p>
          <Button asChild className="mt-4"><Link to="/become-provider">Apply to become a provider</Link></Button>
        </section>
      </SiteShell>
    );
  }

  if (providerStatus && providerStatus !== "approved") {
    return (
      <SiteShell>
        <section className="container-page py-16 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Application {providerStatus}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your provider account is currently <strong>{providerStatus}</strong>. Once an admin approves you,
            you'll see open leads and your job pipeline here.
          </p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="container-page py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Provider workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Open leads, your jobs, and earnings.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarCheck className="h-5 w-5" /></span>
              <div>
                <div className="text-2xl font-bold">{openLeads.length}</div>
                <div className="text-xs text-muted-foreground">Open leads in coverage</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-500"><Clock className="h-5 w-5" /></span>
              <div>
                <div className="text-2xl font-bold">{myJobs.filter((j) => j.status !== "completed" && j.status !== "cancelled").length}</div>
                <div className="text-xs text-muted-foreground">Active jobs</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><Wallet className="h-5 w-5" /></span>
              <div>
                <div className="text-2xl font-bold">৳{pendingNet.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Pending payout</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card shadow-soft">
            <div className="border-b border-border px-5 py-4">
              <div className="text-sm font-semibold">Open leads</div>
              <div className="text-xs text-muted-foreground">Bookings in your category and area, not yet assigned.</div>
            </div>
            {loading ? (
              <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : openLeads.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No open leads in your coverage right now.</div>
            ) : (
              <ul className="divide-y divide-border">
                {openLeads.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <div className="font-medium capitalize">{l.category}{l.service ? ` · ${l.service}` : ""}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />{l.area} · {l.preferred_date} · {l.preferred_time_slot}
                      </div>
                    </div>
                    <Button size="sm" disabled={busyId === l.id} onClick={() => accept(l.id)}>Accept</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-soft">
            <div className="border-b border-border px-5 py-4">
              <div className="text-sm font-semibold">My jobs</div>
              <div className="text-xs text-muted-foreground">Bookings assigned to you.</div>
            </div>
            {loading ? (
              <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : myJobs.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No active jobs yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {myJobs.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <div className="font-medium">{j.full_name} <span className="font-normal text-muted-foreground capitalize">· {j.category}</span></div>
                      <div className="text-xs text-muted-foreground">{j.area} · {j.preferred_date} · {j.preferred_time_slot}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold capitalize">{j.status}</span>
                      {j.status !== "completed" && j.status !== "cancelled" && (
                        <Button size="sm" variant="outline" disabled={busyId === j.id} onClick={() => complete(j.id)}>Complete</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
