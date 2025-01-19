// 손 들기 핸들러
const raiseHandHandler = async (socket, raiseHand) => {
    try {
      await redisClient.hset(`user:${socket.user.id}`, 'raiseHand', String(raiseHand));
      setTimeout(() => {
        redisClient.hset(`user:${socket.user.id}`, 'raiseHand', String(false));
      }, 15000);
      console.log('raiseHand:', raiseHand);
    } catch (error) {
      console.error('Error setting raiseHand:', error);
    }
  };
  
  module.exports = raiseHandHandler;