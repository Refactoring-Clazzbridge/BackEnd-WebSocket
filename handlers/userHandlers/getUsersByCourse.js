const { redisClient } = require("./redisClient");
const scanAllUsers = require("./scanAllUsers");

// 과정별 사용자 가져오기 함수
const getUsersByCourse = async (courseId) => {
  const userKeys = await scanAllUsers();
  const filteredUsers = [];

  for (const key of userKeys) {
    const user = await new Promise((resolve, reject) => {
      redisClient.hgetall(key, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (String(user.course_id) === String(courseId)) {
      filteredUsers.push(user);
    }
  }

  return filteredUsers;
};

module.exports = getUsersByCourse;