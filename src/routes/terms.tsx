import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Shebabd" },
      { name: "description", content: "Terms of use for the Shebabd service marketplace." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" description="Last updated: April 18, 2026" />
      <section className="container-page py-12">
        <article className="prose prose-sm mx-auto max-w-3xl text-sm leading-relaxed text-muted-foreground">
          <p>Welcome to Shebabd. By using our website, mobile app or any service we offer, you agree to be bound by these terms.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">1. Our role</h3>
          <p>Shebabd is a marketplace that connects customers with verified service providers. We act as the trusted middle layer, handling verification, matching, support and payments.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">2. Bookings</h3>
          <p>All bookings are subject to provider availability. We aim to confirm every request within an hour.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">3. Payments</h3>
          <p>Pricing shown is a starting estimate. Final pricing is confirmed before work begins. No payment is taken before the work is completed and approved.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">4. Service guarantee</h3>
          <p>If you are not satisfied with the work, contact us within 48 hours and we will arrange a re-do or refund as appropriate.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">5. Provider conduct</h3>
          <p>Providers agree to follow our quality standards, code of conduct and pricing transparency requirements.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">6. Liability</h3>
          <p>Shebabd is not liable for damages caused by providers beyond what is recoverable under our service guarantee. Major works should be insured separately.</p>
          <h3 className="mt-6 text-base font-semibold text-foreground">7. Contact</h3>
          <p>Questions? Email legal@shebabd.com.</p>
        </article>
      </section>
    </SiteShell>
  );
}
