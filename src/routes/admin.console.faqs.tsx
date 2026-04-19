import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export const Route = createFileRoute("/admin/console/faqs")({
  component: () => (
    <MigrationPlaceholder
      title="FAQs"
      description="FAQ management is coming soon."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  ),
});
