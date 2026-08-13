const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");

router.post("/", ordersController.createOrder);
router.get("/", ordersController.getAllOrders);
router.get("/:id", ordersController.getOrderById);
router.patch("/:id/status", ordersController.updateOrderStatus);

module.exports = router;