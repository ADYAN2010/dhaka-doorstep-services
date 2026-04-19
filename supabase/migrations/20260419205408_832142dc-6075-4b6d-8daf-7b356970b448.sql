
-- One-shot demo seed.
-- Creates 4 provider users + 2 customer users in auth.users, lets the
-- handle_new_user trigger build profiles + roles, then approves the
-- providers, seeds coverage, bookings in mixed statuses, contact messages,
-- and a couple of provider applications.
DO $seed$
DECLARE
  pwd_hash text := crypt('Demo!2345', gen_salt('bf'));  -- single shared password for all demo users

  -- provider ids
  p_clean uuid := gen_random_uuid();
  p_ac    uuid := gen_random_uuid();
  p_elec  uuid := gen_random_uuid();
  p_paint uuid := gen_random_uuid();

  -- customer ids
  c_aisha uuid := gen_random_uuid();
  c_rafi  uuid := gen_random_uuid();

  -- helper booking ids
  b1 uuid; b2 uuid; b3 uuid; b4 uuid; b5 uuid; b6 uuid;
BEGIN
  -- Skip entirely if we've already seeded (look for the marker email).
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo.shadhin@example.com') THEN
    RAISE NOTICE 'Demo data already seeded — skipping.';
    RETURN;
  END IF;

  -- ============== PROVIDERS ==============
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at)
  VALUES
    (p_clean, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.shadhin@example.com', pwd_hash, now(),
       jsonb_build_object('full_name','Shadhin Home Care','phone','+8801710000001','area','Dhanmondi','role','provider'),
       '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated','authenticated', now(), now()),
    (p_ac,    '00000000-0000-0000-0000-000000000000'::uuid, 'demo.cooltech@example.com', pwd_hash, now(),
       jsonb_build_object('full_name','Cool Tech BD','phone','+8801710000002','area','Gulshan','role','provider'),
       '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated','authenticated', now(), now()),
    (p_elec,  '00000000-0000-0000-0000-000000000000'::uuid, 'demo.rashed@example.com', pwd_hash, now(),
       jsonb_build_object('full_name','Rashed Hossain','phone','+8801710000003','area','Mirpur','role','provider'),
       '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated','authenticated', now(), now()),
    (p_paint, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.colorcraft@example.com', pwd_hash, now(),
       jsonb_build_object('full_name','Color Craft Painters','phone','+8801710000004','area','Uttara','role','provider'),
       '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated','authenticated', now(), now());

  -- ============== CUSTOMERS ==============
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at)
  VALUES
    (c_aisha, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.aisha@example.com', pwd_hash, now(),
       jsonb_build_object('full_name','Aisha Rahman','phone','+8801910000001','area','Dhanmondi'),
       '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated','authenticated', now(), now()),
    (c_rafi,  '00000000-0000-0000-0000-000000000000'::uuid, 'demo.rafi@example.com', pwd_hash, now(),
       jsonb_build_object('full_name','Rafi Ahmed','phone','+8801910000002','area','Banani'),
       '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated','authenticated', now(), now());

  -- The handle_new_user trigger has populated profiles + 'customer'/'provider' roles.
  -- Approve the providers and seed coverage.
  UPDATE public.profiles SET provider_status = 'approved'::provider_status
   WHERE id IN (p_clean, p_ac, p_elec, p_paint);

  INSERT INTO public.provider_categories (user_id, category) VALUES
    (p_clean,'home-cleaning'),
    (p_ac,   'ac-service'),
    (p_elec, 'electrician'),
    (p_paint,'painting');

  INSERT INTO public.provider_areas (user_id, area) VALUES
    (p_clean,'dhanmondi'), (p_clean,'mohammadpur'),
    (p_ac,'gulshan'), (p_ac,'banani'), (p_ac,'uttara'),
    (p_elec,'mirpur'), (p_elec,'mohammadpur'),
    (p_paint,'uttara'), (p_paint,'gulshan');

  INSERT INTO public.provider_availability (user_id, weekday, start_time, end_time, is_active)
  SELECT u, w, '09:00'::time, '18:00'::time, true
  FROM unnest(ARRAY[p_clean,p_ac,p_elec,p_paint]) u,
       generate_series(1,6) w;

  -- ============== BOOKINGS — mixed statuses ==============
  b1 := gen_random_uuid(); b2 := gen_random_uuid(); b3 := gen_random_uuid();
  b4 := gen_random_uuid(); b5 := gen_random_uuid(); b6 := gen_random_uuid();

  INSERT INTO public.bookings (id, user_id, provider_id, full_name, phone, email, category, service, area, address, preferred_date, preferred_time_slot, status, notes, created_at, updated_at)
  VALUES
    -- new lead, unassigned
    (b1, c_aisha, NULL, 'Aisha Rahman', '+8801910000001', 'demo.aisha@example.com',
       'home-cleaning','Deep Home Cleaning','dhanmondi','Road 7, House 24', current_date + 1, 'morning', 'new'::booking_status,
       'Two-bedroom apartment, kitchen + 2 baths.', now() - interval '6 hours', now() - interval '6 hours'),
    -- assigned to electrician
    (b2, c_rafi, p_elec, 'Rafi Ahmed', '+8801910000002', 'demo.rafi@example.com',
       'electrician','Switchboard Repair','mirpur','Block C, Flat 3B', current_date + 2, 'evening', 'assigned'::booking_status,
       'Three switches sparking — needs urgent fix.', now() - interval '1 day', now() - interval '12 hours'),
    -- confirmed but not yet assigned
    (b3, c_aisha, NULL, 'Aisha Rahman', '+8801910000001', 'demo.aisha@example.com',
       'ac-service','AC General Service','gulshan','Gulshan Avenue', current_date + 3, 'afternoon', 'confirmed'::booking_status,
       'Two split units, ground floor.', now() - interval '2 days', now() - interval '1 day'),
    -- completed (cleaning) — feeds operations widget
    (b4, c_rafi, p_clean, 'Rafi Ahmed', '+8801910000002', 'demo.rafi@example.com',
       'home-cleaning','Sofa Cleaning','dhanmondi','Road 11, House 8', current_date - 1, 'morning', 'completed'::booking_status,
       'L-shape sofa + 2 chairs.', now() - interval '3 days', now() - interval '1 day'),
    -- completed (paint)
    (b5, c_aisha, p_paint, 'Aisha Rahman', '+8801910000001', 'demo.aisha@example.com',
       'painting','Interior Painting','uttara','Sector 4, House 12', current_date - 4, 'morning', 'completed'::booking_status,
       'Living room + master bedroom.', now() - interval '7 days', now() - interval '4 days'),
    -- cancelled
    (b6, c_rafi, NULL, 'Rafi Ahmed', '+8801910000002', 'demo.rafi@example.com',
       'ac-service','AC Repair','banani','Road 11, House 5', current_date - 2, 'evening', 'cancelled'::booking_status,
       'Customer cancelled — booked elsewhere.', now() - interval '5 days', now() - interval '2 days');

  -- ============== CONTACT MESSAGES ==============
  INSERT INTO public.contact_messages (full_name, email, phone, message, handled, created_at)
  VALUES
    ('Tanvir Hasan', 'tanvir@example.com', '+8801711111111',
       'Do you cover the Bashundhara R/A for AC servicing this weekend?', false, now() - interval '2 hours'),
    ('Maliha Khan', 'maliha@example.com', '+8801722222222',
       'I''d like to partner with your platform for our cleaning agency.', false, now() - interval '1 day'),
    ('Junaid Karim', 'junaid@example.com', NULL,
       'Quick question about pricing for monthly maintenance contracts.', true, now() - interval '4 days');

  -- ============== PROVIDER APPLICATIONS ==============
  INSERT INTO public.provider_applications (full_name, email, phone, applicant_type, category, coverage_area, experience, team_size, availability, about, status, created_at)
  VALUES
    ('Imran Sheikh', 'imran.sheikh@example.com', '+8801733333333', 'individual',
       'plumbing', 'mohammadpur', '6 years', NULL, 'Weekdays + Saturdays',
       'Licensed plumber, residential focus, fully tooled.', 'new'::application_status, now() - interval '3 hours'),
    ('Brightway Pest Solutions', 'hello@brightway.example.com', '+8801744444444', 'agency',
       'pest-control', 'gulshan', '4 years', '8 technicians', 'All days, 8am – 9pm',
       'Govt-approved chemicals, child- and pet-safe protocols.', 'reviewing'::application_status, now() - interval '2 days');

  RAISE NOTICE 'Demo data seeded: 4 providers, 2 customers, 6 bookings, 3 contact messages, 2 applications.';
END
$seed$;
