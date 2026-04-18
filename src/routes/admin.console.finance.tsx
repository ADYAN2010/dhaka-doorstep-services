import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminFinance } from "@/components/admin-finance";

export const Route = createFileRoute("/admin/console/finance")({
  component: FinancePage,
});

function FinancePage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Finance"
        title="Revenue & payouts"
        description="Track payments, commissions, payouts, and category rates in one place."
      />
      <AdminFinance />
    </div>
  );
}
