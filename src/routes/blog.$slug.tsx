import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/blog/$slug")({
  component: () => <MigrationPlaceholder title="Article" description="Restoring on Supabase in Phase 2." />,
});
