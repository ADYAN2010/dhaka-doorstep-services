const router = require("express").Router();
const ctrl = require("../controllers/health.controller");

router.get("/health", ctrl.health);
router.get("/test-db", ctrl.testDb);

module.exports = router;
