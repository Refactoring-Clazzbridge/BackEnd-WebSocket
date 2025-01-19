const { setUserOnlineStatus, getAllChatsFromUserId } = require("./chatService");
const { redisClient } = require("./redisClient");

// 등록 이벤트 핸들러
const registerHandler = async (socket, data) => {
  const userData = await redisClient.hgetall(`user:${data.userId}`);
  if (!userData) {
    console.log("No data found for user:", data.userId);
    return null;
  }

  socket.user = userData;
  socket.userId = data.userId;

  await setUserOnlineStatus(socket.userId, true);
  console.log("User online status set to true");

  const roomsForUser = await getAllChatsFromUserId(socket.userId);
  roomsForUser.forEach(room => {
    socket.join(room.id);
    console.log(`Socket ${socket.id} joined room ${room.id}`);
  });

  socket.emit('initCompleted');
};

module.exports = registerHandler;