/**
 * Stubbed during the MySQL migration. The article editor used the
 * Supabase `blog_posts` table; the MySQL backend already exposes a blog
 * controller, but the admin editor UI will be rebuilt against it later.
 */
type Props = {
  open?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
};

export function ArticleEditor(_props: Props) {
  return null;
}
