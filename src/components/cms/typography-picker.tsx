import { Check, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { FONT_PRESETS, useAppearance } from "@/components/appearance-provider";

export function TypographyPicker() {
  const { settings, update } = useAppearance();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Type className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Typography</div>
          <div className="text-xs text-muted-foreground">
            Pick a font pairing for headings and body. Loads from Google Fonts on demand.
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FONT_PRESETS.map((f) => {
          const active = settings.fontPreset === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => update({ fontPreset: f.id })}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {f.name}
                  </div>
                  <div
                    className="mt-1 text-2xl font-bold leading-tight"
                    style={{ fontFamily: `"${f.display}"` }}
                  >
                    Aa Bb Cc 123
                  </div>
                  <p
                    className="mt-1 text-sm text-muted-foreground"
                    style={{ fontFamily: `"${f.body}"` }}
                  >
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
                {active && (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
