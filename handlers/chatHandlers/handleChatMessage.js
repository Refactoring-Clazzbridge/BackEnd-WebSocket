const { redisClient } = require("./redisClient");

// 채팅 메시지를 처리하는 함수
const handleChatMessages = (socket, io) => {
  socket.on('chat message', (msg) => {
    redisClient.rPush('messages', JSON.stringify({ user: "test", msg }));
    io.emit('chat message', msg);
  });
};

module.exports = handleChatMessages;