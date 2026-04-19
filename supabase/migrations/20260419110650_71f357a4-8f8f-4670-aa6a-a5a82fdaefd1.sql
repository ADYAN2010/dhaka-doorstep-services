-- ============================================================
-- STATIC PAGES (About, Contact, Privacy, Terms, etc.)
-- ============================================================
CREATE TABLE public.static_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  meta_title text,
  meta_description text,
  og_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages are publicly readable"
  ON public.static_pages FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY "Admins manage static pages"
  ON public.static_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_static_pages_updated_at
  BEFORE UPDATE ON public.static_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FAQs
-- ============================================================
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'General',
  question text NOT NULL,
  answer text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible FAQs are publicly readable"
  ON public.faqs FOR SELECT TO anon, authenticated
  USING (is_visible = true);
CREATE POLICY "Admins manage FAQs"
  ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TYPE public.coupon_discount_type AS ENUM ('percent', 'fixed');
CREATE TYPE public.coupon_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'expired');

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type public.coupon_discount_type NOT NULL DEFAULT 'percent',
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  min_order_amount numeric(10,2),
  max_discount_amount numeric(10,2),
  usage_limit int,
  used_count int NOT NULL DEFAULT 0,
  per_user_limit int DEFAULT 1,
  valid_from timestamptz,
  valid_until timestamptz,
  status public.coupon_status NOT NULL DEFAULT 'draft',
  category_filter text,
  city_filter text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- MARKETING CAMPAIGNS
-- ============================================================
CREATE TYPE public.campaign_channel AS ENUM ('banner', 'email', 'sms', 'push', 'multi');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'live', 'paused', 'ended');

CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  channel public.campaign_channel NOT NULL DEFAULT 'banner',
  status public.campaign_status NOT NULL DEFAULT 'draft',
  audience_segment text,
  target_city text,
  target_category text,
  budget numeric(12,2),
  spent numeric(12,2) NOT NULL DEFAULT 0,
  impressions int NOT NULL DEFAULT 0,
  clicks int NOT NULL DEFAULT 0,
  conversions int NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage marketing campaigns"
  ON public.marketing_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- NOTIFICATION TEMPLATES (email + sms + push)
-- ============================================================
CREATE TYPE public.notification_channel AS ENUM ('email', 'sms', 'push');

CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel public.notification_channel NOT NULL,
  name text NOT NULL,
  trigger_event text,
  subject text,
  body text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  variables text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notification templates"
  ON public.notification_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ADMIN AUDIT LOG (append-only)
-- ============================================================
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert audit log"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_id = auth.uid());
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_admin_audit_log_actor ON public.admin_audit_log (actor_id);
CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log (target_type, target_id);

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL,
  target_id text NOT NULL,
  body text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage admin notes"
  ON public.admin_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND author_id = auth.uid());
CREATE INDEX idx_admin_notes_target ON public.admin_notes (target_type, target_id);
CREATE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CITIES
-- ============================================================
CREATE TYPE public.city_launch_status AS ENUM ('coming_soon', 'beta', 'live', 'paused');

CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  country text NOT NULL DEFAULT 'Bangladesh',
  launch_status public.city_launch_status NOT NULL DEFAULT 'coming_soon',
  launched_at date,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are publicly readable"
  ON public.cities FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Admins manage cities"
  ON public.cities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ZONES
-- ============================================================
CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  pricing_modifier numeric(5,2) NOT NULL DEFAULT 1.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, name)
);
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active zones are publicly readable"
  ON public.zones FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Admins manage zones"
  ON public.zones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON public.zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SERVICE SUBCATEGORIES
-- ============================================================
CREATE TABLE public.service_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  base_price numeric(10,2),
  display_order int NOT NULL DEFAULT 0,
  is_trending boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_seasonal boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active subcategories are publicly readable"
  ON public.service_subcategories FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Admins manage service subcategories"
  ON public.service_subcategories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_service_subcategories_updated_at
  BEFORE UPDATE ON public.service_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SUPPORT TICKET CATEGORIES
-- ============================================================
CREATE TABLE public.support_ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  default_priority text NOT NULL DEFAULT 'normal',
  sla_hours int NOT NULL DEFAULT 24,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_ticket_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ticket categories"
  ON public.support_ticket_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_support_ticket_categories_updated_at
  BEFORE UPDATE ON public.support_ticket_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO public.static_pages (slug, title, body, meta_title, meta_description, is_published) VALUES
  ('about', 'About ServiceHub Bangladesh', 'ServiceHub is the leading on-demand home services marketplace in Bangladesh. We connect verified professionals with customers across Dhaka and beyond.', 'About — ServiceHub Bangladesh', 'Learn about ServiceHub, the trusted home services marketplace in Bangladesh.', true),
  ('contact', 'Contact us', 'Reach our support team 7 days a week. Phone: 09678-123456. Email: hello@servicehub.bd', 'Contact — ServiceHub Bangladesh', 'Get in touch with the ServiceHub team for support, partnership, or general inquiries.', true),
  ('privacy', 'Privacy policy', 'This privacy policy describes how we collect, use, and protect your personal data when you use ServiceHub.', 'Privacy policy — ServiceHub', 'Read how ServiceHub protects your personal data and privacy.', true),
  ('terms', 'Terms of service', 'By using ServiceHub you agree to these terms. Please read them carefully before booking a service.', 'Terms of service — ServiceHub', 'Terms and conditions for using the ServiceHub platform.', true);

INSERT INTO public.faqs (category, question, answer, display_order) VALUES
  ('General', 'How does ServiceHub work?', 'Browse providers, request a booking with your preferred date and time slot, and a verified professional will confirm.', 1),
  ('General', 'Which areas do you cover?', 'We currently serve Dhaka neighborhoods including Gulshan, Banani, Dhanmondi, Uttara, Mirpur, Bashundhara and more.', 2),
  ('Pricing', 'Are quoted prices final?', 'Most quotes are final but complex jobs may need an on-site inspection. The provider will always confirm before starting.', 3),
  ('Pricing', 'What payment methods do you accept?', 'We accept cash, bKash, Nagad, bank transfer and card payments depending on the provider.', 4),
  ('Booking', 'Can I cancel a booking?', 'Yes — bookings in the "new" or "confirmed" state can be cancelled free of charge from your dashboard.', 5),
  ('Providers', 'How do I become a service provider?', 'Apply through the "Become a provider" page. Our team reviews applications within 48 hours.', 6);

INSERT INTO public.cities (name, slug, launch_status, launched_at, display_order) VALUES
  ('Dhaka', 'dhaka', 'live', '2024-01-01', 1),
  ('Chattogram', 'chattogram', 'beta', '2024-09-15', 2),
  ('Sylhet', 'sylhet', 'coming_soon', NULL, 3),
  ('Rajshahi', 'rajshahi', 'coming_soon', NULL, 4),
  ('Khulna', 'khulna', 'coming_soon', NULL, 5);

WITH dhaka AS (SELECT id FROM public.cities WHERE slug = 'dhaka')
INSERT INTO public.zones (city_id, name, pricing_modifier)
SELECT dhaka.id, z.name, z.modifier FROM dhaka, (VALUES
  ('Gulshan', 1.20),
  ('Banani', 1.15),
  ('Dhanmondi', 1.10),
  ('Uttara', 1.05),
  ('Mirpur', 1.00),
  ('Bashundhara', 1.10),
  ('Mohammadpur', 1.00),
  ('Old Dhaka', 0.95)
) AS z(name, modifier);

INSERT INTO public.notification_templates (channel, name, trigger_event, subject, body, variables) VALUES
  ('email', 'Booking confirmed', 'booking.confirmed', 'Your booking is confirmed ✓', 'Hi {{customer_name}}, your {{service_name}} booking on {{date}} at {{time}} is confirmed.', ARRAY['customer_name','service_name','date','time']),
  ('email', 'Provider accepted lead', 'booking.assigned', 'Your provider is on the way', 'Hi {{customer_name}}, {{provider_name}} has accepted your booking. Contact: {{provider_phone}}', ARRAY['customer_name','provider_name','provider_phone']),
  ('email', 'Booking completed', 'booking.completed', 'How was your service?', 'Thanks for using ServiceHub. Please rate your experience with {{provider_name}}.', ARRAY['provider_name']),
  ('sms', 'Booking reminder', 'booking.reminder', NULL, 'Reminder: {{service_name}} tomorrow at {{time}}. Provider: {{provider_phone}}', ARRAY['service_name','time','provider_phone']),
  ('sms', 'Provider assigned', 'booking.assigned.sms', NULL, '{{provider_name}} accepted your booking. Call: {{provider_phone}}', ARRAY['provider_name','provider_phone']),
  ('push', 'New lead available', 'lead.new', 'New lead in your area', 'A new {{category}} job in {{area}} is open for acceptance.', ARRAY['category','area']);

INSERT INTO public.support_ticket_categories (name, description, default_priority, sla_hours, display_order) VALUES
  ('Booking issue', 'Problems with an existing booking', 'high', 4, 1),
  ('Payment & refund', 'Payment, invoice and refund questions', 'high', 8, 2),
  ('Provider quality', 'Concerns about service quality', 'normal', 24, 3),
  ('Account & login', 'Trouble accessing your account', 'normal', 12, 4),
  ('Provider onboarding', 'Help with provider applications', 'low', 48, 5),
  ('General inquiry', 'Anything else', 'low', 48, 6);

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_from, valid_until, status, category_filter) VALUES
  ('WELCOME20', '20% off your first booking', 'percent', 20, 500, 300, 1000, now(), now() + interval '90 days', 'active', NULL),
  ('CLEAN150', 'Tk 150 off cleaning services', 'fixed', 150, 800, NULL, 500, now(), now() + interval '30 days', 'active', 'Cleaning'),
  ('EID2025', 'Eid special — 15% off', 'percent', 15, 1000, 500, 2000, now() + interval '60 days', now() + interval '75 days', 'scheduled', NULL),
  ('SUMMER10', 'Monsoon special — 10%', 'percent', 10, 500, 200, NULL, now() - interval '60 days', now() - interval '5 days', 'expired', NULL);

INSERT INTO public.marketing_campaigns (name, description, channel, status, audience_segment, target_city, target_category, budget, spent, impressions, clicks, conversions, starts_at, ends_at) VALUES
  ('Eid Cleaning Push', 'Pre-Eid deep cleaning awareness in Gulshan/Banani', 'multi', 'live', 'returning_customers', 'Dhaka', 'Cleaning', 50000, 18250, 124000, 8400, 312, now() - interval '10 days', now() + interval '20 days'),
  ('Provider Recruitment', 'Recruit electricians in Dhaka and Chattogram', 'banner', 'live', 'prospective_providers', NULL, 'Electrical', 25000, 9600, 56000, 2200, 48, now() - interval '30 days', now() + interval '60 days'),
  ('Monsoon AC Service', 'Promote AC service before monsoon', 'email', 'scheduled', 'all_customers', 'Dhaka', 'AC Service', 30000, 0, 0, 0, 0, now() + interval '15 days', now() + interval '45 days'),
  ('Welcome Offer', 'New user 20% discount campaign', 'multi', 'live', 'new_users', NULL, NULL, 100000, 42300, 380000, 24500, 1240, now() - interval '60 days', now() + interval '90 days');