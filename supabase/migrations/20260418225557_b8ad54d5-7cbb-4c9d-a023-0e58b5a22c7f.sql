-- ============================================================
-- 1. Tables
-- ============================================================
CREATE TABLE public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  customer_unread_count integer NOT NULL DEFAULT 0,
  provider_unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_threads_customer ON public.message_threads (customer_id, last_message_at DESC);
CREATE INDEX idx_threads_provider ON public.message_threads (provider_id, last_message_at DESC);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  image_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_has_content CHECK (
    (body IS NOT NULL AND length(trim(body)) > 0) OR image_url IS NOT NULL
  )
);

CREATE INDEX idx_messages_thread ON public.messages (thread_id, created_at);

-- ============================================================
-- 2. Helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_thread_participant(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.message_threads
    WHERE id = _thread_id
      AND (customer_id = _user_id OR provider_id = _user_id)
  );
$$;

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Threads: participants and admins can read
CREATE POLICY "Participants can view their threads"
ON public.message_threads
FOR SELECT
TO authenticated
USING (customer_id = auth.uid() OR provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Threads: participants can update (used by mark_thread_read via SECURITY DEFINER, but allow direct too)
CREATE POLICY "Participants can update their threads"
ON public.message_threads
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid() OR provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (customer_id = auth.uid() OR provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Threads: only the RPC creates rows; no direct INSERT/DELETE.

-- Messages: participants and admins can read
CREATE POLICY "Participants can read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.is_thread_participant(thread_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Messages: participants can post as themselves
CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_thread_participant(thread_id, auth.uid())
);

-- No UPDATE / DELETE policies => append-only.

-- ============================================================
-- 4. Trigger: bump last_message_at + unread counter for other side
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.message_threads;
BEGIN
  SELECT * INTO t FROM public.message_threads WHERE id = NEW.thread_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id = t.customer_id THEN
    UPDATE public.message_threads
    SET last_message_at = NEW.created_at,
        provider_unread_count = provider_unread_count + 1,
        updated_at = now()
    WHERE id = NEW.thread_id;
  ELSIF NEW.sender_id = t.provider_id THEN
    UPDATE public.message_threads
    SET last_message_at = NEW.created_at,
        customer_unread_count = customer_unread_count + 1,
        updated_at = now()
    WHERE id = NEW.thread_id;
  ELSE
    -- Admin posting; just bump timestamp.
    UPDATE public.message_threads
    SET last_message_at = NEW.created_at, updated_at = now()
    WHERE id = NEW.thread_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message();

-- updated_at trigger for threads
CREATE TRIGGER message_threads_set_updated_at
BEFORE UPDATE ON public.message_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. RPC: get or create thread for a booking
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_or_create_thread(_booking_id uuid)
RETURNS public.message_threads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.bookings;
  t public.message_threads;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF b.provider_id IS NULL THEN
    RAISE EXCEPTION 'No provider has been assigned to this booking yet';
  END IF;

  IF b.status NOT IN ('assigned'::booking_status, 'completed'::booking_status) THEN
    RAISE EXCEPTION 'Chat is only available for assigned or completed bookings';
  END IF;

  IF b.user_id IS NULL THEN
    RAISE EXCEPTION 'Booking has no customer account; chat unavailable';
  END IF;

  IF uid <> b.user_id AND uid <> b.provider_id AND NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT * INTO t FROM public.message_threads WHERE booking_id = _booking_id;
  IF FOUND THEN
    RETURN t;
  END IF;

  INSERT INTO public.message_threads (booking_id, customer_id, provider_id)
  VALUES (_booking_id, b.user_id, b.provider_id)
  RETURNING * INTO t;

  RETURN t;
END;
$$;

-- ============================================================
-- 6. RPC: mark thread read for the calling user
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_thread_read(_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  t public.message_threads;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO t FROM public.message_threads WHERE id = _thread_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Thread not found';
  END IF;

  IF uid = t.customer_id THEN
    UPDATE public.message_threads
    SET customer_unread_count = 0, updated_at = now()
    WHERE id = _thread_id;

    UPDATE public.messages
    SET read_at = now()
    WHERE thread_id = _thread_id
      AND sender_id = t.provider_id
      AND read_at IS NULL;
  ELSIF uid = t.provider_id THEN
    UPDATE public.message_threads
    SET provider_unread_count = 0, updated_at = now()
    WHERE id = _thread_id;

    UPDATE public.messages
    SET read_at = now()
    WHERE thread_id = _thread_id
      AND sender_id = t.customer_id
      AND read_at IS NULL;
  END IF;
END;
$$;

-- ============================================================
-- 7. Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;

-- ============================================================
-- 8. Storage bucket for image attachments
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Public read so that <img src=public_url> works
CREATE POLICY "Chat attachments are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-attachments');

-- Authenticated users can upload into a folder named after their user id
CREATE POLICY "Users can upload chat attachments to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
