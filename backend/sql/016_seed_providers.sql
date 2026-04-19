-- 016_seed_providers.sql — eight approved demo providers across categories/areas.
-- Idempotency: every INSERT uses INSERT IGNORE on a slug/composite key so re-runs
-- via the migrator (which only runs each file once) are still safe in dev.

INSERT IGNORE INTO `providers`
  (id, slug, full_name, business_name, provider_type, email, phone, primary_area, primary_category,
   avatar_url, bio, pricing_label, response_time, years_experience, jobs_completed,
   languages, gallery, is_verified, is_top_rated, status)
VALUES
  ('11111111-0000-4000-8000-000000000001', 'aisha-cleaning-co',
   'Aisha Rahman', 'Aisha Cleaning Co.', 'agency',
   'aisha@example.com', '+8801711000001', 'dhanmondi', 'home-cleaning',
   NULL,
   'Family-run agency with 8 years cleaning Dhanmondi & Gulshan apartments. Trained, ID-verified crews and eco-friendly supplies.',
   'From ৳999', 'Replies in ~15 min', 8, 1240,
   'Bangla, English',
   JSON_ARRAY(
     'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=70',
     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=70'
   ),
   1, 1, 'approved'),

  ('11111111-0000-4000-8000-000000000002', 'rahim-ac-master',
   'Rahim Hossain', 'Rahim AC Master', 'individual',
   'rahim@example.com', '+8801711000002', 'gulshan', 'ac-service',
   NULL,
   'Certified AC technician — 12 years servicing every major brand. Same-day repairs across north Dhaka.',
   'From ৳999', 'Replies in ~10 min', 12, 980,
   'Bangla, English, Hindi',
   JSON_ARRAY(
     'https://images.unsplash.com/photo-1581578017093-cd30fce4eeb7?w=800&auto=format&fit=crop&q=70'
   ),
   1, 1, 'approved'),

  ('11111111-0000-4000-8000-000000000003', 'shafiq-electric-works',
   'Shafiq Khan', 'Shafiq Electric Works', 'individual',
   'shafiq@example.com', '+8801711000003', 'mirpur', 'electrician',
   NULL,
   'Licensed electrician for residential & small-commercial wiring. From a switch fix to a full rewire.',
   'From ৳499', 'Replies in ~20 min', 10, 1560,
   'Bangla, English',
   JSON_ARRAY(
     'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=70'
   ),
   1, 0, 'approved'),

  ('11111111-0000-4000-8000-000000000004', 'priya-deep-clean',
   'Priya Akter', 'Priya Deep Clean', 'individual',
   'priya@example.com', '+8801711000004', 'banani', 'home-cleaning',
   NULL,
   'Specialist in post-renovation deep cleans. Bring your apartment back to move-in shine.',
   'From ৳1,499', 'Replies in ~25 min', 5, 410,
   'Bangla',
   NULL,
   1, 0, 'approved'),

  ('11111111-0000-4000-8000-000000000005', 'jamal-plumbing',
   'Jamal Uddin', 'Jamal Plumbing', 'individual',
   'jamal@example.com', '+8801711000005', 'mohammadpur', 'plumber',
   NULL,
   'Plumbing emergencies handled within 2 hours. Leaks, blockages, fittings — all sorted.',
   'From ৳399', 'Replies in ~30 min', 9, 870,
   'Bangla',
   NULL,
   1, 0, 'approved'),

  ('11111111-0000-4000-8000-000000000006', 'spotless-uttara',
   'Nusrat Jahan', 'Spotless Uttara', 'agency',
   'nusrat@example.com', '+8801711000006', 'uttara', 'home-cleaning',
   NULL,
   'Sector-specialist cleaning crews across Uttara 1–18. Weekly subscriptions available.',
   'From ৳1,299', 'Replies in ~12 min', 6, 720,
   'Bangla, English',
   JSON_ARRAY(
     'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=70'
   ),
   1, 1, 'approved'),

  ('11111111-0000-4000-8000-000000000007', 'cool-air-bashundhara',
   'Tariq Aziz', 'Cool Air Bashundhara', 'agency',
   'tariq@example.com', '+8801711000007', 'bashundhara', 'ac-service',
   NULL,
   'Inverter AC service & installations across Bashundhara R/A. Genuine spares only.',
   'From ৳1,199', 'Replies in ~18 min', 7, 540,
   'Bangla, English',
   NULL,
   1, 0, 'approved'),

  ('11111111-0000-4000-8000-000000000008', 'green-thumb-pest',
   'Mehedi Hasan', 'Green Thumb Pest Control', 'agency',
   'mehedi@example.com', '+8801711000008', 'farmgate', 'pest-control',
   NULL,
   'Government-licensed pest control — cockroach, termite, rodent. Family-safe odourless treatments.',
   'From ৳1,499', 'Replies in ~22 min', 11, 1100,
   'Bangla, English',
   NULL,
   1, 1, 'approved');

-- Categories
INSERT IGNORE INTO `provider_category_links` (id, provider_id, category_slug) VALUES
  (UUID(), '11111111-0000-4000-8000-000000000001', 'home-cleaning'),
  (UUID(), '11111111-0000-4000-8000-000000000002', 'ac-service'),
  (UUID(), '11111111-0000-4000-8000-000000000003', 'electrician'),
  (UUID(), '11111111-0000-4000-8000-000000000004', 'home-cleaning'),
  (UUID(), '11111111-0000-4000-8000-000000000005', 'plumber'),
  (UUID(), '11111111-0000-4000-8000-000000000006', 'home-cleaning'),
  (UUID(), '11111111-0000-4000-8000-000000000007', 'ac-service'),
  (UUID(), '11111111-0000-4000-8000-000000000008', 'pest-control');

-- Areas (each provider covers 2-3 nearby areas)
INSERT IGNORE INTO `provider_area_links` (id, provider_id, area_slug) VALUES
  (UUID(), '11111111-0000-4000-8000-000000000001', 'dhanmondi'),
  (UUID(), '11111111-0000-4000-8000-000000000001', 'mohammadpur'),
  (UUID(), '11111111-0000-4000-8000-000000000001', 'gulshan'),

  (UUID(), '11111111-0000-4000-8000-000000000002', 'gulshan'),
  (UUID(), '11111111-0000-4000-8000-000000000002', 'banani'),
  (UUID(), '11111111-0000-4000-8000-000000000002', 'badda'),

  (UUID(), '11111111-0000-4000-8000-000000000003', 'mirpur'),
  (UUID(), '11111111-0000-4000-8000-000000000003', 'mohammadpur'),

  (UUID(), '11111111-0000-4000-8000-000000000004', 'banani'),
  (UUID(), '11111111-0000-4000-8000-000000000004', 'gulshan'),

  (UUID(), '11111111-0000-4000-8000-000000000005', 'mohammadpur'),
  (UUID(), '11111111-0000-4000-8000-000000000005', 'dhanmondi'),
  (UUID(), '11111111-0000-4000-8000-000000000005', 'old-dhaka'),

  (UUID(), '11111111-0000-4000-8000-000000000006', 'uttara'),

  (UUID(), '11111111-0000-4000-8000-000000000007', 'bashundhara'),
  (UUID(), '11111111-0000-4000-8000-000000000007', 'badda'),

  (UUID(), '11111111-0000-4000-8000-000000000008', 'farmgate'),
  (UUID(), '11111111-0000-4000-8000-000000000008', 'motijheel'),
  (UUID(), '11111111-0000-4000-8000-000000000008', 'mirpur');

-- Default availability: Mon–Sat 09:00–18:00, Sunday closed.
INSERT IGNORE INTO `provider_availability` (id, provider_id, weekday, start_time, end_time, is_active)
SELECT UUID(), p.id, d.weekday, '09:00:00', '18:00:00', 1
FROM `providers` p
CROSS JOIN (
  SELECT 1 AS weekday UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) d
WHERE p.id LIKE '11111111-0000-4000-8000-%';
