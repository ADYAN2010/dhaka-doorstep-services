import { useEffect, useState } from "react";
import { Eye, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppearance } from "@/components/appearance-provider";
import { PromoStrip } from "@/components/promo-strip";
import { SiteBanner } from "@/components/site-banner";

export function PromoStripManager() {
  const { settings, update } = useAppearance();
  const [form, setForm] = useState({
    enabled: settings.promoStripEnabled,
    text: settings.promoStripText,
    cta: settings.promoStripCta,
    href: settings.promoStripHref,
  });

  useEffect(() => {
    setForm({
      enabled: settings.promoStripEnabled,
      text: settings.promoStripText,
      cta: settings.promoStripCta,
      href: settings.promoStripHref,
    });
  }, [settings.promoStripEnabled, settings.promoStripText, settings.promoStripCta, settings.promoStripHref]);

  function save() {
    update({
      promoStripEnabled: form.enabled,
      promoStripText: form.text,
      promoStripCta: form.cta,
      promoStripHref: form.href,
    });
    toast.success("Promo strip saved");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Top of page
          </div>
          <div className="text-base font-semibold">Promotional strip</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <Eye className="h-3 w-3" /> Live preview below
        </span>
      </div>

      <div className="grid gap-4 p-5">
        <label className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
          <div>
            <div className="text-sm font-medium">Show promo strip</div>
            <div className="text-xs text-muted-foreground">
              Renders above the navigation on every page.
            </div>
          </div>
          <Switch
            checked={form.enabled}
            onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
          />
        </label>

        <div>
          <Label>Message</Label>
          <Textarea
            rows={2}
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>CTA label</Label>
            <Input
              value={form.cta}
              onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
              placeholder="Book now"
            />
          </div>
          <div>
            <Label>CTA link</Label>
            <Input
              value={form.href}
              onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
              placeholder="/services"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save}>
            <Save className="h-3.5 w-3.5" />
            Save changes
          </Button>
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Live preview
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <PromoStrip />
            {!settings.promoStripEnabled && (
              <div className="bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
                Strip is disabled — toggle it on to preview here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteBannerManager() {
  const { settings, update } = useAppearance();
  const [form, setForm] = useState({
    enabled: settings.bannerEnabled,
    headline: settings.bannerHeadline,
    subtext: settings.bannerSubtext,
    cta: settings.bannerCta,
    href: settings.bannerHref,
    variant: settings.bannerVariant,
  });

  useEffect(() => {
    setForm({
      enabled: settings.bannerEnabled,
      headline: settings.bannerHeadline,
      subtext: settings.bannerSubtext,
      cta: settings.bannerCta,
      href: settings.bannerHref,
      variant: settings.bannerVariant,
    });
  }, [
    settings.bannerEnabled,
    settings.bannerHeadline,
    settings.bannerSubtext,
    settings.bannerCta,
    settings.bannerHref,
    settings.bannerVariant,
  ]);

  function save() {
    update({
      bannerEnabled: form.enabled,
      bannerHeadline: form.headline,
      bannerSubtext: form.subtext,
      bannerCta: form.cta,
      bannerHref: form.href,
      bannerVariant: form.variant,
    });
    toast.success("Hero banner saved");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Hero callout
          </div>
          <div className="text-base font-semibold">Site banner</div>
        </div>
      </div>
      <div className="grid gap-4 p-5">
        <label className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
          <div>
            <div className="text-sm font-medium">Show site banner</div>
            <div className="text-xs text-muted-foreground">
              Appears under the navigation on the homepage.
            </div>
          </div>
          <Switch
            checked={form.enabled}
            onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
          />
        </label>
        <div>
          <Label>Headline</Label>
          <Input
            value={form.headline}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
          />
        </div>
        <div>
          <Label>Subtext</Label>
          <Textarea
            rows={2}
            value={form.subtext}
            onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>CTA</Label>
            <Input
              value={form.cta}
              onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
            />
          </div>
          <div>
            <Label>Link</Label>
            <Input
              value={form.href}
              onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
            />
          </div>
          <div>
            <Label>Variant</Label>
            <Select
              value={form.variant}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, variant: v as typeof form.variant }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save}>
            <Save className="h-3.5 w-3.5" />
            Save banner
          </Button>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Live preview
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <SiteBanner />
            {!settings.bannerEnabled && (
              <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                Banner is disabled — toggle it on to preview here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── City-based campaign banners ─────────────────── */

export function CityCampaignSummary({
  banners,
}: {
  banners: { id: string; name: string; cities: string[]; enabled: boolean }[];
}) {
  const cityMap = new Map<string, number>();
  banners.forEach((b) => {
    if (!b.enabled) return;
    if (b.cities.length === 0) {
      cityMap.set("all cities", (cityMap.get("all cities") ?? 0) + 1);
    } else {
      b.cities.forEach((c) => cityMap.set(c, (cityMap.get(c) ?? 0) + 1));
    }
  });
  const entries = Array.from(cityMap.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-5 py-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          City-based campaigns
        </div>
        <div className="text-base font-semibold">Active by city</div>
      </div>
      {entries.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No active city campaigns.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map(([city, count]) => (
            <li key={city} className="flex items-center justify-between px-5 py-3">
              <span className="font-medium capitalize">{city}</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                {count} live
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
