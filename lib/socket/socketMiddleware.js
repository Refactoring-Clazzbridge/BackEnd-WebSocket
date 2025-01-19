const { verifyToken } = require("../auth/auth");

// 소켓 미들웨어
const socketMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.error("No token provided");
    return next(new Error("Authentication error"));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.error("Invalid token");
    return next(new Error("Authentication error"));
  }

  next();
};

module.exports = socketMiddleware;