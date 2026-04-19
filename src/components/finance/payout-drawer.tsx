/**
 * Stubbed during the MySQL migration. The payout details drawer used
 * Supabase queries against `payouts` / `payout_items`; it will be
 * rebuilt against the Express finance endpoints in a follow-up.
 */
type Props = {
  open?: boolean;
  onClose?: () => void;
  payoutId?: string | null;
};

export function PayoutDetailsDrawer(_props: Props) {
  return null;
}
