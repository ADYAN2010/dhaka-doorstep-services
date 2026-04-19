import { Link } from "@tanstack/react-router";
import { ArrowRight, Info, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { useAppearance } from "./appearance-provider";

const VARIANT_STYLES: Record<string, { bg: string; icon: typeof Info; iconBg: string }> = {
  info: { bg: "border-primary/20 bg-primary/5", icon: Info, iconBg: "bg-primary/15 text-primary" },
  success: { bg: "border-success/30 bg-success/5", icon: CheckCircle2, iconBg: "bg-success/15 text-success" },
  warning: { bg: "border-warning/30 bg-warning/5", icon: AlertTriangle, iconBg: "bg-warning/20 text-warning-foreground" },
  brand: { bg: "border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent", icon: Sparkles, iconBg: "bg-gradient-primary text-primary-foreground" },
};

export function SiteBanner() {
  const { settings } = useAppearance();
  if (!settings.bannerEnabled) return null;
  const v = VARIANT_STYLES[settings.bannerVariant] ?? VARIANT_STYLES.brand;
  const Icon = v.icon;

  return (
    <section className="container-page pt-6">
      <div className={`flex flex-col items-start gap-4 rounded-2xl border p-5 shadow-soft sm:flex-row sm:items-center ${v.bg}`}>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${v.iconBg}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground">{settings.bannerHeadline}</div>
          {settings.bannerSubtext && (
            <div className="mt-0.5 text-sm text-muted-foreground">{settings.bannerSubtext}</div>
          )}
        </div>
        {settings.bannerCta && settings.bannerHref && (
          <Link
            to={settings.bannerHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            {settings.bannerCta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}
