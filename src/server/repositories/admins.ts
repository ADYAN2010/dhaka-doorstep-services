import { bridgeCall } from "../bridge";
import type { AdminUser, DashboardStats } from "../types";

export const adminsRepo = {
  login: (email: string, password: string) =>
    bridgeCall<AdminUser>("admin.login", { email, password }),

  dashboardStats: () => bridgeCall<DashboardStats>("dashboard.stats", {}),
};
