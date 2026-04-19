/**
 * Stubbed during the MySQL migration. The payout queue used Supabase
 * RPCs (`admin_create_payout`); it will be rebuilt against the Express
 * finance endpoints in a follow-up.
 */
export type QueuedProvider = {
  providerId: string;
  providerName: string;
  pendingAmount: number;
  itemsCount: number;
  oldestEntry: string | null;
};

type Props = {
  rows?: QueuedProvider[];
  loading?: boolean;
  onPaid?: () => void;
};

export function PayoutQueue(_props: Props) {
  return null;
}
