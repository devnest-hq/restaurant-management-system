const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");

router.use(verify);

router.post("/", verifyRole(["ADMIN"]), inventoryController.createInventoryItem);
router.get("/", verifyRole(["CHEF", "ADMIN"]), inventoryController.getAllInventoryItems);
router.get("/low-stock", verifyRole(["CHEF", "ADMIN"]), inventoryController.getLowStockItems);
router.get("/:id", verifyRole(["CHEF", "ADMIN"]), inventoryController.getInventoryItemById);
router.patch("/:id", verifyRole(["ADMIN"]), inventoryController.updateInventoryItem);
router.delete("/:id", verifyRole(["ADMIN"]), inventoryController.deleteInventoryItem);

module.exports = router;