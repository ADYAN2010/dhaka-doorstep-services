import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminBlogAndMessages } from "@/components/admin-blog-and-messages";

export const Route = createFileRoute("/admin/console/content")({
  component: ContentPage,
});

function ContentPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Blog & messages"
        description="Publish blog posts and respond to inbound contact form messages."
      />
      <AdminBlogAndMessages />
    </div>
  );
}
