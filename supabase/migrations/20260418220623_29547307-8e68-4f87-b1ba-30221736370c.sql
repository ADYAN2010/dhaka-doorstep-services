-- Atomic approve: flip provider_status to 'approved' AND seed categories/areas from the application.
CREATE OR REPLACE FUNCTION public.admin_approve_application(_application_id uuid)
RETURNS public.provider_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app public.provider_applications;
  updated public.provider_applications;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve applications';
  END IF;

  SELECT * INTO app FROM public.provider_applications WHERE id = _application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF app.user_id IS NULL THEN
    RAISE EXCEPTION 'Application is not linked to a user account; ask the applicant to sign up and resubmit.';
  END IF;

  -- Mark the application approved.
  UPDATE public.provider_applications
     SET status = 'approved'::application_status, updated_at = now()
   WHERE id = _application_id
   RETURNING * INTO updated;

  -- Ensure they have the provider role.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (app.user_id, 'provider'::app_role)
  ON CONFLICT DO NOTHING;

  -- Approve the profile.
  UPDATE public.profiles
     SET provider_status = 'approved'::provider_status, updated_at = now()
   WHERE id = app.user_id;

  -- Seed coverage so they can immediately accept leads.
  INSERT INTO public.provider_categories (user_id, category)
  VALUES (app.user_id, app.category)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.provider_areas (user_id, area)
  VALUES (app.user_id, app.coverage_area)
  ON CONFLICT DO NOTHING;

  RETURN updated;
END;
$$;