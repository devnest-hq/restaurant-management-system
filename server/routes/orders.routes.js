const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");

router.use(verify);

router.post("/", verifyRole(["CUSTOMER", "WAITER", "ADMIN"]), ordersController.createOrder);
router.get("/", verifyRole(["CUSTOMER", "WAITER", "CHEF", "ADMIN"]), ordersController.getAllOrders);
router.get("/kitchen", verifyRole(["CHEF", "ADMIN"]), ordersController.getKitchenOrders);
router.get("/:id", verifyRole(["CUSTOMER", "WAITER", "CHEF", "ADMIN"]), ordersController.getOrderById);
router.patch("/:id/status", verifyRole(["CHEF", "WAITER", "ADMIN"]), ordersController.updateOrderStatus);
router.get("/:id/invoice", verifyRole(["CUSTOMER", "WAITER", "ADMIN"]), ordersController.getInvoice);

module.exports = router;