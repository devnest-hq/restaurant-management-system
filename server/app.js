const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const ordersRoutes = require("./routes/orders.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/inventory", inventoryRoutes);
app.get("/", (req, res) => {
  res.send("DevNest Restaurant Management API is running");
});

module.exports = app;