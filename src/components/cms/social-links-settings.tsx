import { Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppearance, type SocialLinks } from "@/components/appearance-provider";

const FIELDS: { key: keyof SocialLinks; label: string; icon: typeof Facebook; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/yourhandle" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/company/..." },
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@channel" },
  { key: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "https://x.com/handle" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "https://wa.me/8801700000000" },
];

export function SocialLinksSettings() {
  const { settings, updateSocial, update } = useAppearance();
  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Share2 className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Footer & social links</div>
          <div className="text-xs text-muted-foreground">
            Tagline shown in the footer and social profile URLs used in the footer & meta tags.
          </div>
        </div>
      </div>

      <div>
        <Label>Footer tagline</Label>
        <Textarea
          rows={2}
          value={settings.footerTagline}
          onChange={(e) => update({ footerTagline: e.target.value })}
          placeholder="One-line description shown above the footer columns"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="flex items-center gap-1.5">
              <f.icon className="h-3 w-3" /> {f.label}
            </Label>
            <Input
              type="url"
              value={settings.social[f.key]}
              onChange={(e) => updateSocial(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
