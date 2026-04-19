/**
 * Placeholder payout queue. To be rebuilt against the Supabase
 * `admin_create_payout` RPC in a follow-up.
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
