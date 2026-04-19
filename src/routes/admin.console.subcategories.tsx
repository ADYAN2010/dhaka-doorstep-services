import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/subcategories")({
  component: () => (
    <MigrationPlaceholder
      title="Service templates"
      description="The service template editor is coming soon."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
