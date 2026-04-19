import { createServerFn } from "@tanstack/react-start";
import { adminsRepo } from "@/server/repositories/admins";
import { customersRepo } from "@/server/repositories/customers";
import { providersRepo } from "@/server/repositories/providers";
import { bookingsRepo } from "@/server/repositories/bookings";
import { categoriesRepo, servicesRepo } from "@/server/repositories/services";
import { locationsRepo } from "@/server/repositories/locations";
import { reviewsRepo } from "@/server/repositories/reviews";
import { ticketsRepo } from "@/server/repositories/tickets";
import { getAdminSession, getAdminUser, requireAdmin } from "@/server/session";
import {
  adminLoginSchema,
  areasListSchema,
  categoryUpsertSchema,
  cityUpsertSchema,
  listSchema,
  servicesListSchema,
} from "@/server/validation";
import { BridgeException } from "@/server/bridge";

function toClientError(e: unknown): never {
  if (e instanceof BridgeException) {
    throw new Error(`[${e.code}] ${e.message}`);
  }
  if (e instanceof Error) throw e;
  throw new Error("Unknown server error");
}

// ---------- auth ----------
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => adminLoginSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const user = await adminsRepo.login(data.email, data.password);
      const session = await getAdminSession();
      await session.update({ user });
      return { user };
    } catch (e) {
      toClientError(e);
    }
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAdminSession();
  await session.clear();
  return { ok: true };
});

export const getCurrentAdmin = createServerFn({ method: "GET" }).handler(async () => {
  return { user: await getAdminUser() };
});

// ---------- dashboard ----------
export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    return await adminsRepo.dashboardStats();
  } catch (e) {
    toClientError(e);
  }
});

// ---------- list endpoints ----------
export const listCustomers = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await customersRepo.list(data);
    } catch (e) {
      toClientError(e);
    }
  });

export const listProviders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await providersRepo.list(data);
    } catch (e) {
      toClientError(e);
    }
  });

export const listBookings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await bookingsRepo.list(data);
    } catch (e) {
      toClientError(e);
    }
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    return await categoriesRepo.list();
  } catch (e) {
    toClientError(e);
  }
});

export const listServices = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => servicesListSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await servicesRepo.list(data);
    } catch (e) {
      toClientError(e);
    }
  });

export const listCities = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    return await locationsRepo.cities();
  } catch (e) {
    toClientError(e);
  }
});

export const listAreas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => areasListSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await locationsRepo.areas(data);
    } catch (e) {
      toClientError(e);
    }
  });

export const listReviews = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await reviewsRepo.list(data);
    } catch (e) {
      toClientError(e);
    }
  });

export const listTickets = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await ticketsRepo.list(data);
    } catch (e) {
      toClientError(e);
    }
  });

// ---------- basic upserts ----------
export const upsertCity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => cityUpsertSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await locationsRepo.upsertCity(data);
    } catch (e) {
      toClientError(e);
    }
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => categoryUpsertSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      return await categoriesRepo.upsert(data);
    } catch (e) {
      toClientError(e);
    }
  });
