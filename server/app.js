const express = require("express");
const cors = require("cors");
const ordersRoutes = require("./routes/orders.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/orders", ordersRoutes);
app.get("/", (req, res) => {
  res.send("DevNest Restaurant Management API is running");
});

module.exports = app;