-- The bucket stays public so URLs work in <img>, but we drop the broad SELECT
-- policy on storage.objects to prevent listing the bucket's contents.
DROP POLICY IF EXISTS "Chat attachments are publicly readable" ON storage.objects;
