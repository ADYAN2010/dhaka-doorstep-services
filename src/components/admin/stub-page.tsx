import type { LucideIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ComingSoonBadge } from "@/components/admin/primitives";

export function StubPage({
  eyebrow,
  title,
  description,
  icon,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  cta?: string;
}) {
  return (
    <div>
      <AdminPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={[{ label: "Admin", to: "/admin/console" }, { label: eyebrow }, { label: title }]}
        meta={<ComingSoonBadge />}
      />
      <EmptyState
        icon={icon}
        title={`${title} workspace`}
        description={cta ?? "This module's data layer and forms are scaffolded — UI rolls out in the next pass."}
      />
    </div>
  );
}
