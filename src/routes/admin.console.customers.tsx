import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/customers")({
  component: () => <MigrationPlaceholder title="Customers" description="Restoring on Supabase in Phase 3." />,
});
