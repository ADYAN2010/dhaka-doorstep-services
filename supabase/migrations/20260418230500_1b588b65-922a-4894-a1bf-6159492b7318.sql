-- ============================================================
-- 1. Enums
-- ============================================================
CREATE TYPE public.payment_method AS ENUM ('cash','card','bkash','nagad','bank_transfer','other');
CREATE TYPE public.payment_gateway AS ENUM ('none','stripe','bkash','nagad','manual');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE public.invoice_status AS ENUM ('draft','issued','paid','void');
CREATE TYPE public.payout_status AS ENUM ('pending','paid','failed');
CREATE TYPE public.payout_method AS ENUM ('bank_transfer','bkash','nagad','cash','other');

-- ============================================================
-- 2. Categories with commission rates
-- ============================================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  commission_rate numeric(5,2) NOT NULL DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed from distinct categories already used in bookings (best-effort).
INSERT INTO public.categories (slug, name, commission_rate)
SELECT DISTINCT
  lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g')),
  category,
  15.00
FROM public.bookings
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.category_commission_rate(_category text)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT commission_rate FROM public.categories
       WHERE name = _category OR slug = _category LIMIT 1),
    15.00
  );
$$;

-- ============================================================
-- 3. Payments
-- ============================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'BDT',
  method public.payment_method NOT NULL,
  gateway public.payment_gateway NOT NULL DEFAULT 'manual',
  gateway_ref text,
  status public.payment_status NOT NULL DEFAULT 'paid',
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_booking ON public.payments(booking_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own booking payments"
  ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = payments.booking_id AND b.user_id = auth.uid()
  ));

CREATE POLICY "Assigned providers read own job payments"
  ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = payments.booking_id AND b.provider_id = auth.uid()
  ));

CREATE POLICY "Admins read all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins write payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 4. Invoices (with sequential numbering)
-- ============================================================
CREATE SEQUENCE public.invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'INV-' || LPAD(nextval('public.invoice_number_seq')::text, 6, '0');
$$;

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  invoice_number text NOT NULL UNIQUE,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  pdf_url text,
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_booking ON public.invoices(booking_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = invoices.booking_id AND b.user_id = auth.uid()
  ));

CREATE POLICY "Assigned providers read invoices for their jobs"
  ON public.invoices FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = invoices.booking_id AND b.provider_id = auth.uid()
  ));

CREATE POLICY "Admins manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. Commission ledger
-- ============================================================
CREATE TABLE public.commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  provider_id uuid NOT NULL,
  customer_id uuid,
  category text NOT NULL,
  gross_amount numeric(12,2) NOT NULL CHECK (gross_amount >= 0),
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  provider_net numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  paid_out boolean NOT NULL DEFAULT false,
  payout_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_provider ON public.commission_ledger(provider_id, paid_out);
CREATE INDEX idx_ledger_payout ON public.commission_ledger(payout_id);

ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider reads own ledger"
  ON public.commission_ledger FOR SELECT TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Customer reads own ledger"
  ON public.commission_ledger FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Admins manage ledger"
  ON public.commission_ledger FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 6. Payouts + items
-- ============================================================
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  period_start date,
  period_end date,
  total_net numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  method public.payout_method NOT NULL DEFAULT 'bank_transfer',
  reference text,
  status public.payout_status NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_provider ON public.payouts(provider_id, created_at DESC);

CREATE TABLE public.payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  ledger_id uuid NOT NULL REFERENCES public.commission_ledger(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ledger_id)
);
CREATE INDEX idx_payout_items_payout ON public.payout_items(payout_id);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider reads own payouts"
  ON public.payouts FOR SELECT TO authenticated
  USING (provider_id = auth.uid());
CREATE POLICY "Admins manage payouts"
  ON public.payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Provider reads own payout items"
  ON public.payout_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.payouts p
    WHERE p.id = payout_items.payout_id AND p.provider_id = auth.uid()
  ));
CREATE POLICY "Admins manage payout items"
  ON public.payout_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER payouts_set_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. Auto-create draft invoice on booking completion
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_booking_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv_exists boolean;
  est numeric(12,2);
BEGIN
  IF NEW.status = 'completed'::booking_status
     AND (OLD.status IS DISTINCT FROM 'completed'::booking_status) THEN

    SELECT EXISTS(SELECT 1 FROM public.invoices WHERE booking_id = NEW.id) INTO inv_exists;
    IF NOT inv_exists THEN
      -- Estimate from existing payments if any, else leave 0 for admin to set.
      SELECT COALESCE(SUM(amount), 0) INTO est
        FROM public.payments
       WHERE booking_id = NEW.id AND status = 'paid'::payment_status;

      INSERT INTO public.invoices (booking_id, invoice_number, subtotal, total, status)
      VALUES (NEW.id, public.next_invoice_number(), est, est, 'draft'::invoice_status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_completed();

-- ============================================================
-- 8. RPC: record a payment (and post commission if completed)
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_booking_payment(
  _booking_id uuid,
  _amount numeric,
  _method public.payment_method,
  _gateway public.payment_gateway DEFAULT 'manual',
  _gateway_ref text DEFAULT NULL,
  _status public.payment_status DEFAULT 'paid',
  _notes text DEFAULT NULL
) RETURNS public.payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  b public.bookings;
  p public.payments;
  inv public.invoices;
  total_paid numeric;
  rate numeric;
  comm numeric;
  net numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  -- Only admin or the assigned provider can record a payment for now.
  IF NOT public.has_role(uid,'admin') AND uid <> b.provider_id THEN
    RAISE EXCEPTION 'Not allowed to record payment for this booking';
  END IF;

  INSERT INTO public.payments (booking_id, amount, method, gateway, gateway_ref, status, notes, recorded_by)
  VALUES (_booking_id, _amount, _method, _gateway, _gateway_ref, _status, _notes, uid)
  RETURNING * INTO p;

  -- Maintain invoice if one exists.
  SELECT * INTO inv FROM public.invoices WHERE booking_id = _booking_id;
  IF FOUND THEN
    SELECT COALESCE(SUM(amount),0) INTO total_paid
      FROM public.payments WHERE booking_id = _booking_id AND status = 'paid'::payment_status;

    -- If the invoice total is 0 (auto-created from no prior payments), bump it to match.
    IF inv.total = 0 THEN
      UPDATE public.invoices
        SET subtotal = total_paid, total = total_paid, updated_at = now()
        WHERE id = inv.id RETURNING * INTO inv;
    END IF;

    IF total_paid >= inv.total AND inv.status <> 'paid'::invoice_status THEN
      UPDATE public.invoices
        SET status = 'paid'::invoice_status, paid_at = now(), updated_at = now()
        WHERE id = inv.id;
    END IF;
  END IF;

  -- If booking is completed, post (or update) commission ledger row.
  IF b.status = 'completed'::booking_status AND _status = 'paid'::payment_status THEN
    SELECT COALESCE(SUM(amount),0) INTO total_paid
      FROM public.payments WHERE booking_id = _booking_id AND status = 'paid'::payment_status;
    rate := public.category_commission_rate(b.category);
    comm := round(total_paid * rate / 100, 2);
    net  := total_paid - comm;

    INSERT INTO public.commission_ledger
      (booking_id, provider_id, customer_id, category, gross_amount, commission_rate, commission_amount, provider_net)
    VALUES
      (_booking_id, b.provider_id, b.user_id, b.category, total_paid, rate, comm, net)
    ON CONFLICT (booking_id) DO UPDATE
      SET gross_amount = EXCLUDED.gross_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          provider_net = EXCLUDED.provider_net;
  END IF;

  RETURN p;
END;
$$;

-- ============================================================
-- 9. RPC: provider/admin marks booking completed
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_booking_completed(_booking_id uuid)
RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  b public.bookings;
  updated public.bookings;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF NOT public.has_role(uid,'admin') AND uid <> b.provider_id THEN
    RAISE EXCEPTION 'Only the assigned provider or an admin can complete this booking';
  END IF;
  IF b.status = 'completed'::booking_status THEN RETURN b; END IF;

  UPDATE public.bookings
    SET status = 'completed'::booking_status, updated_at = now()
    WHERE id = _booking_id RETURNING * INTO updated;
  RETURN updated;
END;
$$;

-- ============================================================
-- 10. RPC: admin creates a payout from selected ledger rows
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_create_payout(
  _provider_id uuid,
  _ledger_ids uuid[],
  _method public.payout_method DEFAULT 'bank_transfer',
  _reference text DEFAULT NULL,
  _notes text DEFAULT NULL
) RETURNS public.payouts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  total numeric := 0;
  earliest date;
  latest date;
  po public.payouts;
  l public.commission_ledger;
BEGIN
  IF NOT public.has_role(uid,'admin') THEN
    RAISE EXCEPTION 'Only admins can create payouts';
  END IF;
  IF _ledger_ids IS NULL OR array_length(_ledger_ids,1) IS NULL THEN
    RAISE EXCEPTION 'No ledger entries selected';
  END IF;

  -- Validate every row belongs to this provider and is not already paid out.
  FOR l IN
    SELECT * FROM public.commission_ledger
    WHERE id = ANY(_ledger_ids) FOR UPDATE
  LOOP
    IF l.provider_id <> _provider_id THEN
      RAISE EXCEPTION 'Ledger row % does not belong to provider %', l.id, _provider_id;
    END IF;
    IF l.paid_out THEN
      RAISE EXCEPTION 'Ledger row % is already in a payout', l.id;
    END IF;
    total := total + l.provider_net;
    earliest := LEAST(earliest, l.created_at::date);
    latest   := GREATEST(latest,   l.created_at::date);
  END LOOP;

  INSERT INTO public.payouts (provider_id, period_start, period_end, total_net, method, reference, status, notes, created_by)
  VALUES (_provider_id, earliest, latest, total, _method, _reference, 'paid'::payout_status, _notes, uid)
  RETURNING * INTO po;

  UPDATE public.payouts SET paid_at = now() WHERE id = po.id;

  INSERT INTO public.payout_items (payout_id, ledger_id, amount)
  SELECT po.id, cl.id, cl.provider_net
    FROM public.commission_ledger cl
    WHERE cl.id = ANY(_ledger_ids);

  UPDATE public.commission_ledger
    SET paid_out = true, payout_id = po.id
    WHERE id = ANY(_ledger_ids);

  SELECT * INTO po FROM public.payouts WHERE id = po.id;
  RETURN po;
END;
$$;
