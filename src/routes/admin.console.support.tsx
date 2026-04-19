import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/support")({
  component: () => (
    <MigrationPlaceholder
      title="Support"
      description="Support ticket management is coming soon."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
