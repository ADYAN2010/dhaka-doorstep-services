import { useEffect, useState } from "react";
import { Gift, Loader2, Save } from "lucide-react";
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
import { marketingService, type ReferralSettings } from "@/services/marketing";

export function ReferralSettingsCard() {
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setSettings(await marketingService.getReferralSettings());
  }
  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    await marketingService.saveReferralSettings(settings);
    setSaving(false);
    toast.success("Referral program saved");
  }

  if (!settings) {
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-card py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Growth loop
          </div>
          <div className="text-base font-semibold">Referral program</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
          <Gift className="h-3 w-3" /> Refer & earn
        </span>
      </div>
      <div className="grid gap-4 p-5">
        <label className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
          <div>
            <div className="text-sm font-medium">Enable referral program</div>
            <div className="text-xs text-muted-foreground">
              Customers can share a link to invite new users.
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Referrer reward (BDT)</Label>
            <Input
              type="number"
              value={settings.referrerReward}
              onChange={(e) =>
                setSettings({ ...settings, referrerReward: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Referee reward (BDT)</Label>
            <Input
              type="number"
              value={settings.refereeReward}
              onChange={(e) =>
                setSettings({ ...settings, refereeReward: Number(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Reward type</Label>
            <Select
              value={settings.rewardType}
              onValueChange={(v) =>
                setSettings({ ...settings, rewardType: v as ReferralSettings["rewardType"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Wallet credit</SelectItem>
                <SelectItem value="cash">Cash bonus</SelectItem>
                <SelectItem value="discount">Discount voucher</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Trigger after</Label>
            <Input
              type="number"
              value={settings.triggerThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  triggerThreshold: Number(e.target.value) || 1,
                })
              }
            />
          </div>
          <div>
            <Label>Expires (days)</Label>
            <Input
              type="number"
              value={settings.expiryDays}
              onChange={(e) =>
                setSettings({ ...settings, expiryDays: Number(e.target.value) || 30 })
              }
            />
          </div>
        </div>
        <div>
          <Label>Default share copy</Label>
          <Textarea
            rows={2}
            value={settings.shareCopy}
            onChange={(e) => setSettings({ ...settings, shareCopy: e.target.value })}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
