const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { generalLimiter } = require("./middleware/rateLimiters");
const authRoutes = require("./routes/auth.routes");
const menuRoutes = require("./routes/menu.routes");
const reservationRoutes = require("./routes/reservations.routes");
const tableRoutes = require("./routes/table.routes");
const notificationRoutes = require("./routes/notification.routes");
const ordersRoutes = require("./routes/orders.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(generalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("DevNest Restaurant Management API is running");
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File is too large. Max size is 5MB." });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.message && err.message.includes("Only PNG, JPEG, JPG, and WebP")) {
    return res.status(400).json({ error: err.message });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: "Internal server error" });
});
  

module.exports = app;