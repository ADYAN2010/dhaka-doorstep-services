import { Check, Palette } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BRAND_PRESETS, useAppearance } from "@/components/appearance-provider";

export function AccentColorPicker() {
  const { settings, update } = useAppearance();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Palette className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Accent color</div>
          <div className="text-xs text-muted-foreground">
            Sets the primary brand color used for buttons, links and highlights.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {BRAND_PRESETS.map((b) => {
          const active = settings.brandPreset === b.id;
          const swatch = `oklch(${b.lightLight} ${b.chroma} ${b.hue})`;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => update({ brandPreset: b.id })}
              title={b.name}
              className={cn(
                "group relative aspect-square rounded-xl ring-2 transition-all",
                active
                  ? "ring-foreground ring-offset-2 ring-offset-background"
                  : "ring-transparent hover:ring-border",
              )}
              style={{ background: swatch }}
            >
              {active && (
                <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />
              )}
              <span className="sr-only">{b.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block text-xs">Corner radius · {settings.radius.toFixed(2)}rem</Label>
          <Slider
            value={[settings.radius]}
            onValueChange={([v]) => update({ radius: v })}
            min={0}
            max={1.5}
            step={0.0625}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-medium uppercase text-muted-foreground">
          <div>
            <div
              className="mb-1 h-12 w-full rounded-md bg-primary"
              style={{ borderRadius: `calc(${settings.radius}rem - 0.25rem)` }}
            />
            Primary
          </div>
          <div>
            <div
              className="mb-1 h-12 w-full rounded-md bg-secondary"
              style={{ borderRadius: `calc(${settings.radius}rem - 0.25rem)` }}
            />
            Secondary
          </div>
          <div>
            <div
              className="mb-1 h-12 w-full rounded-md bg-accent"
              style={{ borderRadius: `calc(${settings.radius}rem - 0.25rem)` }}
            />
            Accent
          </div>
        </div>
      </div>
    </div>
  );
}
