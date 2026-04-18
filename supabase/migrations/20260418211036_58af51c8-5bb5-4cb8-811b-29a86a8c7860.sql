-- Status enums
CREATE TYPE public.booking_status AS ENUM ('new', 'confirmed', 'assigned', 'completed', 'cancelled');
CREATE TYPE public.application_status AS ENUM ('new', 'reviewing', 'approved', 'rejected');

-- ===== BOOKINGS =====
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,                       -- nullable: anonymous bookings allowed
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NULL,
  category text NOT NULL,
  service text NULL,
  area text NOT NULL,
  address text NULL,
  preferred_date date NOT NULL,
  preferred_time_slot text NOT NULL,
  budget_range text NULL,
  notes text NULL,
  status public.booking_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at DESC);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (anon or authed)
CREATE POLICY "Anyone can create a booking"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- If a user_id is provided it must match the caller; null is allowed.
    user_id IS NULL OR user_id = auth.uid()
  );

CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== PROVIDER APPLICATIONS =====
CREATE TABLE public.provider_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  applicant_type text NOT NULL,
  category text NOT NULL,
  experience text NOT NULL,
  coverage_area text NOT NULL,
  team_size text NULL,
  availability text NULL,
  about text NULL,
  status public.application_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_applications_status ON public.provider_applications(status);
CREATE INDEX idx_provider_applications_created_at ON public.provider_applications(created_at DESC);

ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a provider application"
  ON public.provider_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

CREATE POLICY "Admins can view all provider applications"
  ON public.provider_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update provider applications"
  ON public.provider_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete provider applications"
  ON public.provider_applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER provider_applications_set_updated_at
  BEFORE UPDATE ON public.provider_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();