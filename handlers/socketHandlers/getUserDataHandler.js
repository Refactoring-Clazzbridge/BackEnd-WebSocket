const { getUserData } = require("./chatService");

// 사용자 데이터 가져오기 핸들러
const getUserDataHandler = async (socket, userId) => {
  try {
    const userData = await getUserData(redisClient, userId);
    socket.emit('gotUserData', userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

module.exports = getUserDataHandler;