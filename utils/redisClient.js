require("dotenv").config();
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true,
});

async function initializeRedis() {
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  await redisClient.connect();
  console.log("Connected to Redis");
  await redisClient.select(1);
  console.log("redis db selected");

  return redisClient;
}

async function getUserInfoFromRedis(redisClient, userId) {
  return new Promise((resolve, reject) => {
    redisClient.hgetall(`user:${userId}`, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

module.exports = { initializeRedis, getUserInfoFromRedis, redisClient };