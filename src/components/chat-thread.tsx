/**
 * Stubbed during the MySQL migration. The realtime chat thread
 * (Supabase Realtime over `messages` / `message_threads`) will be
 * rebuilt on the Express backend with a new transport later.
 */
import { MigrationPlaceholder } from "@/components/migration-placeholder";

type Props = {
  bookingId?: string;
  threadId?: string | null;
};

export function ChatThread(_props: Props) {
  return (
    <MigrationPlaceholder
      title="Chat — being migrated"
      description="In-booking messaging is moving to the new backend. It will be back shortly."
    />
  );
}
