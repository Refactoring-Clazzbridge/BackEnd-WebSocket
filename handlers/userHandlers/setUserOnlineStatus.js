const { redisClient } = require("./redisClient");

// 사용자 온라인 상태 설정 함수
const setUserOnlineStatus = async (userId, isOnline) => {
  return new Promise((resolve, reject) => {
    redisClient.hset(`user:${userId}`, 'online', String(isOnline), (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = setUserOnlineStatus;