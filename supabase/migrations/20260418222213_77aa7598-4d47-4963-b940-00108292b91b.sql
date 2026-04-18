-- ============================================================
-- Seed default admin user for initial development
-- Email: husam.bisc2021@gmail.com / Password: admin@test
-- ============================================================

-- Use a one-shot SECURITY DEFINER function so we can write to the auth schema
-- (the regular migration role doesn't own auth.users). Dropped at the end.

CREATE OR REPLACE FUNCTION public._seed_default_admin()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- If the user already exists, just make sure they're admin and return.
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'husam.bisc2021@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'husam.bisc2021@gmail.com',
      extensions.crypt('admin@test', extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', 'Default Admin', 'must_change_password', true),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Identity row is required for password sign-in to work.
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'husam.bisc2021@gmail.com', 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  -- Profile row (handle_new_user trigger usually does this on sign-up; we
  -- inserted directly into auth.users so we must mirror it here).
  INSERT INTO public.profiles (id, full_name, provider_status)
  VALUES (v_user_id, 'Default Admin', 'not_applicable')
  ON CONFLICT (id) DO NOTHING;

  -- Roles: customer + admin.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'customer')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN v_user_id;
END;
$$;

-- Run it once.
SELECT public._seed_default_admin();

-- Clean up: this function should not exist permanently.
DROP FUNCTION public._seed_default_admin();