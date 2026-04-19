import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Palette, Sun, Moon, Type, Image as ImageIcon, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/console/appearance")({
  component: AppearancePage,
});

const PRESETS = [
  { id: "teal", name: "Teal (default)", primary: "oklch(0.62 0.13 195)", glow: "oklch(0.72 0.14 190)" },
  { id: "indigo", name: "Indigo", primary: "oklch(0.55 0.18 280)", glow: "oklch(0.65 0.18 280)" },
  { id: "emerald", name: "Emerald", primary: "oklch(0.62 0.15 155)", glow: "oklch(0.72 0.15 155)" },
  { id: "rose", name: "Rose", primary: "oklch(0.62 0.2 15)", glow: "oklch(0.72 0.2 15)" },
  { id: "amber", name: "Amber", primary: "oklch(0.72 0.16 75)", glow: "oklch(0.8 0.16 75)" },
];

function AppearancePage() {
  const [preset, setPreset] = useState("teal");
  const [radius, setRadius] = useState("0.875");
  const [fontHeading, setFontHeading] = useState("Inter");
  const [fontBody, setFontBody] = useState("Inter");
  const [productName, setProductName] = useState("ServiceHub Bangladesh");
  const [tagline, setTagline] = useState("Trusted home & professional services in Dhaka");
  const [logoUrl, setLogoUrl] = useState("");
  const [previewDark, setPreviewDark] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const current = PRESETS.find((p) => p.id === preset) ?? PRESETS[0];

  function save() { toast.success("Appearance saved"); }
  function reset() {
    setPreset("teal"); setRadius("0.875"); setFontHeading("Inter"); setFontBody("Inter");
    setHighContrast(false); setReduceMotion(false);
    toast.success("Reset to defaults");
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Appearance"
        title="Brand & theme"
        description="Customize colors, typography, logo, and accessibility defaults across the platform."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
            <Button size="sm" onClick={save}><Save className="h-3.5 w-3.5" /> Save changes</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Settings */}
        <div className="space-y-4">
          {/* Brand colors */}
          <Section icon={Palette} title="Brand color" description="Pick a preset or use your own primary color.">
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id} type="button" onClick={() => setPreset(p.id)}
                  className={`group rounded-xl border-2 p-2 text-left transition-all ${preset === p.id ? "border-primary shadow-soft" : "border-border hover:border-primary/40"}`}
                >
                  <div className="h-12 rounded-lg" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.glow})` }} />
                  <div className="mt-1.5 truncate text-xs font-medium">{p.name}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* Logo & identity */}
          <Section icon={ImageIcon} title="Brand identity" description="Logo, product name, and tagline shown across the app.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Product name</Label><Input value={productName} onChange={(e) => setProductName(e.target.value)} /></div>
              <div><Label>Logo URL</Label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.svg" /></div>
              <div className="sm:col-span-2"><Label>Tagline</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
            </div>
          </Section>

          {/* Typography */}
          <Section icon={Type} title="Typography" description="Body and heading font families.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Heading font</Label>
                <Select value={fontHeading} onValueChange={setFontHeading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Manrope">Manrope</SelectItem>
                    <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                    <SelectItem value="Playfair">Playfair Display</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Body font</Label>
                <Select value={fontBody} onValueChange={setFontBody}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Manrope">Manrope</SelectItem>
                    <SelectItem value="System">System UI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Border radius (rem)</Label>
                <Input type="range" min="0" max="2" step="0.125" value={radius} onChange={(e) => setRadius(e.target.value)} />
                <div className="mt-1 text-xs text-muted-foreground">Current: {radius}rem</div>
              </div>
            </div>
          </Section>

          {/* Accessibility */}
          <Section icon={Sun} title="Accessibility" description="Defaults applied globally. Users can override.">
            <div className="space-y-3">
              <ToggleRow label="High contrast mode" description="Stronger borders and text contrast" value={highContrast} onChange={setHighContrast} />
              <ToggleRow label="Reduce motion" description="Disable non-essential animations" value={reduceMotion} onChange={setReduceMotion} />
            </div>
          </Section>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live preview</div>
              <button
                type="button"
                onClick={() => setPreviewDark((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                {previewDark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />} {previewDark ? "Dark" : "Light"}
              </button>
            </div>
            <div className={`overflow-hidden rounded-xl border border-border ${previewDark ? "bg-[oklch(0.18_0.04_235)] text-white" : "bg-white text-[oklch(0.18_0.04_235)]"}`}>
              <div className="flex items-center justify-between border-b border-border/50 p-3" style={{ borderRadius: `${radius}rem ${radius}rem 0 0` }}>
                <div className="flex items-center gap-2"><Logo /></div>
                <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: `linear-gradient(135deg, ${current.primary}, ${current.glow})`, borderRadius: `${Math.max(0.4, Number(radius) - 0.2)}rem` }}>
                  Get started
                </button>
              </div>
              <div className="p-4" style={{ fontFamily: fontBody }}>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: current.primary }}>Featured</div>
                <h3 className="mt-1 text-base font-bold" style={{ fontFamily: fontHeading }}>{productName}</h3>
                <p className="mt-1 text-xs opacity-70">{tagline}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {["Cleaning", "Plumbing"].map((s) => (
                    <div key={s} className={`rounded-lg p-2.5 text-xs ${previewDark ? "bg-white/5" : "bg-black/5"}`} style={{ borderRadius: `${Math.max(0.5, Number(radius) - 0.1)}rem` }}>
                      <div className="font-semibold">{s}</div>
                      <div className="opacity-60">From ৳450</div>
                    </div>
                  ))}
                </div>
                <button className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ background: current.primary, borderRadius: `${Math.max(0.4, Number(radius) - 0.2)}rem` }}>
                  Book now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, description, children }: { icon: typeof Palette; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/60 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  );
}
