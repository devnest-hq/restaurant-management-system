require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const initializeSocket = require("./socket/initialize.socket");
const notificationService = require("./services/notification.service");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

initializeSocket(io);

app.set("io", io);

notificationService.setSocketIO(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});