/**
 * Mount all feature routers here. Add new modules in one place.
 *   /api/health      -> health
 *   /api/test-db     -> health
 *   /api/services    -> sample CRUD module
 */
const router = require("express").Router();

router.use("/", require("./health.routes"));
router.use("/services", require("./services.routes"));

// Future modules:
// router.use("/customers", require("./customers.routes"));
// router.use("/providers", require("./providers.routes"));
// router.use("/bookings",  require("./bookings.routes"));

module.exports = router;
