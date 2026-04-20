import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarRange, CheckCircle2, Loader2 } from "lucide-react";
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
import { buildSeo } from "@/lib/seo";

const TIME_SLOTS = [
  "Morning (9 AM – 12 PM)",
  "Afternoon (12 PM – 4 PM)",
  "Evening (4 PM – 8 PM)",
];

const BUDGET_RANGES = [
  "Under ৳1,000",
  "৳1,000 – ৳3,000",
  "৳3,000 – ৳7,000",
  "৳7,000 – ৳15,000",
  "৳15,000+",
];

export const Route = createFileRoute("/book")({
  component: BookPage,
  validateSearch: (s: Record<string, unknown>): {
    category?: string;
    service?: string;
    area?: string;
  } => ({
    category: typeof s?.category === "string" ? s.category : undefined,
    service: typeof s?.service === "string" ? s.service : undefined,
    area: typeof s?.area === "string" ? s.area : undefined,
  }),
  head: () => ({
    ...buildSeo({
      title: "Book a verified service — Shebabd",
      description:
        "Book a trusted Shebabd professional in minutes. Choose a service, area, and time — we'll match you with a verified pro.",
      canonical: "/book",
    }),
  }),
});

function BookPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: user?.email ?? "",
    phone: "",
    category: search.category ?? "",
    service: search.service ?? "",
    area: search.area ?? "",
    address: "",
    preferred_date: today,
    preferred_time_slot: TIME_SLOTS[0],
    budget_range: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.full_name.trim() ||
      !form.phone.trim() ||
      !form.category ||
      !form.area ||
      !form.preferred_date ||
      !form.preferred_time_slot
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user?.id ?? null,
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim(),
        category: form.category,
        service: form.service.trim() || null,
        area: form.area,
        address: form.address.trim() || null,
        preferred_date: form.preferred_date,
        preferred_time_slot: form.preferred_time_slot,
        budget_range: form.budget_range || null,
        notes: form.notes.trim() || null,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast.error("Couldn't create your booking", { description: error?.message });
      return;
    }
    toast.success("Booking request sent!");
    void navigate({ to: "/booking-status/$id", params: { id: data.id } });
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="New booking"
        title="Book a verified pro"
        description="Tell us what you need — we'll match you with a trusted professional in your area."
      />
      <section className="container-page grid gap-10 py-10 lg:grid-cols-[1.7fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Service category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="service">Specific service (optional)</Label>
              <Input
                id="service"
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                placeholder="e.g. Deep cleaning, AC servicing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Your name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Area *</Label>
              <Select value={form.area} onValueChange={(v) => setForm((f) => ({ ...f, area: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your area" />
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
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="House, road, apartment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_date">Preferred date *</Label>
              <Input
                id="preferred_date"
                type="date"
                min={today}
                value={form.preferred_date}
                onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred time *</Label>
              <Select
                value={form.preferred_time_slot}
                onValueChange={(v) => setForm((f) => ({ ...f, preferred_time_slot: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Budget range (optional)</Label>
              <Select
                value={form.budget_range}
                onValueChange={(v) => setForm((f) => ({ ...f, budget_range: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes for the pro</Label>
              <Textarea
                id="notes"
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Anything that helps us match you with the right person."
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="mt-6">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending request…
              </>
            ) : (
              <>
                <CalendarRange className="mr-2 h-4 w-4" /> Confirm booking request
              </>
            )}
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">What happens next</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                We share your request with verified pros in your area.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                A pro accepts and contacts you to confirm timing.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                Service happens. Pay securely. Rate the experience.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-subtle p-6">
            <h3 className="text-sm font-semibold">Need help?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Call us at +880 1700 000000 or email support@shebabd.com — we're online 9 AM – 9 PM.
            </p>
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}
