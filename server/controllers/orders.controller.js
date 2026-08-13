const orderService = require("../services/orders.service");

exports.createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);

    const io = req.app.get("io");
    if (io) io.emit("new-order", order);

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    res.json(await orderService.getAllOrders());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
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