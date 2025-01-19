// 이해도 설정 핸들러
const understandingHandler = async (socket, understanding) => {
    try {
      await redisClient.hset(`user:${socket.user.id}`, 'understanding', String(understanding));
      console.log('understanding:', understanding);
    } catch (error) {
      console.error('Error setting understanding:', error);
    }
  };
  
  module.exports = understandingHandler;