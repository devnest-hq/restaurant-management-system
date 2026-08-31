const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const verify = require("../middleware/verify.JWT");
const { validate } = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiters");
const { registerSchema, loginSchema, changePasswordSchema } = require("../schemas/auth.schema");

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", verify, authController.logout);
router.post("/change-password", verify, authLimiter, validate(changePasswordSchema), authController.changePassword);

module.exports = router;