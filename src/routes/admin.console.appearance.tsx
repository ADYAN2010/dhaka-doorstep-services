import { createFileRoute } from "@tanstack/react-router";
import { Save, RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppearance } from "@/components/appearance-provider";
import { LivePreview } from "@/components/cms/live-preview";
import { IdentitySettings } from "@/components/cms/identity-settings";
import { AccentColorPicker } from "@/components/cms/accent-color-picker";
import { TypographyPicker } from "@/components/cms/typography-picker";
import { ThemeModeControls } from "@/components/cms/theme-mode-controls";
import { SeasonalPresets } from "@/components/cms/seasonal-presets";
import { SectionVisibility } from "@/components/cms/section-visibility";
import { BannerImageManager } from "@/components/cms/banner-image-manager";
import { SocialLinksSettings } from "@/components/cms/social-links-settings";
import { PromoStripManager, SiteBannerManager } from "@/components/cms/promo-strip-manager";

export const Route = createFileRoute("/admin/console/appearance")({
  component: AppearancePage,
});

function AppearancePage() {
  const { reset } = useAppearance();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Branding"
        title="Branding control center"
        description="Live theme, identity, footer and content controls — every change previews instantly on the right."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                toast.success("Reset to defaults");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" onClick={() => toast.success("Branding saved — applied site-wide")}>
              <Save className="h-3.5 w-3.5" /> Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <Tabs defaultValue="theme">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
            </TabsList>

            <TabsContent value="theme" className="space-y-5">
              <SeasonalPresets />
              <AccentColorPicker />
              <ThemeModeControls />
              <TypographyPicker />
            </TabsContent>

            <TabsContent value="identity" className="space-y-5">
              <IdentitySettings />
              <BannerImageManager />
            </TabsContent>

            <TabsContent value="content" className="space-y-5">
              <PromoStripManager />
              <SiteBannerManager />
            </TabsContent>

            <TabsContent value="layout" className="space-y-5">
              <SectionVisibility />
            </TabsContent>

            <TabsContent value="footer" className="space-y-5">
              <SocialLinksSettings />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> Admin preview panel
          </div>
          <LivePreview />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            This is a miniature of your live site. Changes apply instantly across the entire
            platform — no refresh required.
          </p>
        </aside>
      </div>
    </div>
  );
}
