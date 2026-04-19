import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/reviews")({
  component: () => (
    <MigrationPlaceholder
      title="Reviews — being migrated"
      description="Review moderation is moving to the new MySQL backend. It will be back shortly."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
