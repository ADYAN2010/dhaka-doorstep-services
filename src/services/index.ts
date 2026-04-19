/**
 * Public service barrel — the UI imports from here.
 *
 *   import { providersService, bookingsService } from "@/services";
 *
 * Each named service exposes `list / get / create / …` async methods that
 * return domain types from `src/domain/types.ts`. See `src/services/README.md`.
 */

export { categoriesService } from "./categories";
export { locationsService } from "./locations";
export { providersService } from "./providers";
export { bookingsService } from "./bookings";
export { reviewsService } from "./reviews";
export {
  paymentsService,
  invoicesService,
  payoutsService,
  commissionLedgerService,
} from "./payments";
export { usersService } from "./users";
export { notificationsService } from "./notifications";
export { ticketsService } from "./tickets";

export type * from "@/domain/types";
