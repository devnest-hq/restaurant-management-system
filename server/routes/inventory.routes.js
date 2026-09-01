const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const requirePasswordChange = require("../middleware/verify.password.change");
const { validate, validateParams } = require("../middleware/validate");
const { createInventoryItemSchema, createInventoryItemsBulkSchema, updateInventoryItemSchema } = require("../schemas/inventory.schema");
const { idParamSchema } = require("../schemas/common.schema");

router.use(verify);
router.use(requirePasswordChange);

router.post("/", verifyRole(["ADMIN"]), validate(createInventoryItemSchema), inventoryController.createInventoryItem);
router.post("/bulk", verifyRole(["ADMIN"]), validate(createInventoryItemsBulkSchema), inventoryController.createInventoryItems);
router.get("/", verifyRole(["CHEF", "ADMIN"]), inventoryController.getAllInventoryItems);
router.get("/low-stock", verifyRole(["CHEF", "ADMIN"]), inventoryController.getLowStockItems);
router.get("/:id", verifyRole(["CHEF", "ADMIN"]), validateParams(idParamSchema), inventoryController.getInventoryItemById);
router.patch("/:id", verifyRole(["ADMIN"]), validateParams(idParamSchema), validate(updateInventoryItemSchema), inventoryController.updateInventoryItem);
router.delete("/:id", verifyRole(["ADMIN"]), validateParams(idParamSchema), inventoryController.deleteInventoryItem);

module.exports = router;