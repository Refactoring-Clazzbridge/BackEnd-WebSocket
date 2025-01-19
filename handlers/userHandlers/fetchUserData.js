const { redisClient } = require("./redisClient");

// 사용자 데이터를 저장하는 함수
const fetchUserData = async (user) => {
  return new Promise((resolve, reject) => {
    redisClient.hset(`user:${user.id}`, 'name', user.name, 'username', `@${user.memberId}`, 'avatar', user.avatarImage, 'role', user.role, 'courseId', user.courseId, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = fetchUserData;