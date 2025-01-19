const { redisClient } = require("./redisClient");

// 사용자 데이터를 가져오는 함수
const getUserData = async (userId) => {
  return new Promise((resolve, reject) => {
    redisClient.hgetall(`user:${userId}`, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = getUserData;