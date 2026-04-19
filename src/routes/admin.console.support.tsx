import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/support")({
  component: () => (
    <MigrationPlaceholder
      title="Support — being migrated"
      description="Support tickets are moving to the new MySQL backend. It will be back shortly."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
