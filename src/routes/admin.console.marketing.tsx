import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionReorder } from "@/components/cms/section-reorder";
import { FeaturedProviders } from "@/components/cms/featured-providers";
import { BannerCampaigns } from "@/components/cms/banner-campaigns";
import { FaqManager } from "@/components/cms/faq-manager";
import { BlogCategoryManager } from "@/components/cms/blog-category-manager";
import { CouponList } from "@/components/cms/coupon-list";
import { ReferralSettingsCard } from "@/components/cms/referral-settings";
import {
  CampaignPerformanceCards,
  UserSegmentFilters,
} from "@/components/cms/campaign-performance";
import {
  CityCampaignSummary,
  PromoStripManager,
  SiteBannerManager,
} from "@/components/cms/promo-strip-manager";
import { ArticleEditor } from "@/components/cms/article-editor";
import { marketingService, type BannerCampaign } from "@/services/marketing";

export const Route = createFileRoute("/admin/console/marketing")({
  component: MarketingPage,
});

function MarketingPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [banners, setBanners] = useState<BannerCampaign[]>([]);

  useEffect(() => {
    void marketingService.listBanners().then(setBanners);
  }, []);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Growth & Content"
        title="Marketing operations"
        description="Manage homepage layout, campaigns, coupons, blog, FAQ, and audience segments."
        actions={
          <Button size="sm" onClick={() => setEditorOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New article
          </Button>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          <CampaignPerformanceCards />
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <UserSegmentFilters />
            <CityCampaignSummary banners={banners} />
          </div>
        </TabsContent>

        <TabsContent value="homepage" className="mt-5 space-y-5">
          <SectionReorder />
          <FeaturedProviders />
          <SiteBannerManager />
        </TabsContent>

        <TabsContent value="banners" className="mt-5 space-y-5">
          <PromoStripManager />
          <BannerCampaigns />
          <CityCampaignSummary banners={banners} />
        </TabsContent>

        <TabsContent value="content" className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <BlogCategoryManager />
            <FaqManager />
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-primary" />
                  Article editor
                </div>
                <p className="text-xs text-muted-foreground">
                  Write a new blog post with live preview.
                </p>
              </div>
              <Button size="sm" onClick={() => setEditorOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New article
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="mt-5 space-y-5">
          <CouponList />
          <ReferralSettingsCard />
        </TabsContent>

        <TabsContent value="audience" className="mt-5 space-y-5">
          <UserSegmentFilters />
          <CampaignPerformanceCards />
        </TabsContent>
      </Tabs>

      <ArticleEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => setEditorOpen(false)}
      />
    </div>
  );
}
