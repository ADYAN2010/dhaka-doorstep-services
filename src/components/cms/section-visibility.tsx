import { LayoutGrid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppearance, type AppearanceSettings } from "@/components/appearance-provider";

const SECTIONS: { key: keyof AppearanceSettings["sections"]; label: string; description: string }[] = [
  { key: "popularCategories", label: "Popular categories", description: "Grid of top service categories" },
  { key: "howItWorks", label: "How it works", description: "Three-step explainer" },
  { key: "whyUs", label: "Why choose us", description: "Trust signals and benefits" },
  { key: "featuredProviders", label: "Featured providers", description: "Pinned partner spotlight" },
  { key: "areas", label: "Areas we serve", description: "City & neighborhood coverage" },
  { key: "testimonials", label: "Testimonials", description: "Customer review carousel" },
  { key: "providerCta", label: "Become a provider CTA", description: "Recruiting banner" },
  { key: "finalCta", label: "Final CTA", description: "Bottom-of-page conversion block" },
];

export function SectionVisibility() {
  const { settings, updateSection } = useAppearance();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <LayoutGrid className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Homepage sections</div>
          <div className="text-xs text-muted-foreground">
            Toggle which sections appear on the public homepage.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((s) => (
          <label
            key={s.key}
            className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/60 p-3 transition-colors hover:bg-background"
          >
            <div>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.description}</div>
            </div>
            <Switch
              checked={settings.sections[s.key]}
              onCheckedChange={(v) => updateSection(s.key, v)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
