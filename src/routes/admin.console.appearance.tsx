import { createFileRoute } from "@tanstack/react-router";
import {
  Palette, Sun, Moon, Monitor, Type, Megaphone, LayoutGrid,
  Save, RotateCcw, Eye, EyeOff, Sparkles, Info, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BRAND_PRESETS, FONT_PRESETS, useAppearance,
} from "@/components/appearance-provider";

export const Route = createFileRoute("/admin/console/appearance")({
  component: AppearancePage,
});

function AppearancePage() {
  const { settings, update, updateSection, reset, resolvedMode } = useAppearance();

  function save() { toast.success("Appearance saved — applied across the platform"); }
  function handleReset() { reset(); toast.success("Reset to defaults"); }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Appearance"
        title="Brand, theme & homepage"
        description="Live customization of brand color, theme mode, banners, homepage sections, fonts, and the promotional strip — applied site-wide."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
            <Button size="sm" onClick={save}><Save className="h-3.5 w-3.5" /> Save changes</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div>
          <Tabs defaultValue="brand">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="brand"><Palette className="h-3.5 w-3.5" /> Brand & theme</TabsTrigger>
              <TabsTrigger value="typography"><Type className="h-3.5 w-3.5" /> Typography</TabsTrigger>
              <TabsTrigger value="promo"><Megaphone className="h-3.5 w-3.5" /> Promo strip</TabsTrigger>
              <TabsTrigger value="banner"><Sparkles className="h-3.5 w-3.5" /> Banner</TabsTrigger>
              <TabsTrigger value="sections"><LayoutGrid className="h-3.5 w-3.5" /> Homepage</TabsTrigger>
            </TabsList>

            <TabsContent value="brand" className="space-y-4">
              <Section icon={Palette} title="Brand color" description="Pick a preset. The whole platform — light & dark — re-tones instantly.">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BRAND_PRESETS.map((p) => {
                    const active = settings.brandPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => update({ brandPreset: p.id })}
                        className={`group rounded-xl border-2 p-3 text-left transition-all hover:shadow-soft ${
                          active ? "border-primary shadow-soft" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div
                          className="h-14 rounded-lg shadow-soft"
                          style={{
                            background: `linear-gradient(135deg, oklch(${p.lightLight} ${p.chroma} ${p.hue}), oklch(${p.lightLight + 0.1} ${p.chroma} ${p.hue - 5}))`,
                          }}
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="truncate text-xs font-semibold">{p.name}</span>
                          {active && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">Active</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section icon={Sun} title="Theme mode" description="Light, dark, or follow the visitor's system.">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "light", label: "Light", icon: Sun },
                    { id: "dark", label: "Dark", icon: Moon },
                    { id: "system", label: "System", icon: Monitor },
                  ] as const).map((m) => {
                    const Icon = m.icon;
                    const active = settings.themeMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => update({ themeMode: m.id })}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-soft ${
                          active ? "border-primary bg-primary/5 shadow-soft" : "border-border"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-semibold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Currently rendering in <span className="font-semibold text-foreground">{resolvedMode}</span> mode.
                </p>
              </Section>

              <Section icon={Palette} title="Corner radius" description="Controls the roundness of buttons, cards, inputs, and dialogs.">
                <Input type="range" min="0" max="1.5" step="0.0625" value={settings.radius} onChange={(e) => update({ radius: Number(e.target.value) })} />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Sharp</span>
                  <span className="font-semibold text-foreground">{settings.radius.toFixed(3)}rem</span>
                  <span>Pillowy</span>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <Section icon={Type} title="Typography preset" description="A complete pairing of body and display fonts. Loaded from Google Fonts on save.">
                <div className="space-y-2">
                  {FONT_PRESETS.map((p) => {
                    const active = settings.fontPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => update({ fontPreset: p.id })}
                        className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all hover:shadow-soft ${
                          active ? "border-primary bg-primary/5 shadow-soft" : "border-border"
                        }`}
                      >
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.name}</div>
                          <div className="mt-1 text-2xl font-bold" style={{ fontFamily: p.display }}>The quick brown fox</div>
                          <div className="mt-0.5 text-sm text-muted-foreground" style={{ fontFamily: p.body }}>jumps over the lazy dog · 0123456789</div>
                        </div>
                        {active && <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase text-primary">Active</span>}
                      </button>
                    );
                  })}
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="promo" className="space-y-4">
              <Section icon={Megaphone} title="Promotional strip" description="Sits at the very top of every public page. Visitors can dismiss for the session.">
                <div className="space-y-3">
                  <ToggleRow label="Enabled" description="Show the promotional strip across the site" value={settings.promoStripEnabled} onChange={(v) => update({ promoStripEnabled: v })} />
                  <div><Label>Message</Label><Input value={settings.promoStripText} onChange={(e) => update({ promoStripText: e.target.value })} placeholder="🎉 Eid offer — 20% off…" /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label>CTA label</Label><Input value={settings.promoStripCta} onChange={(e) => update({ promoStripCta: e.target.value })} placeholder="Book now" /></div>
                    <div><Label>CTA link</Label><Input value={settings.promoStripHref} onChange={(e) => update({ promoStripHref: e.target.value })} placeholder="/services" /></div>
                  </div>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="banner" className="space-y-4">
              <Section icon={Sparkles} title="Homepage banner" description="An attention card placed below the hero. Use for announcements, hiring drives, or seasonal pushes.">
                <div className="space-y-3">
                  <ToggleRow label="Enabled" description="Show the banner on the homepage" value={settings.bannerEnabled} onChange={(v) => update({ bannerEnabled: v })} />
                  <div><Label>Headline</Label><Input value={settings.bannerHeadline} onChange={(e) => update({ bannerHeadline: e.target.value })} /></div>
                  <div><Label>Subtext</Label><Textarea rows={2} value={settings.bannerSubtext} onChange={(e) => update({ bannerSubtext: e.target.value })} /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label>CTA label</Label><Input value={settings.bannerCta} onChange={(e) => update({ bannerCta: e.target.value })} /></div>
                    <div><Label>CTA link</Label><Input value={settings.bannerHref} onChange={(e) => update({ bannerHref: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label>Style</Label>
                    <Select value={settings.bannerVariant} onValueChange={(v) => update({ bannerVariant: v as typeof settings.bannerVariant })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brand"><Sparkles className="mr-2 inline h-3 w-3" />Brand (recommended)</SelectItem>
                        <SelectItem value="info"><Info className="mr-2 inline h-3 w-3" />Info</SelectItem>
                        <SelectItem value="success"><CheckCircle2 className="mr-2 inline h-3 w-3" />Success</SelectItem>
                        <SelectItem value="warning"><AlertTriangle className="mr-2 inline h-3 w-3" />Warning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <Section icon={LayoutGrid} title="Homepage sections" description="Toggle visibility of each section on the public homepage.">
                <div className="space-y-2">
                  {SECTION_LABELS.map(({ key, label, description }) => (
                    <ToggleRow
                      key={key}
                      label={label}
                      description={description}
                      value={settings.sections[key]}
                      onChange={(v) => updateSection(key, v)}
                    />
                  ))}
                </div>
              </Section>

              <Section icon={Eye} title="Accessibility" description="Defaults applied globally.">
                <ToggleRow label="Reduce motion" description="Disable non-essential animations" value={settings.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />
              </Section>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live preview */}
        <div>
          <div className="sticky top-20 space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live preview</div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Synced</span>
              </div>
              <PreviewCard />
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Visibility summary</div>
              <ul className="space-y-1.5 text-xs">
                <SummaryRow label="Promo strip" on={settings.promoStripEnabled} />
                <SummaryRow label="Homepage banner" on={settings.bannerEnabled} />
                {SECTION_LABELS.map(({ key, label }) => (
                  <SummaryRow key={key} label={label} on={settings.sections[key]} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SECTION_LABELS: { key: keyof ReturnType<typeof useAppearance>["settings"]["sections"]; label: string; description: string }[] = [
  { key: "popularCategories", label: "Popular categories", description: "Grid of top service categories" },
  { key: "howItWorks", label: "How it works", description: "3-step explainer" },
  { key: "whyUs", label: "Why choose us", description: "Trust badges & differentiators" },
  { key: "featuredProviders", label: "Featured providers", description: "Hand-picked top-rated providers" },
  { key: "areas", label: "Areas served", description: "All service areas across Dhaka" },
  { key: "testimonials", label: "Testimonials", description: "Customer quotes & ratings" },
  { key: "providerCta", label: "Become a provider CTA", description: "Recruitment block" },
  { key: "finalCta", label: "Final CTA", description: "Bottom-of-page conversion block" },
];

function PreviewCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="bg-gradient-primary px-3 py-2 text-center text-[11px] font-medium text-primary-foreground">
        🎉 Promo strip preview
      </div>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <Logo />
        <button className="rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
          Sign up
        </button>
      </div>
      <div className="p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Featured</div>
        <h3 className="mt-1 text-base font-bold">Premium home services</h3>
        <p className="mt-1 text-xs text-muted-foreground">Trusted, vetted, on-time.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {["Cleaning", "Plumbing"].map((s) => (
            <div key={s} className="rounded-lg border border-border bg-card p-2.5 text-xs shadow-soft hover-lift">
              <div className="font-semibold">{s}</div>
              <div className="text-muted-foreground">From ৳450</div>
            </div>
          ))}
        </div>
        <button className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft">
          Book now
        </button>
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
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/60 p-3 transition-colors hover:bg-muted/40">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  );
}

function SummaryRow({ label, on }: { label: string; on: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1 font-medium ${on ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
        {on ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {on ? "On" : "Off"}
      </span>
    </li>
  );
}
