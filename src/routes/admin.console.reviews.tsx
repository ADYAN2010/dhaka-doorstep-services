import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/reviews")({
  component: () => (
    <MigrationPlaceholder
      title="Reviews"
      description="Review moderation is coming soon."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
