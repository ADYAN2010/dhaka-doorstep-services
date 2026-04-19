import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe, Wrench, Hourglass, Megaphone, Save, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SectionCard, SettingsRow, StatTile } from "@/components/admin/primitives";
import { IdentitySettings } from "@/components/cms/identity-settings";
import { SocialLinksSettings } from "@/components/cms/social-links-settings";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { siteFlagsService, type SiteFlags } from "@/services/admin-platform";

export const Route = createFileRoute("/admin/console/website")({
  component: WebsitePage,
});

function WebsitePage() {
  const [flags, setFlags] = useState<SiteFlags | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void siteFlagsService.get().then(setFlags);
  }, []);

  async function save() {
    if (!flags) return;
    setSaving(true);
    await siteFlagsService.update(flags);
    setSaving(false);
    toast.success("Site settings saved");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Website"
        title="Site identity & modes"
        description="Brand identity, contact details, social links, announcement bar and platform-wide modes."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Website" }]}
        actions={
          <Button onClick={save} disabled={saving || !flags}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile icon={Globe} label="Site status" value={flags?.maintenanceMode ? "Maintenance" : flags?.comingSoonMode ? "Coming soon" : "Live"} tone={flags?.maintenanceMode ? "warning" : flags?.comingSoonMode ? "info" : "success"} />
        <StatTile icon={Megaphone} label="Announcement" value={flags?.announcementEnabled ? "Active" : "Off"} hint={flags?.announcementEnabled ? flags.announcementText.slice(0, 40) + "…" : "No banner"} tone={flags?.announcementEnabled ? "primary" : "default"} />
        <StatTile icon={LinkIcon} label="Contact channels" value="5" hint="Email, phone, address + 3 socials" />
      </div>

      <IdentitySettings />
      <SocialLinksSettings />

      {flags && (
        <>
          <SectionCard title="Announcement bar" icon={Megaphone} description="Top-of-site promotional bar shown on every page.">
            <SettingsRow
              title="Show announcement bar"
              description="Toggle the announcement strip across the public site."
              control={<Switch checked={flags.announcementEnabled} onCheckedChange={(v) => setFlags({ ...flags, announcementEnabled: v })} />}
            />
            <div className="grid gap-3 pt-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <Label>Announcement text</Label>
                <Input value={flags.announcementText} onChange={(e) => setFlags({ ...flags, announcementText: e.target.value })} />
              </div>
              <div>
                <Label>Variant</Label>
                <Select value={flags.announcementVariant} onValueChange={(v) => setFlags({ ...flags, announcementVariant: v as SiteFlags["announcementVariant"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label>Click-through link</Label>
                <Input value={flags.announcementLink} onChange={(e) => setFlags({ ...flags, announcementLink: e.target.value })} placeholder="/services/cleaning" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Maintenance mode" icon={Wrench} description="Show a maintenance page to all public visitors. Admins keep full access.">
            <SettingsRow
              title="Enable maintenance mode"
              description="Public site shows the maintenance message; bookings are paused."
              control={<Switch checked={flags.maintenanceMode} onCheckedChange={(v) => setFlags({ ...flags, maintenanceMode: v })} />}
            />
            <div className="pt-4">
              <Label>Public-facing message</Label>
              <Textarea rows={3} value={flags.maintenanceMessage} onChange={(e) => setFlags({ ...flags, maintenanceMessage: e.target.value })} />
            </div>
          </SectionCard>

          <SectionCard title="Coming soon mode" icon={Hourglass} description="Show a launch teaser instead of the live site — useful for beta cities.">
            <SettingsRow
              title="Enable coming soon mode"
              description="Visitors see the launch teaser with email signup."
              control={<Switch checked={flags.comingSoonMode} onCheckedChange={(v) => setFlags({ ...flags, comingSoonMode: v })} />}
            />
            <div className="pt-4">
              <Label>Teaser message</Label>
              <Textarea rows={3} value={flags.comingSoonMessage} onChange={(e) => setFlags({ ...flags, comingSoonMessage: e.target.value })} />
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
