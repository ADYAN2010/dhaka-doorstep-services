const router = require("express").Router();
const { login, me, bootstrap, changePassword } = require("../controllers/auth.controller");

router.post("/login", login);
router.get("/me", me);
router.post("/change-password", changePassword);
router.post("/bootstrap", bootstrap);

module.exports = router;
