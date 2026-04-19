/**
 * Mount all feature routers here.
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
router.use("/contact-messages", require("./contact-messages.routes"));
router.use("/provider-applications", require("./provider-applications.routes"));
router.use("/blog", require("./blog.routes"));

module.exports = router;
