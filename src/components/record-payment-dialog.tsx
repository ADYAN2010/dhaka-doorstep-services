/**
 * Placeholder "record payment" dialog. To be rebuilt against the Supabase
 * `record_booking_payment` RPC in a follow-up.
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
