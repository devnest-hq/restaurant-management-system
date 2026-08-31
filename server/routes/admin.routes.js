const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const requirePasswordChange = require("../middleware/verify.password.change");
const { validate, validateParams } = require("../middleware/validate");
const { createStaffSchema, updateStaffSchema } = require("../schemas/admin.schema");
const { idParamSchema } = require("../schemas/common.schema");

router.use(verify);
router.use(requirePasswordChange);
router.use(verifyRole(["ADMIN"]));

router.post("/create-staff", validate(createStaffSchema), adminController.createStaff);
router.get("/staff", adminController.getAllStaff);
router.get("/staff/:id", validateParams(idParamSchema), adminController.getStaffById);
router.patch("/staff/:id", validateParams(idParamSchema), validate(updateStaffSchema), adminController.updateStaff);
router.delete("/staff/:id", validateParams(idParamSchema), adminController.deleteStaff);
router.get("/popular-item", adminController.mostOrderedMenuItems);
router.get("/sales-report", adminController.salesReport);
router.get("/dashboard", adminController.dashboardStats);
module.exports = router;