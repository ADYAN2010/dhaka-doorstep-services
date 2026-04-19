import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/_authenticated/coverage")({
  component: () => (
    <MigrationPlaceholder
      title="Coverage areas are being upgraded"
      description="Service categories and area coverage settings are being rebuilt on our new backend."
    />
  ),
});
