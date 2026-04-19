import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(200),
});

export const listSchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional(),
  status: z.string().trim().min(1).max(40).optional(),
});

export const servicesListSchema = z.object({
  categoryId: z.string().uuid().optional(),
});

export const areasListSchema = z.object({
  cityId: z.string().uuid().optional(),
});

export const cityUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(150),
  country: z.string().trim().min(1).max(100).optional(),
  launchStatus: z.enum(["coming_soon", "beta", "live", "paused"]).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(9999).optional(),
});

export const categoryUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(150),
  commissionRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});
