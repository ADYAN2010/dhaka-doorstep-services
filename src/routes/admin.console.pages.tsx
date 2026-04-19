import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/pages")({
  component: () => (
    <MigrationPlaceholder
      title="Static pages — being migrated"
      description="The static page editor is moving to the new MySQL backend. It will be back shortly."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
