import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Shebabd — We're here to help" },
      { name: "description", content: "Reach the Shebabd team in Dhaka. Phone, WhatsApp, email and office address. Bangla-speaking support 7 days a week." },
      { property: "og:title", content: "Contact Shebabd" },
      { property: "og:description", content: "Bangla-speaking support 7 days a week." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(2000),
});

function ContactPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    message: "",
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      email: parsed.data.email,
      message: parsed.data.message,
      user_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Message sent! We'll reply within one business day.");
    setForm({ full_name: "", phone: "", email: "", message: "" });
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Contact"
        title={<>We&apos;re here, <span className="text-gradient-primary">7 days a week</span></>}
        description="Bangla-speaking team in Dhaka. Reach us by phone, WhatsApp, email — or visit our office."
      />

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Phone, t: "Call us", d: "+880 1700 000000", sub: "Sat–Thu, 9am – 9pm", href: "tel:+8801700000000" },
              { icon: MessageCircle, t: "WhatsApp", d: "+880 1700 000000", sub: "Fastest response", href: "https://wa.me/8801700000000" },
              { icon: Mail, t: "Email", d: "hello@shebabd.com", sub: "Replies within 24 hrs", href: "mailto:hello@shebabd.com" },
              { icon: MapPin, t: "Office", d: "House 12, Road 7, Dhanmondi, Dhaka 1205", sub: "By appointment", href: undefined },
            ].map((c) => {
              const inner = (
                <>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{c.t}</h3>
                  <p className="mt-1 text-base font-semibold text-card-foreground">{c.d}</p>
                  <p className="text-xs text-muted-foreground">{c.sub}</p>
                </>
              );
              return c.href ? (
                <a key={c.t} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
                  {inner}
                </a>
              ) : (
                <div key={c.t} className="rounded-2xl border border-border bg-card p-5">{inner}</div>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xl font-bold text-card-foreground">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">We&apos;ll get back to you within one business day.</p>

            <div className="mt-5 space-y-3">
              <Field label="Your name *">
                <input
                  className="input"
                  placeholder="Tasnim Akter"
                  required
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <input
                  className="input"
                  type="tel"
                  placeholder="+880 1700 000000"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
              <Field label="Email *">
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Message *">
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  className="input"
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                />
              </Field>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Sending…" : "Send message"}
              </button>
              <p className="text-center text-xs text-muted-foreground">We typically reply within a few hours.</p>
            </div>
          </form>
        </div>
      </section>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-background); padding: 0.625rem 0.875rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; transition: border-color 150ms; }
        .input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent); }
        .input::placeholder { color: var(--color-muted-foreground); }
      `}</style>
    </SiteShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
