import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/_authenticated/availability")({
  component: () => (
    <MigrationPlaceholder
      title="Availability settings are being upgraded"
      description="Weekly hours and day-off scheduling are being rebuilt on our new backend."
    />
  ),
});
