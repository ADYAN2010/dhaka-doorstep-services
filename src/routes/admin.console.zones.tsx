import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/console/zones")({
  component: ZonesPage,
});

type City = { id: string; name: string };
type Zone = {
  id: string;
  city_id: string;
  name: string;
  pricing_modifier: number;
  is_active: boolean;
};

function ZonesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ city_id: "", name: "", pricing_modifier: 1 });

  async function load() {
    setLoading(true);
    const [c, z] = await Promise.all([
      supabase.from("cities").select("id, name").order("name"),
      supabase.from("zones").select("id, city_id, name, pricing_modifier, is_active").order("name"),
    ]);
    if (c.error) setError(c.error.message);
    else if (z.error) setError(z.error.message);
    else {
      setCities((c.data ?? []) as City[]);
      setZones((z.data ?? []) as Zone[]);
      if (!draft.city_id && c.data?.[0]) setDraft((d) => ({ ...d, city_id: c.data![0].id }));
    }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    if (!draft.city_id || !draft.name.trim()) return toast.error("Pick a city and name the zone");
    const { error } = await supabase.from("zones").insert({
      city_id: draft.city_id,
      name: draft.name.trim(),
      pricing_modifier: Number(draft.pricing_modifier) || 1,
    });
    if (error) return toast.error(error.message);
    setDraft({ ...draft, name: "", pricing_modifier: 1 });
    toast.success("Zone added");
    void load();
  }

  async function update(id: string, patch: Partial<Zone>) {
    const prev = zones;
    setZones((zs) => zs.map((z) => (z.id === id ? { ...z, ...patch } : z)));
    const { error } = await supabase.from("zones").update(patch).eq("id", id);
    if (error) { setZones(prev); toast.error(error.message); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this zone?")) return;
    const { error } = await supabase.from("zones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setZones((zs) => zs.filter((z) => z.id !== id));
    toast.success("Deleted");
  }

  const cityName = (id: string) => cities.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Locations"
        title="Zones"
        description="Service zones inside each city. Pricing modifier multiplies base prices."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Zones" }]}
      />

      <SectionCard title="Add a zone" icon={Plus}>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={draft.city_id}
            onChange={(e) => setDraft({ ...draft, city_id: e.target.value })}
          >
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input
            placeholder="Zone name (e.g. Gulshan)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Input
            type="number" step="0.05"
            placeholder="Pricing × (e.g. 1.10)"
            value={draft.pricing_modifier}
            onChange={(e) => setDraft({ ...draft, pricing_modifier: Number(e.target.value) })}
          />
          <Button size="sm" onClick={create}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button>
        </div>
      </SectionCard>

      <SectionCard padded={false}>
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="p-5"><ErrorState description={error} /></div>
        ) : zones.length === 0 ? (
          <div className="p-5"><EmptyState icon={MapPin} title="No zones" description="Add a zone to start configuring coverage and pricing." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">City</th>
                  <th className="px-3 py-2 text-left">Zone</th>
                  <th className="px-3 py-2 text-left">Pricing ×</th>
                  <th className="px-3 py-2 text-left">Active</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{cityName(z.city_id)}</td>
                    <td className="px-3 py-2 font-medium">
                      <Input
                        className="h-7"
                        value={z.name}
                        onChange={(e) => setZones((zs) => zs.map((x) => (x.id === z.id ? { ...x, name: e.target.value } : x)))}
                        onBlur={(e) => update(z.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number" step="0.05" className="h-7 w-24"
                        value={z.pricing_modifier}
                        onChange={(e) => setZones((zs) => zs.map((x) => (x.id === z.id ? { ...x, pricing_modifier: Number(e.target.value) } : x)))}
                        onBlur={(e) => update(z.id, { pricing_modifier: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2"><Switch checked={z.is_active} onCheckedChange={(v) => update(z.id, { is_active: v })} /></td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => remove(z.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
