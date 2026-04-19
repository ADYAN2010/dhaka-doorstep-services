import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layers, Plus, Save, Loader2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { navigationService, type NavLink } from "@/services/admin-platform";

export const Route = createFileRoute("/admin/console/navigation")({
  component: NavPage,
});

function NavPage() {
  const [header, setHeader] = useState<NavLink[]>([]);
  const [footer, setFooter] = useState<NavLink[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void navigationService.listHeader().then(setHeader);
    void navigationService.listFooter().then(setFooter);
  }, []);

  async function save(which: "header" | "footer") {
    setSaving(true);
    if (which === "header") await navigationService.upsertHeader(header.map((l, i) => ({ ...l, order: i })));
    else await navigationService.upsertFooter(footer.map((l, i) => ({ ...l, order: i })));
    setSaving(false);
    toast.success(`${which === "header" ? "Header" : "Footer"} navigation saved`);
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website"
        title="Navigation & footer"
        description="Reorder, rename, and link the public site's primary navigation and footer."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Website" }, { label: "Navigation" }]}
      />

      <Tabs defaultValue="header">
        <TabsList>
          <TabsTrigger value="header"><Layers className="h-3.5 w-3.5" /> Header</TabsTrigger>
          <TabsTrigger value="footer"><Layers className="h-3.5 w-3.5" /> Footer</TabsTrigger>
        </TabsList>
        <TabsContent value="header" className="mt-5">
          <NavEditor items={header} setItems={setHeader} onSave={() => save("header")} saving={saving} />
        </TabsContent>
        <TabsContent value="footer" className="mt-5">
          <NavEditor items={footer} setItems={setFooter} onSave={() => save("footer")} saving={saving} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NavEditor({ items, setItems, onSave, saving }: { items: NavLink[]; setItems: (v: NavLink[]) => void; onSave: () => void; saving: boolean }) {
  function add() {
    setItems([...items, { id: Math.random().toString(36).slice(2), label: "New link", href: "/", order: items.length }]);
  }
  function remove(id: string) { setItems(items.filter((i) => i.id !== id)); }
  function move(idx: number, delta: number) {
    const next = [...items];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
  }
  function update(id: string, patch: Partial<NavLink>) {
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  return (
    <SectionCard
      title={`${items.length} link${items.length === 1 ? "" : "s"}`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5" /> Add link</Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save order
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-2">
            <div className="flex flex-col">
              <Button variant="ghost" size="icon-sm" disabled={idx === 0} onClick={() => move(idx, -1)}><ArrowUp className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon-sm" disabled={idx === items.length - 1} onClick={() => move(idx, 1)}><ArrowDown className="h-3 w-3" /></Button>
            </div>
            <Input className="max-w-[180px]" value={item.label} onChange={(e) => update(item.id, { label: e.target.value })} placeholder="Label" />
            <Input className="flex-1" value={item.href} onChange={(e) => update(item.id, { href: e.target.value })} placeholder="/path" />
            <Button variant="ghost" size="icon-sm" onClick={() => remove(item.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
