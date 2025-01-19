const { redisClient } = require("./redisClient");

const getUserCourseId = async function(redisClient, userId) {
    return new Promise((resolve, reject) => {
        redisClient.hget(`user:${userId}`, 'courseId', (err, result) => {
        if (err) return reject(err);
        resolve(result);
        });
    });
}

  module.exports = getUsersByCourse;