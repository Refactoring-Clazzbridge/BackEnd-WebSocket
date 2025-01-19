const { redisClient } = require("./redisClient");

// 새 메시지를 처리하는 함수
const newMessageHandler = async (userId, message) => {
  const newMsgCount = await new Promise((resolve, reject) => {
    redisClient.incr(`${message.chatId}:messages:counter`, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

  const chatKey = message.chatId;
  const messageData = {
    id: newMsgCount,
    content: message.content,
    timestamp: new Date(Date.now()),
    sender: String(userId),
  };

  return new Promise((resolve, reject) => {
    redisClient.rpush(`${chatKey}:messages`, JSON.stringify(messageData), (err, result) => {
      if (err) return reject(err);
      resolve(messageData);
    });
  });
};

module.exports = newMessageHandler;