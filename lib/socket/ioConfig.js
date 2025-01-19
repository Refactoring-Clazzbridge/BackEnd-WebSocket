const { Server } = require("socket.io");
const { socketEventRegist } = require("./socketEvents");
const { handleChatMessages } = require("../../services/chatService");
const { redisClient } = require("../redis/redisClient");

// CORS 설정 상수 정의
const CORS_OPTIONS = {
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true,
};

let io;

// 소켓 서버 초기화 함수
function initializeIo(server) {
  io = new Server(server, { cors: CORS_OPTIONS });

  io.on('connection', (socket) => {
    console.log('a user connected, socket id : ', socket.id);

    try {
      socketEventRegist(socket, io);
      handleChatMessages(socket, io, redisClient);
    } catch (error) {
      console.error('Error during socket connection:', error);
    }
  });

  return io;
}

module.exports = { initializeIo };