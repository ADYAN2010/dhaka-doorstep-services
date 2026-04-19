/**
 * Stubbed during the MySQL migration. The original Supabase-backed finance
 * dashboard will be rewritten against the Express backend.
 */
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export function AdminFinance() {
  return (
    <MigrationPlaceholder
      title="Finance — being migrated"
      description="Payments, commissions, payouts, and invoices are moving to the new MySQL backend. It will be back shortly."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  );
}
