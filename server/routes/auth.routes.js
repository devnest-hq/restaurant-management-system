const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");

router.post("/register", authController.register);
router.post("/register-staff", verify, verifyRole(["ADMIN"]), authController.registerStaff);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", verify, authController.logout);

module.exports = router;