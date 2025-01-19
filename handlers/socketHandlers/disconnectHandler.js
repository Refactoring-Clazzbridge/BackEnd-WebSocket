const { setUserOnlineStatus } = require("./chatService");

// 소켓 연결 해제 핸들러
const disconnectHandler = async (socket) => {
  console.log(`${socket.id} disconnected`);
  try {
    await setUserOnlineStatus(socket.userId, false);
    console.log("User online status set to false");
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

module.exports = disconnectHandler;