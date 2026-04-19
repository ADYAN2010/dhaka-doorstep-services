import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
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
import { categories as ALL_CATEGORIES } from "@/data/categories";
import { areas as ALL_AREAS } from "@/data/areas";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/become-provider")({
  component: BecomeProviderPage,
  head: () => ({
    ...buildSeo({
      title: "Become a Shebabd provider — earn on your schedule",
      description:
        "Apply to join Shebabd as a verified service provider in Dhaka. Get steady leads, simple tools, and weekly payouts.",
      canonical: "/become-provider",
      image: OG.becomeProvider,
    }),
  }),
});

function BecomeProviderPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: user?.email ?? "",
    phone: "",
    applicant_type: "individual" as "individual" | "agency",
    category: "",
    coverage_area: "",
    experience: "",
    team_size: "",
    availability: "",
    about: "",
  });

  const PERKS = [
    { icon: TrendingUp, title: t("becomeProviderPage.perk1Title"), body: t("becomeProviderPage.perk1Body") },
    { icon: ShieldCheck, title: t("becomeProviderPage.perk2Title"), body: t("becomeProviderPage.perk2Body") },
    { icon: Sparkles, title: t("becomeProviderPage.perk3Title"), body: t("becomeProviderPage.perk3Body") },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.category ||
      !form.coverage_area ||
      !form.experience.trim()
    ) {
      toast.error(t("becomeProviderPage.missing"));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("provider_applications").insert({
      user_id: user?.id ?? null,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      applicant_type: form.applicant_type,
      category: form.category,
      coverage_area: form.coverage_area,
      experience: form.experience.trim(),
      team_size: form.team_size.trim() || null,
      availability: form.availability.trim() || null,
      about: form.about.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t("becomeProviderPage.failed"), { description: error.message });
      return;
    }
    setSubmitted(true);
    toast.success(t("becomeProviderPage.success"));
  }

  if (submitted) {
    return (
      <SiteShell>
        <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">{t("becomeProviderPage.doneTitle")}</h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            {t("becomeProviderPage.doneDesc")}
          </p>
          <Link to="/" className="mt-8">
            <Button variant="outline">{t("becomeProviderPage.backHome")}</Button>
          </Link>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow={t("becomeProviderPage.eyebrow")}
        title={t("becomeProviderPage.title")}
        description={t("becomeProviderPage.description")}
      />

      <section className="container-page grid gap-10 py-10 lg:grid-cols-[1.5fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <h2 className="text-xl font-semibold">{t("becomeProviderPage.formTitle")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("becomeProviderPage.fullName")} *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("becomeProviderPage.phone")} *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">{t("becomeProviderPage.email")} *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("becomeProviderPage.applicantType")} *</Label>
              <Select
                value={form.applicant_type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, applicant_type: v as "individual" | "agency" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">{t("becomeProviderPage.individual")}</SelectItem>
                  <SelectItem value="agency">{t("becomeProviderPage.agency")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("becomeProviderPage.teamSize")}</Label>
              <Input
                value={form.team_size}
                onChange={(e) => setForm((f) => ({ ...f, team_size: e.target.value }))}
                placeholder={t("becomeProviderPage.teamSizePh")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("becomeProviderPage.category")} *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("becomeProviderPage.categoryPh")} />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("becomeProviderPage.coverage")} *</Label>
              <Select
                value={form.coverage_area}
                onValueChange={(v) => setForm((f) => ({ ...f, coverage_area: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("becomeProviderPage.coveragePh")} />
                </SelectTrigger>
                <SelectContent>
                  {ALL_AREAS.map((a) => (
                    <SelectItem key={a.slug} value={a.slug}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="experience">{t("becomeProviderPage.experience")} *</Label>
              <Input
                id="experience"
                value={form.experience}
                onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                placeholder={t("becomeProviderPage.experiencePh")}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="availability">{t("becomeProviderPage.availability")}</Label>
              <Input
                id="availability"
                value={form.availability}
                onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
                placeholder={t("becomeProviderPage.availabilityPh")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="about">{t("becomeProviderPage.about")}</Label>
              <Textarea
                id="about"
                rows={5}
                value={form.about}
                onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                placeholder={t("becomeProviderPage.aboutPh")}
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="mt-6">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("becomeProviderPage.submitting")}
              </>
            ) : (
              t("becomeProviderPage.submit")
            )}
          </Button>
        </form>

        <aside className="space-y-4">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </aside>
      </section>
    </SiteShell>
  );
}
