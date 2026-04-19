import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildSeo, OG } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    ...buildSeo({
      title: "Contact Shebabd — we're here to help",
      description:
        "Reach Shebabd support 7 days a week. Send us a message and our Dhaka-based team will respond within one business day.",
      canonical: "/contact",
      image: OG.contact,
    }),
  }),
});

function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim(),
      user_id: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send your message", { description: error.message });
      return;
    }
    toast.success("Message sent! We'll get back to you within one business day.");
    setForm({ full_name: "", email: "", phone: "", message: "" });
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Contact"
        title="We're here to help"
        description="Send our Dhaka-based team a message and we'll respond within one business day."
      />
      <section className="container-page grid gap-10 py-10 lg:grid-cols-[1.5fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <h2 className="text-xl font-semibold">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your details and someone from the team will get back to you shortly.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+880 1XXX XXXXXX"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                rows={6}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="How can we help?"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="mt-6">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Send message
              </>
            )}
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Contact details</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <span>support@shebabd.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-primary" />
                <span>+880 1700 000000</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>Dhanmondi, Dhaka — Bangladesh</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-subtle p-6">
            <h3 className="text-sm font-semibold">Hours</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Mon – Sat · 9:00 AM – 9:00 PM
              <br />
              Sun · 10:00 AM – 6:00 PM
            </p>
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}
