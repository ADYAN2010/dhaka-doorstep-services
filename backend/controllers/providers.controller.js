const { makeCrud } = require("../lib/crud-factory");

module.exports = makeCrud({
  table: "providers",
  idType: "uuid",
  selectColumns:
    "id, full_name, email, phone, primary_area, primary_category, status, rating, review_count, created_at, updated_at",
  allowedColumns: [
    "full_name",
    "email",
    "phone",
    "primary_area",
    "primary_category",
    "status",
    "rating",
    "review_count",
  ],
  required: ["full_name"],
  defaultOrder: "created_at DESC",
  searchableColumns: ["full_name", "email", "phone", "primary_area", "primary_category"],
});
