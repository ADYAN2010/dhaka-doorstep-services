import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
  Loader2,
  MapPin,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  marketingService,
  type BannerCampaign,
  type BannerPlacement,
  type BannerVariant,
} from "@/services/marketing";
import { cn } from "@/lib/utils";

const VARIANT_TONES: Record<BannerVariant, string> = {
  info: "bg-sky-500/10 text-sky-700 ring-sky-500/30 dark:text-sky-300",
  success: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  brand: "bg-primary/10 text-primary ring-primary/30",
};

const VARIANT_ICON: Record<BannerVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  brand: Sparkles,
};

export function BannerCampaigns() {
  const [items, setItems] = useState<BannerCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerCampaign | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    setItems(await marketingService.listBanners());
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function toggle(id: string) {
    await marketingService.toggleBanner(id);
    toast.success("Banner updated");
    void load();
  }
  async function remove(id: string) {
    if (!confirm("Remove this banner campaign?")) return;
    await marketingService.removeBanner(id);
    toast.success("Banner removed");
    void load();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Banner campaigns
          </div>
          <div className="text-base font-semibold">On-site promo banners</div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> New banner
        </Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          No banners yet — create one to drive a campaign.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((b) => {
            const Icon = VARIANT_ICON[b.variant];
            const ctr = b.impressions ? ((b.clicks / b.impressions) * 100).toFixed(2) : "0.00";
            return (
              <li key={b.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
                          VARIANT_TONES[b.variant],
                        )}
                      >
                        <Icon className="h-2.5 w-2.5" /> {b.variant}
                      </span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                        {b.placement}
                      </span>
                      {b.cities.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" /> {b.cities.join(", ")}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          b.enabled
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {b.enabled ? "Live" : "Paused"}
                      </span>
                    </div>
                    <div className="mt-1 font-semibold">{b.headline}</div>
                    {b.subtext && (
                      <div className="text-sm text-muted-foreground">{b.subtext}</div>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(b.startsAt).toLocaleDateString()} →{" "}
                        {b.endsAt ? new Date(b.endsAt).toLocaleDateString() : "open"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {b.impressions.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" /> {b.clicks.toLocaleString()} ·{" "}
                        {ctr}%
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => toggle(b.id)}>
                      {b.enabled ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(b);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => remove(b.id)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <BannerEditor
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={() => {
          setOpen(false);
          void load();
        }}
      />
    </div>
  );
}

function BannerEditor({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: BannerCampaign | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    headline: "",
    subtext: "",
    cta: "",
    href: "",
    variant: "brand" as BannerVariant,
    placement: "global" as BannerPlacement,
    enabled: true,
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: "",
    cities: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        headline: editing.headline,
        subtext: editing.subtext ?? "",
        cta: editing.cta ?? "",
        href: editing.href ?? "",
        variant: editing.variant,
        placement: editing.placement,
        enabled: editing.enabled,
        startsAt: editing.startsAt.slice(0, 10),
        endsAt: editing.endsAt?.slice(0, 10) ?? "",
        cities: editing.cities.join(", "),
      });
    } else {
      setForm({
        name: "",
        headline: "",
        subtext: "",
        cta: "",
        href: "",
        variant: "brand",
        placement: "global",
        enabled: true,
        startsAt: new Date().toISOString().slice(0, 10),
        endsAt: "",
        cities: "",
      });
    }
  }, [editing, open]);

  async function save() {
    if (!form.name.trim() || !form.headline.trim()) {
      toast.error("Name and headline are required");
      return;
    }
    await marketingService.saveBanner({
      id: editing?.id,
      name: form.name.trim(),
      headline: form.headline.trim(),
      subtext: form.subtext.trim() || undefined,
      cta: form.cta.trim() || undefined,
      href: form.href.trim() || undefined,
      variant: form.variant,
      placement: form.placement,
      enabled: form.enabled,
      startsAt: form.startsAt,
      endsAt: form.endsAt || null,
      cities: form.cities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    });
    toast.success(editing ? "Banner updated" : "Banner created");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit banner" : "New banner campaign"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Internal name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Eid first-booking boost"
            />
          </div>
          <div>
            <Label>Headline</Label>
            <Input
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              placeholder="Eid offer — 20% off your first booking"
            />
          </div>
          <div>
            <Label>Subtext</Label>
            <Textarea
              rows={2}
              value={form.subtext}
              onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))}
              placeholder="Use WELCOME20 at checkout"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Variant</Label>
              <Select
                value={form.variant}
                onValueChange={(v) => setForm((f) => ({ ...f, variant: v as BannerVariant }))}
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
            <div>
              <Label>Placement</Label>
              <Select
                value={form.placement}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, placement: v as BannerPlacement }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (all pages)</SelectItem>
                  <SelectItem value="homepage">Homepage</SelectItem>
                  <SelectItem value="services">Services pages</SelectItem>
                  <SelectItem value="checkout">Checkout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starts</Label>
              <Input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ends (optional)</Label>
              <Input
                type="date"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Cities (comma-separated, blank = all)</Label>
            <Input
              value={form.cities}
              onChange={(e) => setForm((f) => ({ ...f, cities: e.target.value }))}
              placeholder="dhaka, chittagong"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? "Save changes" : "Create banner"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Avoid unused import warning when DialogTrigger is removed
void DialogTrigger;
