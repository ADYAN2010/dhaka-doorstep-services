const { makeCrud } = require("../lib/crud-factory");

module.exports = makeCrud({
  table: "areas",
  idType: "uuid",
  selectColumns:
    "id, city_id, slug, name, is_active, display_order, created_at, updated_at",
  allowedColumns: ["city_id", "slug", "name", "is_active", "display_order"],
  required: ["city_id", "slug", "name"],
  defaultOrder: "display_order ASC, name ASC",
  searchableColumns: ["slug", "name"],
});
