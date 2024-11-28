const { Server } = require("socket.io");
const { socketEventRegist } = require("./socketEvents");
const { handleChatMessages } = require("./chatService");
const { redisClient } = require("./redisClient");

let io;

function initializeIo(server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('a user connected, socket id : ', socket.id);

    socketEventRegist(socket, io);
    handleChatMessages(socket, io, redisClient);
  });

  return io;
}

module.exports = { initializeIo };
