-- One-time bootstrap: any signed-in user can claim admin if no admin exists yet.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  has_any_admin boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_any_admin;
  IF has_any_admin THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- Approve / reject helpers (admin-only, enforced inside the function)
CREATE OR REPLACE FUNCTION public.set_provider_status(
  _user_id uuid,
  _status public.provider_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change provider status';
  END IF;

  UPDATE public.profiles
  SET provider_status = _status, updated_at = now()
  WHERE id = _user_id;
END;
$$;