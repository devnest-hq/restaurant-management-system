const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");
const verify = require("../middleware/verify.JWT");
const verifyRole = require("../middleware/verify.role");
const requirePasswordChange = require("../middleware/verify.password.change");

router.use(verify);
router.use(requirePasswordChange);

router.post("/", verifyRole(["CUSTOMER", "WAITER", "ADMIN"]), validate(createOrderSchema), ordersController.createOrder);
router.get("/", verifyRole(["CUSTOMER", "WAITER", "CHEF", "ADMIN"]), ordersController.getAllOrders);
router.get("/kitchen", verifyRole(["CHEF", "ADMIN"]), ordersController.getKitchenOrders);
router.get("/:id", verifyRole(["CUSTOMER", "WAITER", "CHEF", "ADMIN"]), validateParams(idParamSchema), ordersController.getOrderById);
router.patch("/:id/status", verifyRole(["CHEF", "WAITER", "ADMIN"]), validateParams(idParamSchema), validate(updateOrderStatusSchema), ordersController.updateOrderStatus);

router.get("/:id/invoice", verifyRole(["CUSTOMER", "WAITER", "ADMIN"]), validateParams(idParamSchema), ordersController.getInvoice);

module.exports = router;