import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./image-uploader";
import { useAppearance } from "@/components/appearance-provider";

export function IdentitySettings() {
  const { settings, update } = useAppearance();
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Site identity</div>
          <div className="text-xs text-muted-foreground">
            Brand name, tagline, logo, favicon and contact details shown across the site.
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <Label>Brand name</Label>
            <Input
              value={settings.siteName}
              onChange={(e) => update({ siteName: e.target.value })}
              placeholder="ServiceHub Bangladesh"
            />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input
              value={settings.tagline}
              onChange={(e) => update({ tagline: e.target.value })}
              placeholder="Trusted home services across Dhaka"
            />
          </div>
          <div>
            <Label className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Support email
            </Label>
            <Input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => update({ contactEmail: e.target.value })}
            />
          </div>
          <div>
            <Label className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> Support phone
            </Label>
            <Input
              value={settings.contactPhone}
              onChange={(e) => update({ contactPhone: e.target.value })}
            />
          </div>
          <div>
            <Label className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Address
            </Label>
            <Textarea
              rows={2}
              value={settings.contactAddress}
              onChange={(e) => update({ contactAddress: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-5">
          <ImageUploader
            label="Logo"
            description="Shown in navbar and footer · transparent PNG recommended"
            value={settings.logoUrl}
            onChange={(url) => update({ logoUrl: url })}
            aspect="logo"
          />
          <ImageUploader
            label="Favicon"
            description="Square, ~64×64 · used in browser tabs"
            value={settings.faviconUrl}
            onChange={(url) => update({ faviconUrl: url })}
            aspect="square"
          />
        </div>
      </div>
    </div>
  );
}
