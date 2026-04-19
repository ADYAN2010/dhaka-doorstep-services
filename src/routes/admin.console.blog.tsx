import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminBlogAndMessages } from "@/components/admin-blog-and-messages";

export const Route = createFileRoute("/admin/console/blog")({
  component: BlogPage,
});

function BlogPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Website"
        title="Blog & messages"
        description="Publish articles and respond to inbound contact form messages."
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: "Website" }, { label: "Blog" }]}
      />
      <AdminBlogAndMessages />
    </div>
  );
}
