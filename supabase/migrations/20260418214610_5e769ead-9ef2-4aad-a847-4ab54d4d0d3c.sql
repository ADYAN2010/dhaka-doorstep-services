-- ===== SAVED PROVIDERS =====
CREATE TABLE public.saved_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_id)
);
CREATE INDEX idx_saved_providers_user ON public.saved_providers(user_id);
CREATE INDEX idx_saved_providers_provider ON public.saved_providers(provider_id);
ALTER TABLE public.saved_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved providers"
ON public.saved_providers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can save providers for themselves"
ON public.saved_providers FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_approved_provider(provider_id)
);

CREATE POLICY "Users can unsave own saved providers"
ON public.saved_providers FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ===== REVIEWS =====
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  provider_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_booking ON public.reviews(booking_id);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (used on public provider pages)
CREATE POLICY "Reviews are publicly readable"
ON public.reviews FOR SELECT
USING (true);

-- Only the customer of a completed booking with that provider can create the review
CREATE POLICY "Customers can review their completed bookings"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
      AND b.user_id = auth.uid()
      AND b.provider_id = provider_id
      AND b.status = 'completed'::booking_status
  )
);

CREATE POLICY "Customers can update their own reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can delete their own reviews"
ON public.reviews FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can moderate reviews"
ON public.reviews FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Aggregate view for a provider's rating + count
CREATE VIEW public.provider_review_stats AS
SELECT
  provider_id,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*)::int AS review_count
FROM public.reviews
GROUP BY provider_id;

-- ===== PROVIDER AVAILABILITY =====
-- weekday: 0 = Sunday … 6 = Saturday (matches JS getDay())
CREATE TABLE public.provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '18:00',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, weekday),
  CHECK (end_time > start_time)
);
CREATE INDEX idx_provider_availability_user ON public.provider_availability(user_id);
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved provider availability is publicly readable"
ON public.provider_availability FOR SELECT
USING (public.is_approved_provider(user_id));

CREATE POLICY "Providers manage their own availability"
ON public.provider_availability FOR ALL TO authenticated
USING (user_id = auth.uid() AND public.is_approved_provider(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_approved_provider(auth.uid()));

CREATE POLICY "Admins manage all availability"
ON public.provider_availability FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_provider_availability_updated_at
BEFORE UPDATE ON public.provider_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is the provider available at a given weekday/time?
-- If they have NO availability rows at all, treat as "always available" so existing
-- providers don't suddenly stop seeing leads.
CREATE OR REPLACE FUNCTION public.provider_available_at(_user_id uuid, _weekday smallint, _time time)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NOT EXISTS (SELECT 1 FROM public.provider_availability WHERE user_id = _user_id)
    OR EXISTS (
      SELECT 1 FROM public.provider_availability
      WHERE user_id = _user_id
        AND weekday = _weekday
        AND is_active = true
        AND start_time <= _time
        AND end_time > _time
    );
$$;