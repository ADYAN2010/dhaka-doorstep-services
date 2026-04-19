const { makeCrud } = require("../lib/crud-factory");

module.exports = makeCrud({
  table: "categories",
  idType: "uuid",
  selectColumns:
    "id, slug, name, commission_rate, is_active, display_order, created_at, updated_at",
  allowedColumns: ["slug", "name", "commission_rate", "is_active", "display_order"],
  required: ["slug", "name"],
  defaultOrder: "display_order ASC, name ASC",
  searchableColumns: ["slug", "name"],
});
