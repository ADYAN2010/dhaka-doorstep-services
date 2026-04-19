/**
 * Placeholder for the consolidated finance admin view. Use the dedicated
 * Finance page in the admin console for payments, payouts, and invoices.
 */
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export function AdminFinance() {
  return (
    <MigrationPlaceholder
      title="Finance"
      description="Use the Finance page in the admin console to manage payments, commissions, payouts, and invoices."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  );
}
