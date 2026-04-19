const router = require("express").Router();
const { login, me, bootstrap } = require("../controllers/auth.controller");

router.post("/login", login);
router.get("/me", me);
router.post("/bootstrap", bootstrap);

module.exports = router;
