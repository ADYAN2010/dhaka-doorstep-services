import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/_authenticated/provider-dashboard")({
  component: () => (
    <MigrationPlaceholder
      title="Provider workspace is being upgraded"
      description="We're rebuilding the provider tools — leads, jobs, earnings, and coverage — on our new backend. It will be back online shortly."
    />
  ),
});
