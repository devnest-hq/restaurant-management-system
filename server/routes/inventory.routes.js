const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const verify = require("../middleware/verify.JWT");

router.use(verify);

router.post("/", inventoryController.createInventoryItem);
router.get("/", inventoryController.getAllInventoryItems);
router.get("/low-stock", inventoryController.getLowStockItems);
router.get("/:id", inventoryController.getInventoryItemById);
router.patch("/:id", inventoryController.updateInventoryItem);
router.delete("/:id", inventoryController.deleteInventoryItem);

module.exports = router;