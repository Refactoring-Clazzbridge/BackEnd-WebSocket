const { redisClient } = require("./redisClient");

const scanAllUsers = async (cursor = '0', keys = []) => {
    return new Promise((resolve, reject) => {
      redisClient.scan(cursor, 'MATCH', 'user:*', 'COUNT', 100, (err, res) => {
        if (err) return reject(err);
  
        const [newCursor, newKeys] = res;
        const filteredKeys = newKeys.filter(key => !key.includes(':undefined'));
        keys.push(...filteredKeys);
  
        if (newCursor === '0') {
          resolve(keys);
        } else {
          resolve(scanAllChats(newCursor, keys));
        }
      });
    });
  }

  module.exports = scanAllUsers;