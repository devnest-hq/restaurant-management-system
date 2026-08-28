const orderService = require("../services/orders.service");
const invoiceService = require("../services/invoice.service");


exports.createOrder = async (req, res) => {
  try {
    const  items  = req.body.items;
    const  customerId  = req.user.userId;
    const order = await orderService.createOrder({ customerId, items });

    const io = req.app.get("io");
    if (io) io.emit("new-order", order);

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = req.user.role === "CUSTOMER"
      ? await orderService.getOrdersByCustomer(req.user.userId)
      : await orderService.getAllOrders();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (req.user.role === "CUSTOMER" && order.customerId !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);

    const io = req.app.get("io");
    if (io) io.emit("order-status-updated", order);

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

exports.getKitchenOrders = async (req, res) => {
  try {
    const orders = await orderService.getKitchenOrders();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch kitchen orders" });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceByOrderId(req.params.id, req.user);
    res.status(200).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
};