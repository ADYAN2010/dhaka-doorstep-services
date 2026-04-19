import { Sun, Moon, Monitor, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/components/appearance-provider";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "Auto", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeModeControls() {
  const { settings, update, resolvedMode } = useAppearance();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Default theme mode</div>
          <div className="text-xs text-muted-foreground">
            Currently rendering: <strong className="text-foreground">{resolvedMode}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => {
          const active = settings.themeMode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => update({ themeMode: m.id })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-semibold">{m.label}</span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex items-start justify-between gap-4 rounded-lg border border-border bg-background/60 p-3">
        <div>
          <Label className="text-sm font-medium">Reduce motion</Label>
          <div className="text-xs text-muted-foreground">
            Disable transitions and counters for accessibility.
          </div>
        </div>
        <Switch
          checked={settings.reduceMotion}
          onCheckedChange={(v) => update({ reduceMotion: v })}
        />
      </label>
    </div>
  );
}
