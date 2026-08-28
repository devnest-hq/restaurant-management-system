const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const verify = require("../middleware/verify.JWT");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", verify, authController.logout);
router.post("/change-password", verify, authController.changePassword);

module.exports = router;