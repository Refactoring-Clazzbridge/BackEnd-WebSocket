const { redisClient } = require("./redisClient");

// 모든 채팅을 스캔하는 함수
const scanAllChats = (cursor = '0', keys = []) => {
  return new Promise((resolve, reject) => {
    redisClient.scan(cursor, 'MATCH', 'room:*', 'COUNT', 100, (err, res) => {
      if (err) return reject(err);

      const [newCursor, newKeys] = res;
      const filteredKeys = newKeys.filter(key => !key.includes(':messages'));
      keys.push(...filteredKeys);

      if (newCursor === '0') {
        resolve(keys);
      } else {
        resolve(scanAllChats(newCursor, keys));
      }
    });
  });
};

module.exports = scanAllChats;