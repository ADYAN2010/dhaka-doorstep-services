-- Catalog of individual services (e.g. "Deep Home Cleaning")
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES public.service_subcategories(id) ON DELETE SET NULL,
  slug text NOT NULL,
  name text NOT NULL,
  short_description text,
  starting_price numeric,
  unit text,
  duration text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_category_slug_unique UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_subcategory ON public.services(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active) WHERE is_active = true;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active services are publicly readable"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();