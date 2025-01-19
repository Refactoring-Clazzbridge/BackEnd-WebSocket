require("dotenv").config();
const { createClient } = require('redis');

// Redis 클라이언트 생성
const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true,
});

// Redis 초기화 함수
async function initializeRedis() {
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  try {
    await redisClient.connect();
    console.log("Connected to Redis");

    await redisClient.select(1); // Redis 데이터베이스 선택
    console.log("Redis DB selected");
  } catch (error) {
    console.error("Error initializing Redis:", error);
    throw error; // 에러를 호출하는 쪽에서 처리할 수 있도록 throw
  }

  return redisClient;
}

// Redis에서 사용자 정보를 가져오는 함수
async function getUserInfoFromRedis(userId) {
  return new Promise((resolve, reject) => {
    redisClient.hgetall(`user:${userId}`, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

module.exports = { initializeRedis, getUserInfoFromRedis, redisClient };