/**
 * Stubbed during the MySQL migration. Blog posts and contact messages now
 * have Express endpoints; this admin UI will be rewritten on top of them.
 */
import { MigrationPlaceholder } from "@/components/migration-placeholder";

export function AdminBlogAndMessages() {
  return (
    <MigrationPlaceholder
      title="Blog & messages — being migrated"
      description="Article publishing and inbound message management are moving to the new MySQL backend. It will be back shortly."
      backTo="/admin/console"
      backLabel="Back to admin console"
    />
  );
}
