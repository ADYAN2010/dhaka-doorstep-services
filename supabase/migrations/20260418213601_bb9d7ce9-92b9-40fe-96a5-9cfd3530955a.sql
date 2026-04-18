-- 1. Add provider_id to bookings
ALTER TABLE public.bookings
ADD COLUMN provider_id uuid;

CREATE INDEX idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX idx_bookings_status_provider ON public.bookings(status, provider_id);
CREATE INDEX idx_bookings_category_area ON public.bookings(category, area);

-- 2. Provider categories
CREATE TABLE public.provider_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);
CREATE INDEX idx_provider_categories_user ON public.provider_categories(user_id);
CREATE INDEX idx_provider_categories_cat ON public.provider_categories(category);
ALTER TABLE public.provider_categories ENABLE ROW LEVEL SECURITY;

-- 3. Provider areas
CREATE TABLE public.provider_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  area text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, area)
);
CREATE INDEX idx_provider_areas_user ON public.provider_areas(user_id);
CREATE INDEX idx_provider_areas_area ON public.provider_areas(area);
ALTER TABLE public.provider_areas ENABLE ROW LEVEL SECURITY;

-- 4. Helper: is the current user an approved provider?
CREATE OR REPLACE FUNCTION public.is_approved_provider(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'provider'::app_role
    WHERE p.id = _user_id
      AND p.provider_status = 'approved'::provider_status
  );
$$;

-- 5. Helper: does this approved provider cover this category + area?
CREATE OR REPLACE FUNCTION public.provider_covers(_user_id uuid, _category text, _area text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_approved_provider(_user_id)
    AND EXISTS (SELECT 1 FROM public.provider_categories WHERE user_id = _user_id AND category = _category)
    AND EXISTS (SELECT 1 FROM public.provider_areas WHERE user_id = _user_id AND area = _area);
$$;

-- 6. RLS for provider_categories
CREATE POLICY "Providers manage their own categories"
ON public.provider_categories
FOR ALL
TO authenticated
USING (user_id = auth.uid() AND public.is_approved_provider(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_approved_provider(auth.uid()));

CREATE POLICY "Admins manage all provider categories"
ON public.provider_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS for provider_areas
CREATE POLICY "Providers manage their own areas"
ON public.provider_areas
FOR ALL
TO authenticated
USING (user_id = auth.uid() AND public.is_approved_provider(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_approved_provider(auth.uid()));

CREATE POLICY "Admins manage all provider areas"
ON public.provider_areas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. RLS on bookings: approved providers can read open leads in their coverage
CREATE POLICY "Approved providers can view open leads in coverage"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  provider_id IS NULL
  AND status = 'new'::booking_status
  AND public.provider_covers(auth.uid(), category, area)
);

-- 9. RLS on bookings: assigned provider can view their own bookings
CREATE POLICY "Assigned provider can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (provider_id IS NOT NULL AND provider_id = auth.uid());

-- 10. RLS on bookings: assigned provider can update own bookings (status only enforced via function below)
CREATE POLICY "Assigned provider can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (provider_id IS NOT NULL AND provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

-- 11. accept_lead RPC — atomic first-come-first-served claim
CREATE OR REPLACE FUNCTION public.accept_lead(_booking_id uuid)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.bookings;
  updated public.bookings;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_approved_provider(uid) THEN
    RAISE EXCEPTION 'Only approved providers can accept leads';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF b.provider_id IS NOT NULL THEN
    RAISE EXCEPTION 'This lead has already been accepted';
  END IF;

  IF b.status <> 'new'::booking_status THEN
    RAISE EXCEPTION 'This lead is no longer open';
  END IF;

  IF NOT public.provider_covers(uid, b.category, b.area) THEN
    RAISE EXCEPTION 'This lead is not in your coverage';
  END IF;

  UPDATE public.bookings
  SET provider_id = uid,
      status = 'assigned'::booking_status,
      updated_at = now()
  WHERE id = _booking_id
  RETURNING * INTO updated;

  RETURN updated;
END;
$$;

-- 12. Seed coverage when an application is approved
CREATE OR REPLACE FUNCTION public.handle_application_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_area text;
BEGIN
  IF NEW.status = 'approved'::application_status
     AND (OLD.status IS DISTINCT FROM 'approved'::application_status)
     AND NEW.user_id IS NOT NULL THEN

    INSERT INTO public.provider_categories (user_id, category)
    VALUES (NEW.user_id, NEW.category)
    ON CONFLICT DO NOTHING;

    SELECT area INTO profile_area FROM public.profiles WHERE id = NEW.user_id;
    IF profile_area IS NOT NULL AND profile_area <> '' THEN
      INSERT INTO public.provider_areas (user_id, area)
      VALUES (NEW.user_id, profile_area)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_provider_application_approved
AFTER UPDATE ON public.provider_applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_application_approved();