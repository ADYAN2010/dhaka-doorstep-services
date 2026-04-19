import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { marketingService, type HomepageSection } from "@/services/marketing";

export function SectionReorder() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setSections(await marketingService.listSections());
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function move(id: string, dir: "up" | "down") {
    const next = await marketingService.moveSection(id, dir);
    setSections(next);
    toast.success("Order updated");
  }

  async function toggle(id: string) {
    await marketingService.toggleSection(id);
    void load();
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-5 py-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Homepage layout
        </div>
        <div className="text-base font-semibold">Reorder & toggle sections</div>
      </div>
      <ul className="divide-y divide-border">
        {sections.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="grid h-7 w-7 place-items-center rounded-md bg-muted text-xs font-bold">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.description}</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => move(s.id, "up")}
              disabled={i === 0}
              aria-label="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => move(s.id, "down")}
              disabled={i === sections.length - 1}
              aria-label="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              {s.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {s.enabled ? "Visible" : "Hidden"}
            </span>
            <Switch checked={s.enabled} onCheckedChange={() => toggle(s.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
