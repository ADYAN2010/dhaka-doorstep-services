
-- Remove Men's Haircut at Home
UPDATE public.services SET is_featured = false, display_order = 0 WHERE slug = 'men-s-haircut-at-home';

-- Add Bridal Makeup at Home into slot 12
UPDATE public.services SET is_featured = true, display_order = 12 WHERE slug = 'bridal-makeup-at-home';

-- Reorder: AC Basic Servicing -> 1, others shifted
UPDATE public.services SET display_order = 1 WHERE slug = 'ac-basic-servicing';
UPDATE public.services SET display_order = 2 WHERE slug = 'regular-home-cleaning';
UPDATE public.services SET display_order = 3 WHERE slug = 'deep-home-cleaning';
