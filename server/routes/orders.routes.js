const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");
const verify = require("../middleware/verify.JWT");

router.use(verify);

router.post("/", ordersController.createOrder);
router.get("/", ordersController.getAllOrders);
router.get("/kitchen", ordersController.getKitchenOrders);
router.get("/:id", ordersController.getOrderById);
router.patch("/:id/status", ordersController.updateOrderStatus);

module.exports = router;