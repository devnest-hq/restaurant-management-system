const jwt = require("jsonwebtoken");

const initializeSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error("Invalid or expired token"));
      }

      socket.userId = decoded.userId;
      socket.role = decoded.role;
      next();
    });
  });

  io.on("connection", (socket) => {
    socket.join(`user-${socket.userId}`);
    socket.join(`role-${socket.role}`);

    socket.on("disconnect", () => {
      console.log(`user-${socket.userId} disconnected`);
    });
  });
};

module.exports = initializeSocket;