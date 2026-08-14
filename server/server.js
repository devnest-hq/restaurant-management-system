require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});