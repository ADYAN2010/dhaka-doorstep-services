import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Shebabd" },
      { name: "description", content: "How Shebabd collects, uses and protects your personal information." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated: April 18, 2026" />
      <section className="container-page py-12">
        <article className="prose prose-sm mx-auto max-w-3xl text-sm leading-relaxed text-muted-foreground">
          <p>Your privacy matters. This policy explains what we collect, how we use it, and your choices.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">What we collect</h3>
          <p>Name, phone, email, address, booking history, payment records, and (for providers) verification documents.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">How we use it</h3>
          <p>To match you with providers, confirm bookings, process payments, send service updates, and improve our platform. We never sell your data.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">Sharing</h3>
          <p>We share necessary booking details (name, area, contact) with the assigned provider only after you confirm a booking.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">Storage & security</h3>
          <p>Data is stored on secure cloud infrastructure. We follow industry standards to keep your information safe.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">Your rights</h3>
          <p>You can request access, correction or deletion of your data anytime by emailing privacy@shebabd.com.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">Contact</h3>
          <p>Questions? Email privacy@shebabd.com.</p>
        </article>
      </section>
    </SiteShell>
  );
}
