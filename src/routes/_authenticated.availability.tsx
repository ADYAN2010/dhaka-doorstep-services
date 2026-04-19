import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/availability")({
  component: AvailabilityPage,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Slot = { weekday: number; start_time: string; end_time: string; is_active: boolean; id?: string };

function AvailabilityPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>(
    DAYS.map((_, i) => ({ weekday: i, start_time: "09:00", end_time: "18:00", is_active: i !== 5 })),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("provider_availability")
        .select("id, weekday, start_time, end_time, is_active")
        .eq("user_id", user.id);
      if (data && data.length > 0) {
        const map = new Map(data.map((d) => [d.weekday, d]));
        setSlots(
          DAYS.map((_, i) => {
            const r = map.get(i);
            return r
              ? { weekday: i, start_time: r.start_time.slice(0, 5), end_time: r.end_time.slice(0, 5), is_active: r.is_active, id: r.id }
              : { weekday: i, start_time: "09:00", end_time: "18:00", is_active: false };
          }),
        );
      }
      setLoading(false);
    })();
  }, [user]);

  function update(index: number, patch: Partial<Slot>) {
    setSlots((s) => s.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    // Replace strategy: delete all then insert active ones.
    await supabase.from("provider_availability").delete().eq("user_id", user.id);
    const toInsert = slots.map((s) => ({
      user_id: user.id,
      weekday: s.weekday,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active,
    }));
    const { error } = await supabase.from("provider_availability").insert(toInsert);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Availability saved");
  }

  return (
    <SiteShell>
      <section className="container-page max-w-2xl py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">Set your weekly working hours.</p>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-5 shadow-soft">
            {slots.map((s, i) => (
              <div key={s.weekday} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                <Switch checked={s.is_active} onCheckedChange={(v) => update(i, { is_active: v })} />
                <div className="w-24 text-sm font-medium">{DAYS[s.weekday]}</div>
                <Input type="time" value={s.start_time} disabled={!s.is_active} onChange={(e) => update(i, { start_time: e.target.value })} className="w-32" />
                <span className="text-muted-foreground">→</span>
                <Input type="time" value={s.end_time} disabled={!s.is_active} onChange={(e) => update(i, { end_time: e.target.value })} className="w-32" />
              </div>
            ))}
            <Button onClick={save} disabled={saving} className="mt-3">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
