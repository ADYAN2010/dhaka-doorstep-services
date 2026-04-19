import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Building2, Save, Loader2, Trash2, MapPin, Globe2, Rocket } from "lucide-react";
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

export const Route = createFileRoute("/admin/console/cities")({
  component: CitiesPage,
});

type City = Tables<"cities">;
type LaunchStatus = City["launch_status"];

const STATUS_TONE: Record<LaunchStatus, "success" | "warning" | "info" | "neutral"> = {
  live: "success",
  beta: "info",
  coming_soon: "warning",
  paused: "neutral",
};

function CitiesPage() {
  const [items, setItems] = useState<City[]>([]);
  const [zoneCounts, setZoneCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<City | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: cities }, { data: zones }] = await Promise.all([
      supabase.from("cities").select("*").order("display_order").order("name"),
      supabase.from("zones").select("city_id"),
    ]);
    setItems(cities ?? []);
    const counts: Record<string, number> = {};
    (zones ?? []).forEach((z) => { counts[z.city_id] = (counts[z.city_id] ?? 0) + 1; });
    setZoneCounts(counts);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function openNew() {
    setEditing({
      id: "",
      name: "",
      slug: "",
      country: "Bangladesh",
      launch_status: "coming_soon",
      launched_at: null,
      display_order: items.length,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async function toggleActive(c: City) {
    await supabase.from("cities").update({ is_active: !c.is_active }).eq("id", c.id);
    void load();
  }

  async function remove(c: City) {
    if (!confirm(`Delete city "${c.name}"? This will not delete zones automatically.`)) return;
    const { error } = await supabase.from("cities").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("City deleted");
    void load();
  }

  const live = items.filter((c) => c.launch_status === "live").length;
  const beta = items.filter((c) => c.launch_status === "beta").length;
  const upcoming = items.filter((c) => c.launch_status === "coming_soon").length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Locations"
        title="Cities"
        description="Manage launch status across cities. Coming-soon cities show a waitlist on the public site."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Locations" }, { label: "Cities" }]}
        actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add city</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Building2} label="Total cities" value={items.length} />
        <StatTile icon={Rocket} label="Live" value={live} tone="success" />
        <StatTile icon={Globe2} label="Beta" value={beta} tone="info" />
        <StatTile icon={MapPin} label="Coming soon" value={upcoming} tone="warning" />
      </div>

      {loading ? (
        <LoadingState rows={5} />
      ) : items.length === 0 ? (
        <EmptyState icon={Building2} title="No cities yet" description="Add your first market city to start managing zones."
          action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add city</Button>} />
      ) : (
        <SectionCard padded={false} title="All cities" description={`${items.length} market${items.length === 1 ? "" : "s"}`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Launch date</TableHead>
                  <TableHead>Zones</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c, idx) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setEditing(c)}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">/{c.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm">{c.country}</TableCell>
                    <TableCell>
                      <StatusPill label={c.launch_status.replace("_", " ")} tone={STATUS_TONE[c.launch_status]} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.launched_at ? new Date(c.launched_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{zoneCounts[c.id] ?? 0}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm" onClick={() => remove(c)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <CityEditor city={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />
    </div>
  );
}

function CityEditor({ city, onClose, onSaved }: { city: City | null; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<City | null>(city);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(city); }, [city]);

  async function save() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.slug.trim()) { toast.error("Name and slug are required"); return; }
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      slug: draft.slug.trim().toLowerCase(),
      country: draft.country,
      launch_status: draft.launch_status,
      launched_at: draft.launched_at,
      display_order: draft.display_order,
      is_active: draft.is_active,
    };
    const { error } = draft.id
      ? await supabase.from("cities").update(payload).eq("id", draft.id)
      : await supabase.from("cities").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("City saved");
    onSaved();
  }

  if (!draft) return null;

  return (
    <Sheet open={!!city} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{draft.id ? `Edit ${draft.name || "city"}` : "New city"}</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>City name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slug || e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="Dhaka" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="dhaka" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Country</Label>
              <Input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
            </div>
            <div>
              <Label>Display order</Label>
              <Input type="number" value={draft.display_order} onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Launch status</Label>
              <Select value={draft.launch_status} onValueChange={(v) => setDraft({ ...draft, launch_status: v as LaunchStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coming_soon">Coming soon</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Launch date</Label>
              <Input type="date" value={draft.launched_at ?? ""} onChange={(e) => setDraft({ ...draft, launched_at: e.target.value || null })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <Label className="text-sm">Active</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Inactive cities are hidden from the public site.</p>
            </div>
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save city
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
