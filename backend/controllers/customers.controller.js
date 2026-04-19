const { makeCrud } = require("../lib/crud-factory");

module.exports = makeCrud({
  table: "customers",
  idType: "uuid",
  selectColumns:
    "id, full_name, email, phone, area, is_active, created_at, updated_at",
  allowedColumns: ["full_name", "email", "phone", "area", "is_active"],
  required: ["full_name"],
  defaultOrder: "created_at DESC",
  searchableColumns: ["full_name", "email", "phone", "area"],
});
