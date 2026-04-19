/**
 * Mount all feature routers here.
 *
 *   /api/health             → liveness
 *   /api/test-db            → db ping
 *   /api/auth/*             → admin login, me, bootstrap, change-password
 *   /api/customer-auth/*    → end-customer signup, login, me, password reset
 *   /api/admin/*            → dashboard-stats, system-status (auth required)
 *   /api/admin-users        → CRUD (superadmin only)
 *   /api/uploads            → POST file uploads (any auth user)
 *   /api/locations/*        → public dropdown helpers
 *   /api/services           → CRUD (writes auth-protected)
 *   /api/customers          → CRUD
 *   /api/providers          → CRUD
 *   /api/categories         → CRUD
 *   /api/cities             → CRUD
 *   /api/areas              → CRUD
 *   /api/bookings           → CRUD
 */
const router = require("express").Router();

router.use("/", require("./health.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/customer-auth", require("./customer-auth.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/admin-users", require("./admin-users.routes"));
router.use("/uploads", require("./uploads.routes").router);
router.use("/locations", require("./locations.routes"));
router.use("/services", require("./services.routes"));
router.use("/customers", require("./customers.routes"));
router.use("/providers", require("./providers.routes"));
router.use("/categories", require("./categories.routes"));
router.use("/cities", require("./cities.routes"));
router.use("/areas", require("./areas.routes"));
router.use("/bookings", require("./bookings.routes"));

module.exports = router;
