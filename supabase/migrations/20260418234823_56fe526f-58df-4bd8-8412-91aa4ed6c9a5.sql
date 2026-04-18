-- Seed default admin account for development.
-- Creates the auth user (email-confirmed) with a flag to force password change on first login,
-- assigns admin + customer roles, and ensures a profile row exists.
DO $$
DECLARE
  admin_email text := 'husam.bisc2021@gmail.com';
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt('admin@test', gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', 'Shebabd Admin', 'must_change_password', true),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', admin_email, 'email_verified', true),
      'email', admin_id::text, now(), now(), now()
    );
  ELSE
    -- Ensure must_change_password flag is set if password was never rotated.
    UPDATE auth.users
       SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('must_change_password', true)
     WHERE id = admin_id
       AND COALESCE((raw_user_meta_data->>'must_change_password')::boolean, false) IS NOT TRUE
       AND raw_user_meta_data->>'password_rotated_at' IS NULL;
  END IF;

  -- Ensure profile exists (handle_new_user trigger should have done this, but be safe).
  INSERT INTO public.profiles (id, full_name, provider_status)
  VALUES (admin_id, 'Shebabd Admin', 'not_applicable')
  ON CONFLICT (id) DO NOTHING;

  -- Ensure customer + admin roles.
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'customer') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin') ON CONFLICT DO NOTHING;
END $$;