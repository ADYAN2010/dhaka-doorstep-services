-- ============================================================
-- Blog CMS + Contact messages
-- ============================================================

-- ---------- BLOG POSTS ----------
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL,
  body text NOT NULL,
  cover_image_url text,
  tag text NOT NULL DEFAULT 'Insights',
  read_minutes integer NOT NULL DEFAULT 4,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_published ON public.blog_posts (published, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts (slug);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read only published posts.
CREATE POLICY "Published posts are publicly readable"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Admins can read all posts (incl. drafts).
CREATE POLICY "Admins can read all posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins manage posts.
CREATE POLICY "Admins can insert posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts"
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- SEED 4 REALISTIC POSTS ----------
INSERT INTO public.blog_posts (slug, title, excerpt, body, tag, read_minutes, published, published_at) VALUES
('ac-care-bd',
 'How to make your AC last 10 years in Dhaka heat',
 'Five maintenance habits that double the life of any AC unit in Bangladesh''s climate.',
 E'Dhaka''s mix of dust, humidity, and 14-hour daily run-time during summer is brutal on air conditioners. The average split-AC in Dhaka is replaced after 5–6 years — half its design life. Here are the five habits that consistently push that to 10+ years.\n\n## 1. Clean filters every 30 days, not every season\n\nDust load in Dhaka is roughly 4× higher than the WHO guideline. A clogged filter forces the compressor to work harder, raising your bill by 15–25% and shortening compressor life. Pull the front panel, slide out the mesh filters, rinse under tap water, dry fully, and reinstall. Five-minute job.\n\n## 2. Get the outdoor unit serviced before April\n\nThe condenser coil outside is what releases heat. After winter, it''s caked with dust and pigeon feathers. A pre-summer professional service (₹800–1,500 per unit in Dhaka) restores efficiency completely. Skipping this single service is the #1 reason ACs fail by year 6.\n\n## 3. Run the AC at 24°C, not 18°C\n\nEvery degree below 24°C raises power draw by ~6%. Setting it to 18°C does not cool the room faster — it just makes the compressor cycle longer at full load. 24°C with the fan on medium is the efficiency sweet spot.\n\n## 4. Stabilize your voltage\n\nDhaka''s voltage swings between 180V and 250V. ACs are rated for 220V ±10%. Anything outside that range kills the compressor over time. A ₹4,000 voltage stabilizer pays for itself the first time it prevents a compressor failure (which costs ₹18,000–25,000 to replace).\n\n## 5. Don''t cycle it on and off\n\nTurning the AC off when you leave the room and back on when you return is worse than leaving it running. Compressor start-up draws 5× normal power and is the most stressful moment for the unit. If you''re leaving for less than an hour, leave it on.\n\n---\n\nFollow these five habits and the AC you bought today will still be cooling in 2036.',
 'Home Tips', 5, true, now() - interval '6 days'),

('choosing-electrician',
 'How to pick a trustworthy electrician in Dhaka',
 'Five red flags to watch out for, and how Shebabd''s verification process catches them.',
 E'Bad electrical work is dangerous in a way that bad paint or bad cleaning is not. A loose neutral can burn down your apartment. Here''s how to filter out unsafe electricians before you hire one.\n\n## Red flag 1: No multimeter\n\nA professional electrician carries a multimeter as basic as a cook carries a knife. If the person at your door doesn''t own one, they''re a wire-puller, not an electrician. Politely send them away.\n\n## Red flag 2: They quote without inspecting\n\n"Ceiling fan installation, ৳500" — quoted over the phone before they''ve seen your wiring, your switchboard, or your fan box. Real electricians inspect first. Round numbers quoted sight-unseen are a sign you''ll be hit with "extras" later.\n\n## Red flag 3: No earth wire conversation\n\nIn most older Dhaka apartments, the earth wire is either missing, broken, or wired to the neutral (which is illegal and lethal). A trustworthy electrician will check earth continuity before touching anything else. If they don''t mention earth, they don''t understand safety.\n\n## Red flag 4: Refuses to give a written invoice\n\nNo invoice means no warranty, no accountability, and (legally) no proof the work was even done. Walk away.\n\n## Red flag 5: Recommends "saving money" by using under-rated wire\n\n1.5mm wire for a 16A AC circuit is asking for a fire. A real professional refuses to under-spec wire even if you ask. If your electrician is willing to cut corners on copper, they''re willing to cut corners everywhere else.\n\n## How Shebabd verifies\n\nEvery electrician on Shebabd passes:\n\n- NID + address verification\n- A skills test administered by a licensed BUET-trained engineer\n- A background check against fraud lists\n- A 3-month probation where every job is QA''d in person\n\nWe reject ~60% of electrician applicants. The 40% who pass are the ones we trust in our own homes.',
 'Trust & Safety', 4, true, now() - interval '14 days'),

('deep-cleaning-checklist',
 'The 30-point deep home cleaning checklist',
 'Exactly what should be covered in a professional apartment deep clean — print it and check it during your booking.',
 E'A "deep clean" is not just a longer regular clean. It''s a different category of work. Here is the exact checklist Shebabd''s cleaning teams follow on every deep-clean booking. Print it and tick items off as they''re completed.\n\n## Kitchen (10 points)\n\n1. Inside of refrigerator (shelves removed, washed, dried)\n2. Behind and underneath refrigerator\n3. Inside microwave (top, bottom, sides, turntable)\n4. Inside oven (if applicable)\n5. Stovetop including burner caps and grates\n6. Range hood filter (degreased)\n7. Inside cabinets (top shelf, where dust collects)\n8. Tile grout in cooking area (deep scrub)\n9. Sink including drain trap\n10. Garbage area scrubbed and disinfected\n\n## Bathrooms (8 points per bathroom)\n\n1. Toilet: bowl, base, behind tank, lid hinges\n2. Shower: tile grout, glass doors, drain\n3. Bath fittings descaled (taps, showerhead)\n4. Mirrors and any glass surfaces\n5. Exhaust fan dust removed\n6. Floor scrubbed including under door\n7. Inside of cabinets and drawers\n8. Trash bin scrubbed and disinfected\n\n## Living areas & bedrooms (8 points)\n\n1. Ceiling fan blades (top and bottom of each blade)\n2. Tube light fixtures and shades\n3. AC outdoor grille and louvers (not internal — separate AC service)\n4. All switches and switchboards wiped\n5. Behind and under sofa cushions\n6. Skirting boards / baseboards entire perimeter\n7. Window grilles, frames, and tracks\n8. Curtains taken down for separate wash (or steamed in place)\n\n## Floors & finishing (4 points)\n\n1. All floors swept, mopped, and disinfected (including under furniture)\n2. Door tops (where you''d never reach)\n3. Switchboard covers wiped\n4. Final walk-through with you\n\n---\n\nIf any of these items aren''t covered, it''s not a deep clean — it''s a slightly-longer regular clean. Use this checklist as your acceptance criteria.',
 'Home Tips', 6, true, now() - interval '21 days'),

('provider-story-cool-tech',
 'Provider story: How Cool Tech BD scaled from 1 to 24 technicians',
 'An honest look at building a service business in Dhaka with platform support — what worked, what didn''t, and what they''d do differently.',
 E'Md. Rashedul Karim started Cool Tech BD in 2021 with one bag of tools and a borrowed motorcycle. Today his team handles 400+ AC service calls a month across Dhaka. We sat down with him to ask: what actually made this growth possible?\n\n## "I was good at AC. I was bad at everything else."\n\n"Marketing, billing, customer chat, scheduling — I had no idea. I would do a great job, then forget to send the invoice. Customers would forget to pay. I''d call to remind them and feel like a beggar. It was killing the business."\n\n## The first technician hire\n\n"I waited too long. I was doing 80 jobs a month myself, no rest. When I finally hired Salim — my first technician — I had to spend two weeks training him exactly the way I work. After that, suddenly I had time to think about the business instead of just running between jobs."\n\n"My advice to any provider: hire your second person before you''re drowning. Hire when you''re at 70% capacity, not 110%."\n\n## What the platform changed\n\n"Three things changed everything when we joined Shebabd:\n\n**1. Verified leads.** Before, half my phone calls were people who weren''t serious. Now every booking is a real customer who has confirmed time and address. My team doesn''t waste a single trip.\n\n**2. Payments handled.** I used to chase money for a week after every job. Now the customer pays through the platform and the money lands in my bKash on Friday. I sleep better.\n\n**3. Reviews build trust faster than I ever could.** A new technician on my team gets 30 5-star reviews in his first month. Before, it would take a year to build that reputation by word of mouth."\n\n## What I''d do differently\n\n"Honestly? I''d join a platform earlier. I lost two years trying to do everything alone. The platform takes a cut, yes — but the volume and the time saved is worth 10× what they take."\n\n## What''s next\n\n"By end of 2026, 50 technicians and a real warehouse for spare parts. We''re hiring six more this quarter. If you''re reading this and you''re a good AC technician — apply. We pay weekly, we provide tools, we treat people right."',
 'Provider Stories', 7, true, now() - interval '28 days');

-- ---------- CONTACT MESSAGES ----------
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text NOT NULL,
  message text NOT NULL,
  user_id uuid,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_messages_handled_created ON public.contact_messages (handled, created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message (auth optional).
CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Admins read & manage all messages.
CREATE POLICY "Admins can read all contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();