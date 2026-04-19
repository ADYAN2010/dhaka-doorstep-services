import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/pages")({
  component: () => (
    <MigrationPlaceholder
      title="Static pages"
      description="The static page editor is coming soon."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
