DROP VIEW IF EXISTS public.provider_review_stats;

CREATE VIEW public.provider_review_stats
WITH (security_invoker = true)
AS
SELECT
  provider_id,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*)::int AS review_count
FROM public.reviews
GROUP BY provider_id;