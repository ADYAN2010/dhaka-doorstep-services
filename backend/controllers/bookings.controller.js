const { makeCrud } = require("../lib/crud-factory");

module.exports = makeCrud({
  table: "bookings",
  idType: "uuid",
  selectColumns:
    "id, customer_id, provider_id, full_name, phone, email, category, service, area, address, preferred_date, preferred_time_slot, budget_range, notes, status, created_at, updated_at",
  allowedColumns: [
    "customer_id",
    "provider_id",
    "full_name",
    "phone",
    "email",
    "category",
    "service",
    "area",
    "address",
    "preferred_date",
    "preferred_time_slot",
    "budget_range",
    "notes",
    "status",
  ],
  required: [
    "full_name",
    "phone",
    "category",
    "area",
    "preferred_date",
    "preferred_time_slot",
  ],
  defaultOrder: "created_at DESC",
  searchableColumns: ["full_name", "phone", "email", "category", "area"],
});
