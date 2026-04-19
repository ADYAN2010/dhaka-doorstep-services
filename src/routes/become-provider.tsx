import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/become-provider")({
  component: () => <MigrationPlaceholder title="Become a provider" description="Provider applications are being restored on Supabase." />,
});
