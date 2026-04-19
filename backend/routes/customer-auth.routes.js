const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/customer-auth.controller");

// Mirror the strict limit used on /api/auth/login
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many attempts. Try again later." } },
});

router.post("/signup", loginLimiter, ctrl.signup);
router.post("/login", loginLimiter, ctrl.login);
router.get("/me", ctrl.me);
router.post("/change-password", ctrl.changePassword);
router.post("/forgot-password", loginLimiter, ctrl.forgotPassword);
router.post("/reset-password", loginLimiter, ctrl.resetPassword);

module.exports = router;
