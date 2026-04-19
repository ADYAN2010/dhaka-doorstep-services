import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/team")({
  component: () => (
    <MigrationPlaceholder
      title="Team & roles"
      description="Team and role management is coming soon."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
