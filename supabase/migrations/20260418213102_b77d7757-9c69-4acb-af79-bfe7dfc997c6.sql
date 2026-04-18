CREATE POLICY "Users can cancel their own pending bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  user_id IS NOT NULL
  AND user_id = auth.uid()
  AND status IN ('new'::booking_status, 'confirmed'::booking_status)
)
WITH CHECK (
  user_id IS NOT NULL
  AND user_id = auth.uid()
  AND status = 'cancelled'::booking_status
);