require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const app = require("./app");
const initializeSocket = require("./socket/initialize.socket");
const notificationService = require("./services/notification.service");
const cleanupExpiredTokens = require("./jobs/cleanupExpiredTokens");
const { allowedOrigins, corsOptions } = require("./config/cors");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

initializeSocket(io);

app.set("io", io);

notificationService.setSocketIO(io);

cron.schedule("30 10 * * *", cleanupExpiredTokens, {
  scheduled: true,
  timezone: "Africa/Lagos"
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});