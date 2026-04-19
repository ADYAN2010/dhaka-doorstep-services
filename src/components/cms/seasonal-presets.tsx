import { Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BRAND_PRESETS,
  SEASONAL_PRESETS,
  useAppearance,
} from "@/components/appearance-provider";

export function SeasonalPresets() {
  const { settings, applySeasonal } = useAppearance();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Seasonal themes</div>
          <div className="text-xs text-muted-foreground">
            One-click presets that swap colors, fonts and the promo strip together.
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SEASONAL_PRESETS.map((p) => {
          const active = settings.activeSeasonalPreset === p.id;
          const brand = BRAND_PRESETS.find((b) => b.id === p.brandPreset) ?? BRAND_PRESETS[0];
          const swatch = `oklch(${brand.lightLight} ${brand.chroma} ${brand.hue})`;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                applySeasonal(p.id);
                toast.success(`${p.name} preset applied`);
              }}
              className={cn(
                "group relative overflow-hidden rounded-xl border p-4 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border bg-background hover:border-primary/40 hover:shadow-sm",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {p.description}
                  </div>
                </div>
                {active && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className="h-6 w-6 rounded-full ring-1 ring-border"
                  style={{ background: swatch }}
                />
                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                  {p.themeMode} · {p.fontPreset}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
