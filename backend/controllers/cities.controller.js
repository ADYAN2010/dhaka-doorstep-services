const { makeCrud } = require("../lib/crud-factory");

module.exports = makeCrud({
  table: "cities",
  idType: "uuid",
  selectColumns:
    "id, slug, name, country, launch_status, is_active, display_order, launched_at, created_at, updated_at",
  allowedColumns: [
    "slug",
    "name",
    "country",
    "launch_status",
    "is_active",
    "display_order",
    "launched_at",
  ],
  required: ["slug", "name"],
  defaultOrder: "display_order ASC, name ASC",
  searchableColumns: ["slug", "name", "country"],
});
