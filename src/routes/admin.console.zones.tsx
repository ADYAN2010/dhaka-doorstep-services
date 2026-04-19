import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Map, Save, Loader2, Trash2, TrendingUp, TrendingDown, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, StatusPill, StatTile } from "@/components/admin/primitives";
import { EmptyState, LoadingState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/console/zones")({
  component: ZonesPage,
});

type Zone = Tables<"zones">;
type City = Tables<"cities">;

function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [cityFilter, setCityFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    const [{ data: z }, { data: c }] = await Promise.all([
      supabase.from("zones").select("*").order("name"),
      supabase.from("cities").select("*").order("display_order"),
    ]);
    setZones(z ?? []);
    setCities(c ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const cityById = useMemo(() => Object.fromEntries(cities.map((c) => [c.id, c])), [cities]);
  const filtered = cityFilter === "all" ? zones : zones.filter((z) => z.city_id === cityFilter);

  function openNew() {
    setEditing({
      id: "",
      city_id: cityFilter !== "all" ? cityFilter : (cities[0]?.id ?? ""),
      name: "",
      pricing_modifier: 1.0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async function toggleActive(z: Zone) {
    await supabase.from("zones").update({ is_active: !z.is_active }).eq("id", z.id);
    void load();
  }
  async function remove(z: Zone) {
    if (!confirm(`Delete zone "${z.name}"?`)) return;
    const { error } = await supabase.from("zones").delete().eq("id", z.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Zone deleted");
    void load();
  }

  const premium = zones.filter((z) => z.pricing_modifier > 1).length;
  const discount = zones.filter((z) => z.pricing_modifier < 1).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Locations"
        title="Zones & areas"
        description="Define service zones inside each city with custom pricing modifiers (e.g., 1.20 = +20% surcharge)."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Locations" }, { label: "Zones" }]}
        actions={<Button onClick={openNew} disabled={cities.length === 0}><Plus className="h-4 w-4" /> Add zone</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Map} label="Total zones" value={zones.length} />
        <StatTile icon={Building2} label="Cities covered" value={new Set(zones.map((z) => z.city_id)).size} tone="info" />
        <StatTile icon={TrendingUp} label="Premium zones" value={premium} hint="Surge pricing > 1.00x" tone="warning" />
        <StatTile icon={TrendingDown} label="Discount zones" value={discount} hint="Modifier < 1.00x" tone="success" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter by city</Label>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Map} title="No zones yet" description={cities.length === 0 ? "Add a city first, then create zones inside it." : "Add the first zone for this city."}
          action={cities.length > 0 ? <Button onClick={openNew}><Plus className="h-4 w-4" /> Add zone</Button> : undefined} />
      ) : (
        <SectionCard padded={false} title="Service zones" description={`${filtered.length} zone${filtered.length === 1 ? "" : "s"}`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Pricing modifier</TableHead>
                  <TableHead>Effect</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((z) => {
                  const delta = (z.pricing_modifier - 1) * 100;
                  const tone: "success" | "warning" | "neutral" = delta > 0 ? "warning" : delta < 0 ? "success" : "neutral";
                  const label = delta === 0 ? "Standard" : delta > 0 ? `+${delta.toFixed(0)}% surge` : `${delta.toFixed(0)}% discount`;
                  return (
                    <TableRow key={z.id} className="cursor-pointer" onClick={() => setEditing(z)}>
                      <TableCell className="font-semibold">{z.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cityById[z.city_id]?.name ?? "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{Number(z.pricing_modifier).toFixed(2)}x</TableCell>
                      <TableCell><StatusPill label={label} tone={tone} /></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Switch checked={z.is_active} onCheckedChange={() => toggleActive(z)} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm" onClick={() => remove(z)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <ZoneEditor zone={editing} cities={cities} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />
    </div>
  );
}

function ZoneEditor({ zone, cities, onClose, onSaved }: { zone: Zone | null; cities: City[]; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Zone | null>(zone);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(zone); }, [zone]);

  async function save() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.city_id) { toast.error("Zone name and city are required"); return; }
    setSaving(true);
    const payload = {
      city_id: draft.city_id,
      name: draft.name.trim(),
      pricing_modifier: Number(draft.pricing_modifier),
      is_active: draft.is_active,
    };
    const { error } = draft.id
      ? await supabase.from("zones").update(payload).eq("id", draft.id)
      : await supabase.from("zones").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Zone saved");
    onSaved();
  }

  if (!draft) return null;
  const delta = (Number(draft.pricing_modifier) - 1) * 100;

  return (
    <Sheet open={!!zone} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{draft.id ? `Edit ${draft.name || "zone"}` : "New zone"}</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div>
            <Label>City</Label>
            <Select value={draft.city_id} onValueChange={(v) => setDraft({ ...draft, city_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Zone name</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Gulshan, Banani, Dhanmondi…" />
          </div>
          <div>
            <Label>Pricing modifier</Label>
            <Input type="number" step="0.05" min="0.5" max="3" value={draft.pricing_modifier}
              onChange={(e) => setDraft({ ...draft, pricing_modifier: Number(e.target.value) })} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Multiplier applied to base price. <span className="font-semibold">Currently: {delta === 0 ? "Standard pricing" : delta > 0 ? `+${delta.toFixed(0)}% premium` : `${delta.toFixed(0)}% discount`}.</span>
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <Label className="text-sm">Active</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Inactive zones won't accept new bookings.</p>
            </div>
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save zone
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
