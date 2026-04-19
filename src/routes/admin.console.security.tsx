import { createFileRoute } from "@tanstack/react-router";
import { Shield, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityOverview } from "@/components/security/security-overview";
import { PermissionMatrix } from "@/components/security/permission-matrix";
import { RoleSummary } from "@/components/security/role-summary";
import { AdminList } from "@/components/security/admin-list";
import { AuditLog } from "@/components/security/audit-log";
import { ActivityTimeline } from "@/components/security/activity-timeline";
import { SessionsPanel } from "@/components/security/sessions-panel";
import { RestrictionsPanel } from "@/components/security/restrictions-panel";
import { ProtectedScreens } from "@/components/security/protected-screens";
import { securityService } from "@/services/security";

export const Route = createFileRoute("/admin/console/security")({
  component: SecurityPage,
  head: () => ({
    meta: [{ title: "Security & permissions · Admin console" }],
  }),
});

function SecurityPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Security center"
        title="Security & permissions"
        description="Roles, audit history, sessions and account restrictions across the platform."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                securityService.resetRoles();
                toast.success("Role permissions restored to defaults");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset roles
            </Button>
            <Button size="sm" onClick={() => toast.success("Security policy saved")}>
              <Save className="h-3.5 w-3.5" /> Save policy
            </Button>
          </>
        }
      />

      <SecurityOverview />

      <div className="mt-5">
        <Tabs defaultValue="permissions">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto">
            <TabsTrigger value="permissions">
              <Shield className="h-3.5 w-3.5" /> Permissions
            </TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            <TabsTrigger value="protected">Protected screens</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-5">
            <PermissionMatrix />
            <RoleSummary />
          </TabsContent>

          <TabsContent value="admins" className="space-y-5">
            <AdminList />
            <ActivityTimeline limit={8} />
          </TabsContent>

          <TabsContent value="audit" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                <AuditLog />
              </div>
              <ActivityTimeline limit={10} />
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-5">
            <SessionsPanel />
          </TabsContent>

          <TabsContent value="restrictions" className="space-y-5">
            <RestrictionsPanel />
          </TabsContent>

          <TabsContent value="protected" className="space-y-5">
            <ProtectedScreens />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
