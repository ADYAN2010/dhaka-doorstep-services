/**
 * Placeholder for the consolidated blog + inbound messages admin view.
 * The standalone Blog and Messages pages in the admin console are the
 * primary surface for this functionality today.
 */
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export function AdminBlogAndMessages() {
  return (
    <MigrationPlaceholder
      title="Blog & messages"
      description="Use the Blog and Messages pages in the admin console to manage articles and inbound messages."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  );
}
