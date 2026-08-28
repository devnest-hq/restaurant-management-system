const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const requirePasswordChange = require("../middleware/verify.password.change");

router.use(verify);
router.use(verifyRole(["ADMIN"]));
router.use(requirePasswordChange);

router.post("/create-staff", adminController.createStaff);
router.get("/staff", adminController.getAllStaff);
router.get("/staff/:id", adminController.getStaffById);
router.patch("/staff/:id", adminController.updateStaff);
router.delete("/staff/:id", adminController.deleteStaff);
router.get("/popular-item", adminController.mostOrderedMenuItems);
router.get("/sales-report", adminController.salesReport);
router.get("/dashboard", adminController.dashboardStats);
module.exports = router;