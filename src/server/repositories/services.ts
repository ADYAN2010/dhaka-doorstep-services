import { bridgeCall } from "../bridge";
import type { CategoryRow, ServiceRow } from "../types";

export const categoriesRepo = {
  list: () => bridgeCall<CategoryRow[]>("categories.list", {}),
  upsert: (input: {
    id?: string;
    slug: string;
    name: string;
    commissionRate?: number;
    isActive?: boolean;
  }) => bridgeCall<{ id: string }>("categories.upsert", input),
};

export const servicesRepo = {
  list: (input: { categoryId?: string } = {}) =>
    bridgeCall<ServiceRow[]>("services.list", input),
};
