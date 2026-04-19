/**
 * Stubbed during the MySQL migration. The "record payment" dialog used
 * Supabase RPCs (`record_booking_payment`); it will be rebuilt against
 * the Express finance endpoints in a follow-up.
 */
type Props = {
  open?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
  bookingId?: string;
};

export function RecordPaymentDialog(_props: Props) {
  return null;
}
