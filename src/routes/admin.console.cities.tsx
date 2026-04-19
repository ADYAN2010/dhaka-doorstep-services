import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/cities")({
  component: () => (
    <MigrationPlaceholder
      title="Cities — being migrated"
      description="City management is moving to the new MySQL backend. Use the Locations page in the meantime."
      backTo="/admin/console/locations"
      backLabel="Go to locations"
    />
  ),
});
