import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/_authenticated/profile")({
  component: () => (
    <MigrationPlaceholder
      title="Profile settings are being upgraded"
      description="Profile edits, avatar uploads, and preferences are being rebuilt on our new backend."
    />
  ),
});
