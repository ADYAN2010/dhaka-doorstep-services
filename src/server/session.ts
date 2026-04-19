import { useSession } from "@tanstack/react-start/server";
import type { AdminUser } from "./types";

export type AdminSessionData = {
  user?: AdminUser;
};

const COOKIE_NAME = "shebabd_admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function sessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set to a strong random string (>= 32 chars).",
    );
  }
  return {
    password,
    name: COOKIE_NAME,
    maxAge: MAX_AGE,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getAdminSession() {
  return useSession<AdminSessionData>(sessionConfig());
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const s = await getAdminSession();
  return s.data.user ?? null;
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) {
    throw new Error("Unauthorized: admin session required.");
  }
  return user;
}
