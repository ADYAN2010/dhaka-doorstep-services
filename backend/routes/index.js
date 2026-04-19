/**
 * Mount all feature routers here. Add new modules in one place.
 *   /api/health      -> health
 *   /api/test-db     -> health
 *   /api/services    -> services CRUD
 *   /api/customers   -> customers CRUD
 *   /api/providers   -> providers CRUD
 *   /api/categories  -> categories CRUD
 *   /api/cities      -> cities CRUD
 *   /api/bookings    -> bookings CRUD
 */
const router = require("express").Router();

router.use("/", require("./health.routes"));
router.use("/services", require("./services.routes"));
router.use("/customers", require("./customers.routes"));
router.use("/providers", require("./providers.routes"));
router.use("/categories", require("./categories.routes"));
router.use("/cities", require("./cities.routes"));
router.use("/bookings", require("./bookings.routes"));

module.exports = router;
