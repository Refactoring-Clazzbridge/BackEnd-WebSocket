// 현재 사용자의 채팅 파트너를 제외한 사용자 목록 요청 핸들러
const getAvailableUsersHandler = async (socket, data, callback) => {
    try {
      const { userId } = data;
      const allUsers = await redisClient.smembers('users');
      const availableUsers = allUsers.filter(id => id !== userId);
      callback({ success: true, availableUsers });
    } catch (error) {
      console.error('Error fetching available users:', error);
      callback({ success: false, message: 'Failed to fetch available users' });
    }
  };
  
  module.exports = getAvailableUsersHandler;