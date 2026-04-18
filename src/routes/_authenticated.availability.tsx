import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/availability")({
  head: () => ({
    meta: [
      { title: "Working hours · Shebabd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AvailabilityPage,
});

const WEEKDAYS = [
  { n: 0, label: "Sunday" },
  { n: 1, label: "Monday" },
  { n: 2, label: "Tuesday" },
  { n: 3, label: "Wednesday" },
  { n: 4, label: "Thursday" },
  { n: 5, label: "Friday" },
  { n: 6, label: "Saturday" },
];

type Slot = {
  weekday: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
};

type ProviderStatus = "not_applicable" | "pending" | "approved" | "rejected";

const DEFAULT_SLOTS: Slot[] = WEEKDAYS.map((w) => ({
  weekday: w.n,
  is_active: w.n >= 1 && w.n <= 5,
  start_time: "09:00",
  end_time: "18:00",
}));

function AvailabilityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ProviderStatus>("not_applicable");
  const [slots, setSlots] = useState<Slot[]>(DEFAULT_SLOTS);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: rows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("provider_status")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("provider_availability")
          .select("weekday, is_active, start_time, end_time")
          .eq("user_id", user.id),
      ]);
      setStatus((prof?.provider_status as ProviderStatus) ?? "not_applicable");
      if (rows && rows.length) {
        const map = new Map<number, Slot>();
        rows.forEach((r) => {
          map.set(r.weekday, {
            weekday: r.weekday,
            is_active: r.is_active,
            start_time: (r.start_time as string).slice(0, 5),
            end_time: (r.end_time as string).slice(0, 5),
          });
        });
        setSlots(
          WEEKDAYS.map((w) =>
            map.get(w.n) ?? {
              weekday: w.n,
              is_active: false,
              start_time: "09:00",
              end_time: "18:00",
            },
          ),
        );
      }
      setLoading(false);
    })();
  }, [user]);

  function update(weekday: number, patch: Partial<Slot>) {
    setSlots((ss) => ss.map((s) => (s.weekday === weekday ? { ...s, ...patch } : s)));
  }

  async function save() {
    if (!user) return;
    if (status !== "approved") {
      toast.error("Only approved providers can save availability.");
      return;
    }
    // Validate times
    for (const s of slots) {
      if (s.is_active && s.end_time <= s.start_time) {
        toast.error(`Fix ${WEEKDAYS[s.weekday].label}: end time must be after start.`);
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase.from("provider_availability").upsert(
      slots.map((s) => ({
        user_id: user.id,
        weekday: s.weekday,
        is_active: s.is_active,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
      { onConflict: "user_id,weekday" },
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save", { description: error.message });
      return;
    }
    toast.success("Working hours updated");
  }

  if (loading) {
    return (
      <SiteShell>
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Provider"
        title="Working hours"
        description="Set the hours you take jobs each day. We'll only show leads that match your availability."
      />
      <section className="container-page pb-16">
        {status !== "approved" && (
          <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
            Your provider account is{" "}
            <span className="font-semibold">{status.replace("_", " ")}</span>. Hours can be
            saved once you're approved.
            {status === "not_applicable" && (
              <>
                {" "}
                <Link to="/become-provider" className="underline">
                  Apply now
                </Link>
              </>
            )}
          </div>
        )}

        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Weekly schedule</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Toggle each day on/off and adjust the time window.
          </p>

          <ul className="mt-5 divide-y divide-border">
            {slots.map((s) => (
              <li
                key={s.weekday}
                className="grid grid-cols-1 items-center gap-3 py-3 sm:grid-cols-[140px_1fr_auto]"
              >
                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={s.is_active}
                    onChange={(e) => update(s.weekday, { is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  {WEEKDAYS[s.weekday].label}
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={s.start_time}
                    disabled={!s.is_active}
                    onChange={(e) => update(s.weekday, { start_time: e.target.value })}
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={s.end_time}
                    disabled={!s.is_active}
                    onChange={(e) => update(s.weekday, { end_time: e.target.value })}
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    s.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {s.is_active ? "Open" : "Closed"}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              No availability set = always open.
            </p>
            <Button onClick={save} disabled={saving || status !== "approved"}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Save hours
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
