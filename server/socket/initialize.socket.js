const jwt = require("jsonwebtoken");

const initializeSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }
    console.log("Token received:", token);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error("Invalid or expired token"));
      }
        
      socket.userId = decoded.userId;
      next();
    });
  });

  io.on("connection", (socket) => {
    socket.join(`user-${socket.userId}`);
    socket.on("disconnect", () => {
      console.log(`user-${socket.userId} disconnected`);
    });
  });
  
}

module.exports = initializeSocket;